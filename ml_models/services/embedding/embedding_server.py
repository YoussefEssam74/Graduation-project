#!/usr/bin/env python3
"""
Embedding microservice using sentence-transformers and Flask.

Endpoints:
- POST /embed   -> { "texts": ["...", ...] } returns { "embeddings": [[...], ...] }
- POST /upsert  -> { "items": [{id, text}, ...] } upserts embeddings to Exercises.Embedding
- POST /knowledge/upsert -> { "items": [{id, category, text, metadata}, ...] } upserts to KnowledgeEmbeddings
- POST /knowledge/search -> { "query": "...", "top_k": 5, "category": null } returns similar knowledge
- GET  /knowledge/stats  -> Returns knowledge base statistics
- GET  /health  -> Health check

This script is intentionally minimal and safe for MVP. It uses CPU by default.
"""
import os
import json
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from pgvector.psycopg2 import register_vector
from pgvector import Vector
import numpy as np

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise ValueError("DATABASE_URL environment variable is required. Please set it in your environment.")

MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
# Limit parallelism to reduce CPU and memory usage on constrained machines
os.environ.setdefault("OMP_NUM_THREADS", os.environ.get("EMBEDDER_OMP_THREADS", "1"))
os.environ.setdefault("OPENBLAS_NUM_THREADS", os.environ.get("EMBEDDER_OPENBLAS_THREADS", "1"))
os.environ.setdefault("MKL_NUM_THREADS", os.environ.get("EMBEDDER_MKL_THREADS", "1"))
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

app = Flask(__name__)

