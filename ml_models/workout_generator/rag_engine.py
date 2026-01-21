"""
Exercise RAG Engine for Workout Generator
=========================================

Uses FAISS for semantic search of exercises, with safety filtering.

Key Features:
- Embeds exercise descriptions using sentence-transformers
- Stores in FAISS for fast similarity search
- Filters results based on injury safety constraints
- Supports filtering by muscle group, equipment, difficulty

Note: Heavy ML dependencies (sentence-transformers, faiss) are optional.
      Without them, falls back to keyword-based matching from CSV dataset.
"""

from safety import SafetyFilter
from dataset_loader import get_dataset_loader, get_all_exercises
import os
import sys
import logging
import pickle
from typing import List, Dict, Optional, Any
import numpy as np

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Check dependencies without importing them (to avoid PyTorch loading)
DEPS_AVAILABLE = False
SentenceTransformer = None
faiss = None


def _check_ml_dependencies():
    """Lazily check if ML dependencies are available."""
    global DEPS_AVAILABLE, SentenceTransformer, faiss
    if DEPS_AVAILABLE:
        return True
    try:
        from sentence_transformers import SentenceTransformer as ST
        import faiss as f
        SentenceTransformer = ST
        faiss = f
        DEPS_AVAILABLE = True
        return True
    except ImportError:
        return False
    except OSError:
        # PyTorch DLL issues on Windows
        return False


logger = logging.getLogger(__name__)


