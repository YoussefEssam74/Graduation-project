"""FAISS vector store wrapper with persistence.
Supports adding embeddings, searching, and save/load.
Falls back to numpy-based search if FAISS not available.
"""
from typing import List, Dict
import numpy as np
import os
import pickle
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not available. Using numpy fallback for vector search.")


class FaissStore:
    def __init__(self, path: str = 'data/faiss_index', dim: int = 768):
        self.path = path
        self.dim = dim
        self._ids = []
        self._metadata = []
        self._embeddings = []  # fallback storage
        
        if FAISS_AVAILABLE:
            self._index = faiss.IndexFlatL2(dim)
        else:
            self._index = None
        
        # Try to load existing index
        if os.path.exists(f"{path}.pkl"):
            self.load()

    def add(self, ids: List[str], embeddings: np.ndarray, metadata: List[dict] = None):
        """Add embeddings; embeddings shape must be (N, dim)."""
        if embeddings.shape[1] != self.dim:
            raise ValueError(f'Embedding dimension mismatch: expected {self.dim}, got {embeddings.shape[1]}')
        
        self._ids.extend(ids)
        if metadata:
            self._metadata.extend(metadata)
        else:
            self._metadata.extend([{}] * len(ids))
        
        if FAISS_AVAILABLE and self._index:
            self._index.add(embeddings.astype('float32'))
        else:
            # Fallback: store embeddings in memory
            self._embeddings.append(embeddings)
        
        logger.info(f"Added {len(ids)} embeddings. Total: {len(self._ids)}")

    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """Return list of dicts: {id, score, metadata}."""
        if len(self._ids) == 0:
            return []
        
        k = min(k, len(self._ids))
        query = query_embedding.reshape(1, -1).astype('float32')
        
        if FAISS_AVAILABLE and self._index:
            distances, indices = self._index.search(query, k)
            results = []
            for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
                if idx < len(self._ids):
                    results.append({
                        'id': self._ids[idx],
                        'score': float(dist),
                        'metadata': self._metadata[idx] if idx < len(self._metadata) else {}
                    })
            return results
        else:
            # Numpy fallback: cosine similarity
            all_embeddings = np.vstack(self._embeddings) if self._embeddings else np.array([])
            if all_embeddings.shape[0] == 0:
                return []
            
            # Normalize for cosine similarity
            query_norm = query / (np.linalg.norm(query) + 1e-8)
            emb_norm = all_embeddings / (np.linalg.norm(all_embeddings, axis=1, keepdims=True) + 1e-8)
            similarities = np.dot(emb_norm, query_norm.T).flatten()
            top_indices = np.argsort(similarities)[::-1][:k]
            
            results = []
            for idx in top_indices:
                results.append({
                    'id': self._ids[idx],
                    'score': float(1 - similarities[idx]),  # convert to distance
                    'metadata': self._metadata[idx] if idx < len(self._metadata) else {}
                })
            return results

    def save(self):
        \"\"\"Persist index and metadata to disk.\"\"\"
        os.makedirs(os.path.dirname(self.path) if os.path.dirname(self.path) else '.', exist_ok=True)
        
        data = {
            'ids': self._ids,
            'metadata': self._metadata,
            'dim': self.dim,
            'embeddings': self._embeddings if not FAISS_AVAILABLE else []
        }
        
        with open(f\"{self.path}.pkl\", 'wb') as f:
            pickle.dump(data, f)
        
        if FAISS_AVAILABLE and self._index:
            faiss.write_index(self._index, f\"{self.path}.faiss\")
        
        logger.info(f\"Saved index with {len(self._ids)} items to {self.path}\")

    def load(self):
        \"\"\"Load index and metadata from disk.\"\"\"
        if not os.path.exists(f\"{self.path}.pkl\"):
            logger.warning(f\"No saved index found at {self.path}.pkl\")
            return
        
        with open(f\"{self.path}.pkl\", 'rb') as f:
            data = pickle.load(f)
        
        self._ids = data.get('ids', [])
        self._metadata = data.get('metadata', [])
        self.dim = data.get('dim', self.dim)
        self._embeddings = data.get('embeddings', [])
        
        if FAISS_AVAILABLE and os.path.exists(f\"{self.path}.faiss\"):
            self._index = faiss.read_index(f\"{self.path}.faiss\")
        
        logger.info(f\"Loaded index with {len(self._ids)} items from {self.path}\")