print(f"Loading embedding model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)


def get_db_conn():
    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    return conn


MAX_TEXTS = int(os.environ.get("MAX_EMBED_TEXTS", "100"))  # Configurable limit

@app.route("/embed", methods=["POST"])
def embed():
    data = request.get_json(force=True) or {}
    texts = data.get("texts")
    if not texts or not isinstance(texts, list):
        return jsonify({"error": "Provide a JSON body with a `texts` array."}), 400

    if len(texts) > MAX_TEXTS:
        return jsonify({"error": f"Too many texts ({len(texts)}). Maximum allowed: {MAX_TEXTS}"}), 400

    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    embeddings = [np.asarray(e).tolist() for e in embeddings]
    return jsonify({"embeddings": embeddings})


@app.route("/upsert", methods=["POST"])
def upsert():
    """Upsert embeddings to Exercises table (legacy endpoint)."""
    data = request.get_json(force=True) or {}
    items = data.get("items")
    if not items or not isinstance(items, list):
        return jsonify({"error": "Provide a JSON body with an `items` array of {id, text} objects."}), 400

    MAX_BATCH_SIZE = int(os.environ.get("MAX_UPSERT_BATCH", "500"))
    if len(items) > MAX_BATCH_SIZE:
        return jsonify({"error": f"Too many items ({len(items)}). Maximum batch size: {MAX_BATCH_SIZE}"}), 400

    # Validate all items have IDs
    for idx, item in enumerate(items):
        if not item.get("id"):
            return jsonify({"error": f"Item at index {idx} is missing required 'id' field."}), 400

    texts = [item.get("text", "") for item in items]
    ids = [item.get("id") for item in items]

    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    rows = []
    for i in range(len(ids)):
        vec = Vector(embeddings[i].tolist())
        rows.append((ids[i], vec))

    conn = get_db_conn()
    cur = conn.cursor()
    try:
        sql = "INSERT INTO \"Exercises\" (\"Id\", \"Embedding\") VALUES %s ON CONFLICT (\"Id\") DO UPDATE SET \"Embedding\" = EXCLUDED.\"Embedding\";"
        execute_values(cur, sql, rows)
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({"upserted": len(rows)})


# ========================================
# Knowledge Base Endpoints for RAG
# ========================================

@app.route("/knowledge/upsert", methods=["POST"])
def knowledge_upsert():
    """
    Upsert knowledge documents to KnowledgeEmbeddings table.
    
    Request body:
    {
        "items": [
            {"id": "vol_001", "category": "training_volume", "text": "...", "metadata": {...}},
            ...
        ]
    }
    """
    data = request.get_json(force=True) or {}
    items = data.get("items")
    if not items or not isinstance(items, list):
        return jsonify({"error": "Provide a JSON body with an `items` array."}), 400

    # Validate all items have IDs before processing
    for idx, item in enumerate(items):
        if not item.get("id"):
            return jsonify({"error": f"Item at index {idx} is missing required 'id' field."}), 400

    # Extract texts and generate embeddings
    texts = [item.get("text", "") for item in items]
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)

    # Prepare rows for upsert
    rows = []
    for i, item in enumerate(items):
        vec = Vector(embeddings[i].tolist())
        metadata_json = json.dumps(item.get("metadata", {})) if item.get("metadata") else None
        rows.append((
            item.get("id"),
            item.get("category", "general"),
            item.get("text", ""),
            vec,
            metadata_json
        ))

    conn = get_db_conn()
    cur = conn.cursor()
    try:
        sql = """
            INSERT INTO "KnowledgeEmbeddings" ("Id", "Category", "Text", "Embedding", "Metadata", "UpdatedAt")
            VALUES %s
            ON CONFLICT ("Id") DO UPDATE SET
                "Category" = EXCLUDED."Category",
                "Text" = EXCLUDED."Text",
                "Embedding" = EXCLUDED."Embedding",
                "Metadata" = EXCLUDED."Metadata",
                "UpdatedAt" = NOW(),
                "Version" = "KnowledgeEmbeddings"."Version" + 1;
        """
        execute_values(cur, sql, rows, template="(%s, %s, %s, %s, %s, NOW())")
        conn.commit()
        return jsonify({"upserted": len(rows), "success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/knowledge/search", methods=["POST"])
def knowledge_search():
    """
    Search for similar knowledge documents using cosine similarity.
    
    Request body:
    {
        "query": "How many sets per week for beginners?",
        "top_k": 5,
        "category": null,  // Optional category filter
        "min_similarity": 0.3
    }
    """
    data = request.get_json(force=True) or {}
    query = data.get("query")
    if not query:
        return jsonify({"error": "Provide a `query` string."}), 400

    # Validate and coerce top_k
    try:
        top_k = int(data.get("top_k", 5))
        if top_k < 1:
            top_k = 1
        elif top_k > 100:
            top_k = 100
    except (ValueError, TypeError):
        top_k = 5

    # Validate and coerce min_similarity
    try:
        min_similarity = float(data.get("min_similarity", 0.3))
        if min_similarity < 0.0:
            min_similarity = 0.0
        elif min_similarity > 1.0:
            min_similarity = 1.0
    except (ValueError, TypeError):
        min_similarity = 0.3

    category = data.get("category")

    # Generate embedding for query
    query_embedding = model.encode([query], show_progress_bar=False, convert_to_numpy=True)[0]
    vec = Vector(query_embedding.tolist())

    conn = get_db_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Use the similarity search function or inline query
        if category:
            sql = """
                SELECT 
                    "Id" as id,
                    "Category" as category,
                    "Text" as text,
                    "Metadata" as metadata,
                    (1 - ("Embedding" <=> %s::vector)) as similarity
                FROM "KnowledgeEmbeddings"
                WHERE "IsActive" = TRUE
                  AND "Category" = %s
                  AND (1 - ("Embedding" <=> %s::vector)) >= %s
                ORDER BY "Embedding" <=> %s::vector
                LIMIT %s;
            """
            cur.execute(sql, (str(vec), category, str(vec), min_similarity, str(vec), top_k))
        else:
            sql = """
                SELECT 
                    "Id" as id,
                    "Category" as category,
                    "Text" as text,
                    "Metadata" as metadata,
                    (1 - ("Embedding" <=> %s::vector)) as similarity
                FROM "KnowledgeEmbeddings"
                WHERE "IsActive" = TRUE
                  AND (1 - ("Embedding" <=> %s::vector)) >= %s
                ORDER BY "Embedding" <=> %s::vector
                LIMIT %s;
            """
            cur.execute(sql, (str(vec), str(vec), min_similarity, str(vec), top_k))

        results = cur.fetchall()
        
        # Parse metadata JSON
        for row in results:
            if row.get("metadata") and isinstance(row["metadata"], str):
                try:
                    row["metadata"] = json.loads(row["metadata"])
                except (json.JSONDecodeError, TypeError, ValueError):
                    # Leave metadata as-is if parsing fails
                    pass

        return jsonify({
            "results": results,
            "query": query,
            "count": len(results)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/knowledge/stats", methods=["GET"])
def knowledge_stats():
    """Get statistics about the knowledge base."""
    conn = get_db_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Total count
        cur.execute('SELECT COUNT(*) as total FROM "KnowledgeEmbeddings" WHERE "IsActive" = TRUE;')
        total = cur.fetchone()["total"]

        # Count by category
        cur.execute('''
            SELECT "Category", COUNT(*) as count 
            FROM "KnowledgeEmbeddings" 
            WHERE "IsActive" = TRUE 
            GROUP BY "Category";
        ''')
        by_category = {row["Category"]: row["count"] for row in cur.fetchall()}

        # Last updated
        cur.execute('SELECT MAX("UpdatedAt") as last_updated FROM "KnowledgeEmbeddings";')
        last_updated = cur.fetchone()["last_updated"]

        return jsonify({
            "total_documents": total,
            "by_category": by_category,
            "last_updated": str(last_updated) if last_updated else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.route("/knowledge/load-file", methods=["POST"])
def knowledge_load_file():
    """
    Load knowledge documents from a JSON file path.
    
    Request body:
    {
        "file_path": "/path/to/knowledge_chunks.json"
    }
    """
    data = request.get_json(force=True) or {}
    file_path = data.get("file_path")
    if not file_path:
        return jsonify({"error": "Provide a `file_path`."}), 400

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            items = json.load(f)
        
        if not isinstance(items, list):
            return jsonify({"error": "JSON file must contain an array of documents."}), 400

        # Generate embeddings
        texts = [item.get("text", "") for item in items]
        embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

        # Prepare rows
        rows = []
        for i, item in enumerate(items):
            vec = Vector(embeddings[i].tolist())
            metadata_json = json.dumps(item.get("metadata", {})) if item.get("metadata") else None
            rows.append((
                item.get("id"),
                item.get("category", "general"),
                item.get("text", ""),
                vec,
                metadata_json
            ))

        conn = get_db_conn()
        cur = conn.cursor()
        try:
            sql = """
                INSERT INTO "KnowledgeEmbeddings" ("Id", "Category", "Text", "Embedding", "Metadata", "UpdatedAt")
                VALUES %s
                ON CONFLICT ("Id") DO UPDATE SET
                    "Category" = EXCLUDED."Category",
                    "Text" = EXCLUDED."Text",
                    "Embedding" = EXCLUDED."Embedding",
                    "Metadata" = EXCLUDED."Metadata",
                    "UpdatedAt" = NOW(),
                    "Version" = "KnowledgeEmbeddings"."Version" + 1;
            """
            execute_values(cur, sql, rows, template="(%s, %s, %s, %s, %s, NOW())")
            conn.commit()
            return jsonify({"loaded": len(rows), "file": file_path, "success": True})
        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e), "success": False}), 500
        finally:
            cur.close()
            conn.close()

    except FileNotFoundError:
        return jsonify({"error": f"File not found: {file_path}"}), 404
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME}), 200


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5100))
    app.run(host='0.0.0.0', port=port)

