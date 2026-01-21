"""
Knowledge RAG Retriever for Coach Assistant
===========================================

Retrieves relevant fitness/nutrition knowledge to augment LLM responses.
Uses FAISS for fast similarity search.
"""

import os
import sys
import logging
import pickle
from typing import List, Dict, Optional
import numpy as np

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from sentence_transformers import SentenceTransformer
    import faiss
    DEPS_AVAILABLE = True
except ImportError:
    DEPS_AVAILABLE = False

logger = logging.getLogger(__name__)


class KnowledgeRAG:
    """
    RAG retriever for fitness/nutrition knowledge base.

    Stores and retrieves relevant knowledge to provide
    context for the LLM's responses.
    """

    def __init__(self, config: Dict):
        """
        Initialize the knowledge RAG.

        Args:
            config: Configuration dictionary
        """
        self.config = config

        if not DEPS_AVAILABLE:
            logger.warning(
                "sentence-transformers or faiss not available. RAG disabled.")
            self.model = None
            self.index = None
            self.documents = []
            return

        # Embedding configuration
        emb_config = config.get('embeddings', {})
        self.model_name = emb_config.get(
            'model_name', 'sentence-transformers/all-MiniLM-L6-v2')
        self.dimension = emb_config.get('dimension', 384)

        # Index paths
        vs_config = config.get('vector_store', {})
        kb_config = vs_config.get('indexes', {}).get('knowledge_base', {})
        self.index_path = kb_config.get(
            'path', 'data/faiss_indexes/knowledge.index')
        self.metadata_path = kb_config.get(
            'metadata_path', 'data/faiss_indexes/knowledge_metadata.pkl')

        # Initialize model
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Knowledge RAG model loaded: {self.model_name}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None

        # Initialize index
        self.index: Optional[faiss.Index] = None
        self.documents: List[Dict] = []

        # Try to load existing index
        self._load_index()

    def _load_index(self):
        """Load existing index if available."""
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'rb') as f:
                    self.documents = pickle.load(f)
                logger.info(
                    f"Loaded knowledge index with {len(self.documents)} documents")
            else:
                logger.info(
                    "No knowledge index found. Call build_index() to create one.")
        except Exception as e:
            logger.error(f"Error loading index: {e}")

    def build_index(self, documents: List[Dict]) -> int:
        """
        Build FAISS index from documents.

        Args:
            documents: List of document dicts with 'content' field

        Returns:
            Number of documents indexed
        """
        if not self.model:
            raise RuntimeError("Model not loaded")

        if not documents:
            return 0

        # Create texts for embedding
        texts = [doc.get('content', doc.get('text', '')) for doc in documents]

        # Generate embeddings
        logger.info(f"Generating embeddings for {len(texts)} documents")
        embeddings = self.model.encode(texts, convert_to_numpy=True)

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        # Create index
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)

        # Store documents
        self.documents = documents

        # Save
        self._save_index()

        return len(documents)

    def _save_index(self):
        """Save index to disk."""
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(self.documents, f)
            logger.info("Knowledge index saved")
        except Exception as e:
            logger.error(f"Error saving index: {e}")

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for relevant documents.

        Args:
            query: Search query
            top_k: Number of results to return

        Returns:
            List of relevant documents
        """
        if not self.is_ready():
            return []

        try:
            # Embed query
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)

            # Search
            k = min(top_k, self.index.ntotal)
            scores, indices = self.index.search(query_embedding, k)

            results = []
            for i, idx in enumerate(indices[0]):
                if idx < 0 or idx >= len(self.documents):
                    continue

                doc = self.documents[idx].copy()
                doc['score'] = float(scores[0][i])
                results.append(doc)

            return results

        except Exception as e:
            logger.error(f"Error searching: {e}")
            return []

    def add_default_knowledge(self):
        """
        Add default fitness/nutrition knowledge base.

        This provides basic knowledge even without a database.
        """
        default_docs = [
            {
                "id": 1,
                "content": "Progressive overload is the gradual increase of stress placed on the body during exercise. This can be achieved by increasing weight, reps, sets, or decreasing rest time. It's essential for continued muscle growth and strength gains.",
                "category": "training"
            },
            {
                "id": 2,
                "content": "For muscle gain, aim for 0.7-1 gram of protein per pound of body weight daily. Good protein sources include chicken, fish, eggs, dairy, legumes, and protein supplements. Spread protein intake across meals for optimal absorption.",
                "category": "nutrition"
            },
            {
                "id": 3,
                "content": "Rest and recovery are crucial for muscle growth. Aim for 7-9 hours of sleep per night. Muscles grow during rest, not during training. Overtraining can lead to injury and hinder progress.",
                "category": "recovery"
            },
            {
                "id": 4,
                "content": "For weight loss, create a moderate calorie deficit of 300-500 calories below your maintenance level. Combine strength training with cardio. Prioritize protein to preserve muscle mass while losing fat.",
                "category": "weight_loss"
            },
            {
                "id": 5,
                "content": "Compound exercises like squats, deadlifts, bench press, rows, and overhead press work multiple muscle groups simultaneously and are more efficient for building overall strength and muscle than isolation exercises.",
                "category": "training"
            },
            {
                "id": 6,
                "content": "Stay hydrated by drinking at least 8 glasses of water daily, more during exercise. Dehydration can reduce performance by up to 25% and increase injury risk.",
                "category": "nutrition"
            },
            {
                "id": 7,
                "content": "For beginners, start with 3 full-body workouts per week with at least one rest day between sessions. Focus on learning proper form before increasing weight. A personal trainer can help ensure correct technique.",
                "category": "training"
            },
            {
                "id": 8,
                "content": "Warm up for 5-10 minutes before training with light cardio and dynamic stretches. Cool down with static stretching after workouts to improve flexibility and reduce muscle soreness.",
                "category": "training"
            },
            {
                "id": 9,
                "content": "If you have a knee injury, avoid high-impact exercises like running and jumping. Focus on low-impact alternatives like swimming, cycling, or upper body exercises. Always consult a physiotherapist.",
                "category": "injuries"
            },
            {
                "id": 10,
                "content": "Track your workouts and nutrition to monitor progress. Take progress photos and measurements monthly. The scale alone doesn't tell the full story - body composition changes are more important.",
                "category": "general"
            },
        ]

        self.build_index(default_docs)
        logger.info("Default knowledge base added")

    def is_ready(self) -> bool:
        """Check if RAG is ready to use."""
        return self.model is not None and self.index is not None and self.index.ntotal > 0

    def get_document_count(self) -> int:
        """Get number of documents in index."""
        return len(self.documents)