class ExerciseRAG:
    """
    RAG engine for exercise retrieval.

    This class handles:
    1. Loading exercises from database
    2. Creating embeddings for semantic search
    3. Building and querying FAISS index
    4. Filtering results for safety
    """

    def __init__(self, config: Dict):
        """
        Initialize the RAG engine.

        Args:
            config: Configuration dictionary from config.yaml
        """
        self.config = config

        # Try to load ML dependencies
        deps_ok = _check_ml_dependencies()

        if not deps_ok:
            logger.warning(
                "ML dependencies not available. Using CSV database matching.")
            self.model = None
            self.index = None
            loader = get_dataset_loader()
            self.metadata = loader.get_all_exercises()  # Use CSV database (7959 exercises)
            logger.info(
                f"Loaded {len(self.metadata)} exercises from CSV dataset")
            return

        # Embedding model configuration
        emb_config = config.get('embeddings', {})
        self.model_name = emb_config.get(
            'model_name', 'sentence-transformers/all-MiniLM-L6-v2')
        self.dimension = emb_config.get('dimension', 384)

        # Vector store configuration
        vs_config = config.get('vector_store', {})
        index_config = vs_config.get('indexes', {}).get('exercises', {})
        self.index_path = index_config.get(
            'path', 'data/faiss_indexes/exercises.index')
        self.metadata_path = index_config.get(
            'metadata_path', 'data/faiss_indexes/exercises_metadata.pkl')

        # Search configuration
        self.top_k = vs_config.get('search', {}).get('top_k', 10)

        # Initialize model
        logger.info(f"Loading embedding model: {self.model_name}")
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {e}")
            self.model = None

        # Initialize index
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []

        # Try to load existing index or build from database
        if not self._load_index():
            logger.info("Building index from exercise database...")
            self.rebuild_index()

    def _load_index(self) -> bool:
        """Load existing FAISS index and metadata if available."""
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'rb') as f:
                    self.metadata = pickle.load(f)
                logger.info(f"Loaded index with {self.index.ntotal} exercises")
                return True
            else:
                logger.info("No existing index found.")
                return False
        except Exception as e:
            logger.error(f"Error loading index: {e}")
            return False

    def _save_index(self):
        """Save FAISS index and metadata to disk."""
        try:
            # Create directory if needed
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)

            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(self.metadata, f)

            logger.info(f"Saved index with {self.index.ntotal} exercises")
        except Exception as e:
            logger.error(f"Error saving index: {e}")

    def _get_exercises_from_db(self) -> List[Dict]:
        """
        Load exercises from database.

        Priority:
        1. SQL database (if configured)
        2. CSV dataset (7959 exercises)
        """
        # Try database connection first
        db_conn = os.environ.get('PULSEGYM_DB_CONN') or self.config.get(
            'database', {}).get('connection_string')

        if db_conn:
            try:
                from sqlalchemy import create_engine, text
                engine = create_engine(db_conn)
                with engine.connect() as conn:
                    result = conn.execute(text('''
                        SELECT Id, Name, Description, MuscleGroup, Equipment, Difficulty, Instructions
                        FROM Exercises
                    '''))
                    exercises = []
                    for row in result:
                        exercises.append({
                            'id': row[0],
                            'name': row[1],
                            'description': row[2] or '',
                            'muscle_group': row[3] or 'general',
                            'equipment': row[4].split(',') if row[4] else ['bodyweight'],
                            'difficulty': row[5] or 'intermediate',
                            'instructions': row[6] or ''
                        })
                    if exercises:
                        logger.info(
                            f"Loaded {len(exercises)} exercises from database")
                        return exercises
            except Exception as e:
                logger.warning(
                    f"Could not load from database: {e}. Using CSV dataset.")

        # Fall back to CSV dataset (7959 exercises)
        loader = get_dataset_loader()
        exercises = loader.get_all_exercises()
        logger.info(f"Loaded {len(exercises)} exercises from CSV dataset")
        return exercises

    def rebuild_index(self) -> int:
        """
        Rebuild the FAISS index from database exercises.

        Returns:
            Number of exercises indexed
        """
        if not self.model:
            # Fallback without embeddings - use CSV dataset
            loader = get_dataset_loader()
            self.metadata = loader.get_all_exercises()
            logger.info(
                f"Using {len(self.metadata)} exercises from CSV without embeddings")
            return len(self.metadata)

        # Get exercises from database
        exercises = self._get_exercises_from_db()

        if not exercises:
            logger.warning("No exercises found in database")
            return 0

        # Create text for embedding (combine name, description, muscle group)
        texts = []
        for ex in exercises:
            text = f"{ex['name']}. {ex.get('description', '')}. Target: {ex.get('muscle_group', '')}"
            texts.append(text)

        # Generate embeddings
        logger.info(f"Generating embeddings for {len(texts)} exercises")
        embeddings = self.model.encode(texts, convert_to_numpy=True)

        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)

        # Create FAISS index
        # Inner product for cosine similarity
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)

        # Store metadata
        self.metadata = exercises

        # Save to disk
        self._save_index()

        return len(exercises)

    def search_exercises(
        self,
        query: str = "",
        muscle_group: Optional[str] = None,
        equipment: Optional[List[str]] = None,
        safety_filter: Optional[SafetyFilter] = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        Search for exercises matching criteria.

        Args:
            query: Natural language search query
            muscle_group: Filter by muscle group
            equipment: Filter by available equipment
            safety_filter: Safety filter to exclude unsafe exercises
            limit: Maximum results to return

        Returns:
            List of matching exercise dictionaries
        """
        results = []

        # Check if we have ML dependencies available for semantic search
        if self.index and self.model and query:
            # Semantic search with FAISS
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)

            # Search more than needed to allow for filtering
            k = min(limit * 3, self.index.ntotal)
            scores, indices = self.index.search(query_embedding, k)

            for i, idx in enumerate(indices[0]):
                if idx < 0 or idx >= len(self.metadata):
                    continue

                exercise = self.metadata[idx].copy()
                exercise['similarity_score'] = float(scores[0][i])
                results.append(exercise)
        else:
            # Fallback: keyword-based matching from CSV metadata
            logger.info(
                f"Using CSV fallback search. Exercises available: {len(self.metadata)}")

            if query:
                # Simple keyword matching
                query_words = query.lower().split()
                for ex in self.metadata:
                    ex_text = f"{ex.get('name', '')} {ex.get('description', '')} {ex.get('muscle_group', '')}".lower(
                    )
                    # Score based on word matches
                    matches = sum(1 for word in query_words if word in ex_text)
                    if matches > 0:
                        exercise = ex.copy()
                        exercise['similarity_score'] = matches / \
                            len(query_words)
                        results.append(exercise)
                # Sort by match score
                results.sort(key=lambda x: x.get(
                    'similarity_score', 0), reverse=True)
            else:
                # No query - return all exercises
                results = [ex.copy() for ex in self.metadata]

        # Apply filters
        if muscle_group:
            muscle_lower = muscle_group.lower()
            results = [
                ex for ex in results
                if muscle_lower in ex.get('muscle_group', '').lower() or
                muscle_lower in str(ex.get('body_parts', [])).lower() or
                muscle_lower in str(ex.get('target_muscles', [])).lower()
            ]

        if equipment:
            equipment_lower = [e.lower() for e in equipment]
            results = [
                ex for ex in results
                if any(eq.lower() in equipment_lower for eq in ex.get('equipment', []))
            ]

        # Apply safety filter
        if safety_filter:
            results, _ = safety_filter.filter_exercises(results)

        return results[:limit]

    def get_exercises_for_profile(
        self,
        profile: Dict,
        safety_filter: SafetyFilter
    ) -> List[Dict]:
        """
        Get exercises suitable for a user profile.

        Args:
            profile: User profile dictionary
            safety_filter: Safety filter configured for user

        Returns:
            List of suitable exercises
        """
        goal = profile.get('goal', 'general')
        fitness_level = profile.get('fitness_level', 'beginner')
        equipment = profile.get('preferred_equipment', [])

        # When using CSV fallback (no ML), skip semantic query and use all exercises
        if not self.model:
            logger.info(
                f"Using CSV fallback: returning all {len(self.metadata)} exercises for filtering")
            exercises = [ex.copy() for ex in self.metadata]

            # Apply equipment filter if specified
            if equipment:
                equipment_lower = [e.lower() for e in equipment]
                exercises = [
                    ex for ex in exercises
                    if any(eq.lower() in equipment_lower for eq in ex.get('equipment', []))
                ]

            # Apply safety filter
            if safety_filter:
                exercises, _ = safety_filter.filter_exercises(exercises)

            logger.info(f"After safety filtering: {len(exercises)} exercises")
            return exercises

        # Build query based on goal (for semantic search)
        goal_queries = {
            'weight_loss': 'cardio fat burning high intensity exercises',
            'muscle_gain': 'muscle building hypertrophy strength exercises',
            'strength': 'heavy compound strength powerlifting exercises',
            'endurance': 'cardio endurance stamina exercises',
            'general': 'balanced fitness exercises'
        }

        query = goal_queries.get(goal, goal_queries['general'])

        # Get exercises with semantic search and safety filtering
        exercises = self.search_exercises(
            query=query,
            equipment=equipment if equipment else None,
            safety_filter=safety_filter,
            limit=100  # Get more for filtering
        )

        # If no exercises found with query, get all and apply safety filter
        if not exercises:
            logger.info("Query returned no results, using all exercises")
            exercises = [ex.copy() for ex in self.metadata]
            if safety_filter:
                exercises, _ = safety_filter.filter_exercises(exercises)

        # Filter by difficulty level
        difficulty_map = {
            'beginner': ['beginner', 'easy'],
            'intermediate': ['beginner', 'intermediate', 'easy'],
            'advanced': ['beginner', 'intermediate', 'advanced', 'easy', 'hard']
        }
        allowed_difficulties = difficulty_map.get(
            fitness_level, difficulty_map['intermediate'])

        # Only filter if exercises have difficulty field
        filtered = [
            ex for ex in exercises
            if not ex.get('difficulty') or ex.get('difficulty', '').lower() in allowed_difficulties
        ]

        # If filtering removed too many, use unfiltered
        if len(filtered) < 20:
            logger.info(
                f"Difficulty filter too restrictive ({len(filtered)} left), using {len(exercises)} exercises")
            return exercises

        return filtered

    def is_ready(self) -> bool:
        """Check if the RAG engine is ready to use."""
        # Ready if we have either FAISS index or CSV metadata
        return (self.model is not None and self.index is not None) or len(self.metadata) > 0

    def get_index_count(self) -> int:
        """Get the number of exercises in the index."""
        if self.index:
            return self.index.ntotal
        return len(self.metadata)
