"""RAG helper: retrieve context from vector store and build prompts.
Integrates with embedding_server and faiss_store for context retrieval.
"""
from typing import List, Dict
import requests
import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path to import faiss_store
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from faiss_store import FaissStore

EMBEDDING_SERVER_URL = os.environ.get('EMBEDDING_SERVER_URL', 'http://localhost:5100')
VECTOR_STORE_PATH = os.environ.get('VECTOR_STORE_PATH', 'data/faiss_index')


def get_embedding(text: str) -> List[float]:
    \"\"\"Get embedding for text from embedding server.\"\"\"
    try:
        response = requests.post(
            f\"{EMBEDDING_SERVER_URL}/embed\",
            json={\"texts\": [text]},
            timeout=10
        )
        response.raise_for_status()
        embeddings = response.json().get('embeddings', [])
        return embeddings[0] if embeddings else []
    except Exception as e:
        logger.error(f\"Failed to get embedding: {e}\")
        return []


def retrieve_context(query: str, top_k: int = 4) -> List[Dict]:
    \"\"\"Retrieve relevant context from vector store.
    Returns list of dicts with 'text', 'source', and 'score'.
    \"\"\"
    # Get query embedding
    query_emb = get_embedding(query)
    if not query_emb:
        logger.warning(\"Failed to get query embedding, returning empty context\")
        return []
    
    # Search vector store
    try:
        store = FaissStore(path=VECTOR_STORE_PATH)
        results = store.search(query_emb, k=top_k)
        
        # Format results
        contexts = []
        for r in results:
            metadata = r.get('metadata', {})
            contexts.append({
                'id': r.get('id'),
                'text': metadata.get('text', ''),
                'source': metadata.get('source', 'unknown'),
                'score': r.get('score', 0.0)
            })
        return contexts
    except Exception as e:
        logger.error(f\"Failed to retrieve context: {e}\")
        return []


def build_prompt(query: str, context: List[Dict], persona: str = 'coach') -> str:
    \"\"\"Build prompt combining query and retrieved context.\"\"\"
    ctx_text = \"\\n\".join([
        f\"[Source: {c.get('source', 'unknown')}] {c.get('text', '')}\"
        for c in context if c.get('text')
    ])
    
    if not ctx_text:
        ctx_text = \"No relevant context found.\"
    
    prompt = f\"\"\"You are a professional fitness coach. Persona: {persona}.

Context information from knowledge base:
{ctx_text}

User query: {query}

Respond helpfully and professionally. Base your answer on the context when relevant, but also use your general knowledge. Include sources when applicable.\"\"\"
    
    return prompt


def generate_reply(prompt: str, max_tokens: int = 512) -> str:
    \"\"\"Generate reply using local LLM or template.
    This is a stub - implement actual LLM call in production.
    \"\"\"
    # TODO: Implement actual LLM inference
    # Options: call coach_server/app.py model, or use transformers pipeline
    logger.warning(\"Using stub reply generation. Implement LLM call for production.\")
    return f\"[Generated response based on prompt of {len(prompt)} chars - implement actual LLM here]\"
