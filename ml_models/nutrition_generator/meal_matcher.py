"""
Meal Matcher for Nutrition Generator
====================================

Uses FAISS for semantic search of meals, with allergy filtering.
Builds complete meal plans that hit daily macro targets.

Key Features:
- Embeds meal descriptions using sentence-transformers
- Stores in FAISS for fast similarity search
- Filters results based on allergy safety constraints
- Matches meals to fit macro targets
"""

from .macro_calculator import MacroCalculator
from safety import SafetyFilter
import faiss
from sentence_transformers import SentenceTransformer
import os
import sys
import logging
import pickle
from typing import List, Dict, Optional, Any
from datetime import datetime
import numpy as np
import random

# Add parent directory for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


logger = logging.getLogger(__name__)


class MealMatcher:
    """
    RAG engine for meal retrieval and plan building.

    This class handles:
    1. Loading meals from database
    2. Creating embeddings for semantic search
    3. Building and querying FAISS index
    4. Filtering results for allergies
    5. Building meal plans that match macro targets
    """

    def __init__(self, config: Dict):
        """
        Initialize the meal matcher.

        Args:
            config: Configuration dictionary from config.yaml
        """
        self.config = config

        # Embedding model configuration
        emb_config = config.get('embeddings', {})
        self.model_name = emb_config.get(
            'model_name', 'sentence-transformers/all-MiniLM-L6-v2')
        self.dimension = emb_config.get('dimension', 384)

        # Vector store configuration
        vs_config = config.get('vector_store', {})
        self.index_path = vs_config.get('indexes', {}).get(
            'meals', {}).get('path', 'data/faiss_indexes/meals.index')
        self.metadata_path = vs_config.get('indexes', {}).get('meals', {}).get(
            'metadata_path', 'data/faiss_indexes/meals_metadata.pkl')

        # Search configuration
        self.top_k = vs_config.get('search', {}).get('top_k', 10)

        # Nutrition generator config
        ng_config = config.get('nutrition_generator', {})
        self.meals_per_day = ng_config.get('meals_per_day', 5)

        # Initialize macro calculator
        self.macro_calculator = MacroCalculator(config)

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

        # Try to load existing index
        self._load_index()

    def _load_index(self):
        """Load existing FAISS index and metadata if available."""
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'rb') as f:
                    self.metadata = pickle.load(f)
                logger.info(f"Loaded index with {self.index.ntotal} meals")
            else:
                logger.info(
                    "No existing index found. Call rebuild_index() to create one.")
        except Exception as e:
            logger.error(f"Error loading index: {e}")

    def _save_index(self):
        """Save FAISS index and metadata to disk."""
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)

            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(self.metadata, f)

            logger.info(f"Saved index with {self.index.ntotal} meals")
        except Exception as e:
            logger.error(f"Error saving index: {e}")

    def _get_meals_from_db(self) -> List[Dict]:
        """
        Load meals from database.

        TODO: Implement actual database connection.
        For now, returns sample data for development.
        """
        logger.warning(
            "Using sample meal data. Implement database connection for production.")

        # Sample meals for development
        return [
            {
                "id": 1,
                "name": "Grilled Chicken Breast with Vegetables",
                "description": "Lean protein with steamed broccoli and brown rice",
                "meal_type": "lunch",
                "calories": 450,
                "protein_g": 40,
                "carbs_g": 35,
                "fat_g": 12,
                "ingredients": ["chicken_breast", "broccoli", "brown_rice", "olive_oil"]
            },
            {
                "id": 2,
                "name": "Greek Yogurt Parfait",
                "description": "High-protein breakfast with fruit and granola",
                "meal_type": "breakfast",
                "calories": 350,
                "protein_g": 25,
                "carbs_g": 45,
                "fat_g": 8,
                "ingredients": ["greek_yogurt", "berries", "granola", "honey"]
            },
            {
                "id": 3,
                "name": "Salmon with Quinoa",
                "description": "Omega-3 rich dinner with complete protein",
                "meal_type": "dinner",
                "calories": 520,
                "protein_g": 38,
                "carbs_g": 40,
                "fat_g": 22,
                "ingredients": ["salmon", "quinoa", "asparagus", "lemon"]
            },
            {
                "id": 4,
                "name": "Protein Shake",
                "description": "Quick post-workout protein boost",
                "meal_type": "snack",
                "calories": 200,
                "protein_g": 30,
                "carbs_g": 15,
                "fat_g": 3,
                "ingredients": ["whey_protein", "banana", "almond_milk"]
            },
            {
                "id": 5,
                "name": "Oatmeal with Nuts",
                "description": "Slow-release carbs with healthy fats",
                "meal_type": "breakfast",
                "calories": 380,
                "protein_g": 12,
                "carbs_g": 55,
                "fat_g": 14,
                "ingredients": ["oats", "almonds", "walnuts", "banana", "cinnamon"]
            },
            {
                "id": 6,
                "name": "Turkey Wrap",
                "description": "Lean protein lunch in a whole wheat wrap",
                "meal_type": "lunch",
                "calories": 400,
                "protein_g": 30,
                "carbs_g": 38,
                "fat_g": 15,
                "ingredients": ["turkey_breast", "whole_wheat_tortilla", "lettuce", "tomato", "avocado"]
            },
            {
                "id": 7,
                "name": "Cottage Cheese with Fruit",
                "description": "High protein snack with natural sugars",
                "meal_type": "snack",
                "calories": 180,
                "protein_g": 20,
                "carbs_g": 18,
                "fat_g": 4,
                "ingredients": ["cottage_cheese", "pineapple", "peach"]
            },
            {
                "id": 8,
                "name": "Steak with Sweet Potato",
                "description": "Iron-rich dinner with complex carbs",
                "meal_type": "dinner",
                "calories": 580,
                "protein_g": 42,
                "carbs_g": 45,
                "fat_g": 24,
                "ingredients": ["beef_steak", "sweet_potato", "green_beans", "butter"]
            },
            {
                "id": 9,
                "name": "Egg White Omelette",
                "description": "Low-fat, high-protein breakfast",
                "meal_type": "breakfast",
                "calories": 280,
                "protein_g": 28,
                "carbs_g": 8,
                "fat_g": 14,
                "ingredients": ["egg_whites", "spinach", "mushrooms", "feta_cheese"]
            },
            {
                "id": 10,
                "name": "Hummus with Vegetables",
                "description": "Plant-based protein snack",
                "meal_type": "snack",
                "calories": 200,
                "protein_g": 8,
                "carbs_g": 22,
                "fat_g": 10,
                "ingredients": ["hummus", "carrots", "celery", "bell_pepper"]
            },
        ]

    def rebuild_index(self) -> int:
        """Rebuild the FAISS index from database meals."""
        if not self.model:
            raise RuntimeError("Embedding model not loaded")

        meals = self._get_meals_from_db()

        if not meals:
            logger.warning("No meals found in database")
            return 0

        # Create text for embedding
        texts = []
        for meal in meals:
            text = f"{meal['name']}. {meal.get('description', '')}. Type: {meal.get('meal_type', '')}"
            texts.append(text)

        # Generate embeddings
        logger.info(f"Generating embeddings for {len(texts)} meals")
        embeddings = self.model.encode(texts, convert_to_numpy=True)

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        # Create FAISS index
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)

        # Store metadata
        self.metadata = meals

        # Save to disk
        self._save_index()

        return len(meals)

    def search_meals(
        self,
        query: str = "",
        meal_type: Optional[str] = None,
        max_calories: Optional[int] = None,
        safety_filter: Optional[SafetyFilter] = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        Search for meals matching criteria.

        Args:
            query: Natural language search query
            meal_type: Filter by meal type (breakfast, lunch, dinner, snack)
            max_calories: Maximum calories per serving
            safety_filter: Safety filter to exclude allergens
            limit: Maximum results to return

        Returns:
            List of matching meal dictionaries
        """
        if not self.index or not self.model:
            logger.warning("Index or model not ready")
            return []

        results = []

        if query:
            # Semantic search
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)

            k = min(limit * 3, self.index.ntotal)
            scores, indices = self.index.search(query_embedding, k)

            for i, idx in enumerate(indices[0]):
                if idx < 0 or idx >= len(self.metadata):
                    continue

                meal = self.metadata[idx].copy()
                meal['similarity_score'] = float(scores[0][i])
                results.append(meal)
        else:
            results = [m.copy() for m in self.metadata]

        # Apply filters
        if meal_type:
            results = [m for m in results if m.get(
                'meal_type', '').lower() == meal_type.lower()]

        if max_calories:
            results = [m for m in results if m.get(
                'calories', 0) <= max_calories]

        # Apply safety filter (check ingredients)
        if safety_filter:
            filtered_results = []
            for meal in results:
                ingredients = meal.get('ingredients', [])
                # Check if any ingredient is unsafe
                is_safe = True
                for ing in ingredients:
                    if not safety_filter.is_food_safe(ing):
                        is_safe = False
                        break
                if is_safe:
                    filtered_results.append(meal)
            results = filtered_results

        return results[:limit]

    def build_meal_plan(
        self,
        user_id: int,
        profile: Dict,
        macros: Dict,
        safety_filter: SafetyFilter,
        duration_days: int = 7
    ) -> Dict:
        """
        Build a complete meal plan.

        Args:
            user_id: User ID
            profile: User profile dictionary
            macros: Calculated macro targets
            safety_filter: Safety filter for allergies
            duration_days: Plan duration in days

        Returns:
            Complete meal plan dictionary
        """
        target_calories = macros.get('target_calories', 2000)

        # Get meal distribution
        meal_distribution = self.macro_calculator.get_meal_distribution(
            target_calories,
            self.meals_per_day
        )

        # Get all safe meals
        all_meals = self.search_meals(safety_filter=safety_filter, limit=100)

        # Group by meal type
        meals_by_type = {
            'breakfast': [m for m in all_meals if m.get('meal_type') == 'breakfast'],
            'lunch': [m for m in all_meals if m.get('meal_type') == 'lunch'],
            'dinner': [m for m in all_meals if m.get('meal_type') == 'dinner'],
            'snack': [m for m in all_meals if m.get('meal_type') == 'snack']
        }

        # Build days
        days = []
        for day_num in range(1, duration_days + 1):
            day_meals = self._select_meals_for_day(
                meal_distribution=meal_distribution,
                meals_by_type=meals_by_type,
                target_calories=target_calories
            )

            # Calculate day totals
            day_totals = self._calculate_day_totals(day_meals)

            days.append({
                'day': day_num,
                'meals': day_meals,
                'totals': day_totals
            })

        # Build final plan
        plan = {
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'duration_days': duration_days,
            'daily_targets': macros,
            'days': days,
            'notes': self._generate_notes(profile, safety_filter)
        }

        return plan

    def _select_meals_for_day(
        self,
        meal_distribution: Dict[str, float],
        meals_by_type: Dict[str, List[Dict]],
        target_calories: float
    ) -> List[Dict]:
        """Select meals for a single day."""
        selected = []

        for meal_slot, target_cals in meal_distribution.items():
            # Determine meal type based on slot name
            if 'breakfast' in meal_slot:
                meal_type = 'breakfast'
            elif 'lunch' in meal_slot:
                meal_type = 'lunch'
            elif 'dinner' in meal_slot:
                meal_type = 'dinner'
            else:
                meal_type = 'snack'

            available = meals_by_type.get(meal_type, [])

            if available:
                # Find meal closest to target calories
                closest = min(available, key=lambda m: abs(
                    m.get('calories', 0) - target_cals))

                selected.append({
                    'slot': meal_slot,
                    'meal_id': closest.get('id'),
                    'name': closest.get('name'),
                    'calories': closest.get('calories'),
                    'protein_g': closest.get('protein_g'),
                    'carbs_g': closest.get('carbs_g'),
                    'fat_g': closest.get('fat_g'),
                    'target_calories': target_cals
                })

        return selected

    def _calculate_day_totals(self, meals: List[Dict]) -> Dict:
        """Calculate totals for a day's meals."""
        return {
            'calories': sum(m.get('calories', 0) for m in meals),
            'protein_g': sum(m.get('protein_g', 0) for m in meals),
            'carbs_g': sum(m.get('carbs_g', 0) for m in meals),
            'fat_g': sum(m.get('fat_g', 0) for m in meals)
        }

    def _generate_notes(self, profile: Dict, safety_filter: SafetyFilter) -> List[str]:
        """Generate helpful notes for the plan."""
        notes = [
            "Drink at least 8 glasses of water daily",
            "Meal prep on weekends for convenience",
            "Adjust portions based on hunger and energy levels"
        ]

        if safety_filter.allergies:
            notes.append(
                f"⚠️ Meals have been filtered for: {', '.join(safety_filter.allergies)}")

        alternatives = safety_filter.get_alternatives()
        if alternatives:
            for category, alts in alternatives.items():
                notes.append(
                    f"💡 {category.replace('_', ' ').title()}: {', '.join(alts[:3])}")

        return notes

    def is_ready(self) -> bool:
        """Check if the matcher is ready to use."""
        return self.model is not None and self.index is not None

    def get_index_count(self) -> int:
        """Get the number of meals in the index."""
        return self.index.ntotal if self.index else 0
