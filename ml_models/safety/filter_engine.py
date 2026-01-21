"""
Safety Filter Engine for PulseGym AI
====================================

This module provides the main SafetyFilter class that combines
injury and allergy filtering into a single, easy-to-use interface.

Usage:
    from safety import SafetyFilter
    
    # Create filter with user's conditions
    safety = SafetyFilter(
        injuries=["knee injury", "lower back"],
        allergies=["dairy", "gluten"]
    )
    
    # Filter exercises before RAG retrieval
    safe_exercises = safety.filter_exercises(all_exercises)
    
    # Filter foods before meal planning
    safe_foods = safety.filter_foods(all_foods)
"""

import logging
from typing import List, Dict, Set, Any, Optional
from dataclasses import dataclass, field

from .injury_mappings import (
    get_unsafe_exercises,
    is_exercise_safe,
    filter_exercises as _filter_exercises,
    normalize_injury
)
from .allergy_mappings import (
    get_unsafe_foods,
    is_food_safe,
    filter_foods as _filter_foods,
    normalize_allergy,
    get_safe_alternatives
)

logger = logging.getLogger(__name__)


@dataclass
class FilterResult:
    """Result of a filtering operation."""
    original_count: int
    filtered_count: int
    removed_count: int
    removed_items: List[str] = field(default_factory=list)

    @property
    def removal_rate(self) -> float:
        """Percentage of items removed."""
        if self.original_count == 0:
            return 0.0
        return self.removed_count / self.original_count * 100


class SafetyFilter:
    """
    Main safety filter class that combines injury and allergy filtering.

    This class provides a unified interface for filtering exercises and foods
    based on user's medical conditions and dietary restrictions.

    Attributes:
        injuries: List of user's injuries
        allergies: List of user's allergies/dietary restrictions
        log_filtered: Whether to log filtered items for audit
    """

    def __init__(
        self,
        injuries: Optional[List[str]] = None,
        allergies: Optional[List[str]] = None,
        log_filtered: bool = True
    ):
        """
        Initialize the safety filter.

        Args:
            injuries: List of user's injuries (e.g., ["knee", "shoulder"])
            allergies: List of user's allergies (e.g., ["dairy", "nuts"])
            log_filtered: Whether to log removed items
        """
        self.injuries = injuries or []
        self.allergies = allergies or []
        self.log_filtered = log_filtered

        # Pre-compute unsafe sets for efficiency
        self._unsafe_exercises: Set[str] = get_unsafe_exercises(self.injuries)
        self._unsafe_foods: Set[str] = get_unsafe_foods(self.allergies)

        logger.info(
            f"SafetyFilter initialized: {len(self.injuries)} injuries, "
            f"{len(self.allergies)} allergies, "
            f"{len(self._unsafe_exercises)} unsafe exercises, "
            f"{len(self._unsafe_foods)} unsafe foods"
        )

    @classmethod
    def from_user_profile(cls, profile: Dict[str, Any]) -> 'SafetyFilter':
        """
        Create a SafetyFilter from a user profile dictionary.

        Expected profile keys:
            - injuries: str or List[str] - comma-separated or list
            - allergies: str or List[str] - comma-separated or list
            - medical_conditions: str or List[str] - additional conditions
            - dietary_restrictions: str or List[str] - e.g., "vegan", "halal"

        Args:
            profile: User profile dictionary

        Returns:
            SafetyFilter configured for the user
        """
        injuries = []
        allergies = []

        # Extract injuries
        if profile.get('injuries'):
            if isinstance(profile['injuries'], str):
                injuries = [i.strip() for i in profile['injuries'].split(',')]
            else:
                injuries = list(profile['injuries'])

        # Extract medical conditions (may include injury-related conditions)
        if profile.get('medical_conditions'):
            if isinstance(profile['medical_conditions'], str):
                injuries.extend(
                    [i.strip() for i in profile['medical_conditions'].split(',')])
            else:
                injuries.extend(list(profile['medical_conditions']))

        # Extract allergies
        if profile.get('allergies'):
            if isinstance(profile['allergies'], str):
                allergies = [a.strip()
                             for a in profile['allergies'].split(',')]
            else:
                allergies = list(profile['allergies'])

        # Extract dietary restrictions
        if profile.get('dietary_restrictions'):
            if isinstance(profile['dietary_restrictions'], str):
                allergies.extend(
                    [a.strip() for a in profile['dietary_restrictions'].split(',')])
            else:
                allergies.extend(list(profile['dietary_restrictions']))

        # Clean up empty strings
        injuries = [i for i in injuries if i]
        allergies = [a for a in allergies if a]

        return cls(injuries=injuries, allergies=allergies)

    def filter_exercises(
        self,
        exercises: List[Dict],
        name_field: str = "name"
    ) -> tuple[List[Dict], FilterResult]:
        """
        Filter exercises, removing unsafe ones based on injuries.

        Args:
            exercises: List of exercise dictionaries
            name_field: Key name for exercise name in dict

        Returns:
            Tuple of (filtered_exercises, filter_result)
        """
        if not self.injuries:
            return exercises, FilterResult(
                original_count=len(exercises),
                filtered_count=len(exercises),
                removed_count=0
            )

        filtered = []
        removed = []

        for exercise in exercises:
            name = exercise.get(name_field, "")
            if is_exercise_safe(name, self.injuries):
                filtered.append(exercise)
            else:
                removed.append(name)
                if self.log_filtered:
                    logger.debug(f"Filtered exercise: {name}")

        result = FilterResult(
            original_count=len(exercises),
            filtered_count=len(filtered),
            removed_count=len(removed),
            removed_items=removed
        )

        if self.log_filtered and removed:
            logger.info(
                f"Exercise filtering: removed {result.removed_count}/{result.original_count} "
                f"({result.removal_rate:.1f}%) due to injuries: {self.injuries}"
            )

        return filtered, result

    def filter_foods(
        self,
        foods: List[Dict],
        name_field: str = "name"
    ) -> tuple[List[Dict], FilterResult]:
        """
        Filter foods, removing unsafe ones based on allergies.

        Args:
            foods: List of food dictionaries
            name_field: Key name for food name in dict

        Returns:
            Tuple of (filtered_foods, filter_result)
        """
        if not self.allergies:
            return foods, FilterResult(
                original_count=len(foods),
                filtered_count=len(foods),
                removed_count=0
            )

        filtered = []
        removed = []

        for food in foods:
            name = food.get(name_field, "")
            if is_food_safe(name, self.allergies):
                filtered.append(food)
            else:
                removed.append(name)
                if self.log_filtered:
                    logger.debug(f"Filtered food: {name}")

        result = FilterResult(
            original_count=len(foods),
            filtered_count=len(filtered),
            removed_count=len(removed),
            removed_items=removed
        )

        if self.log_filtered and removed:
            logger.info(
                f"Food filtering: removed {result.removed_count}/{result.original_count} "
                f"({result.removal_rate:.1f}%) due to allergies: {self.allergies}"
            )

        return filtered, result

    def is_exercise_safe(self, exercise_name: str) -> bool:
        """Check if a single exercise is safe."""
        return is_exercise_safe(exercise_name, self.injuries)

    def is_food_safe(self, food_name: str) -> bool:
        """Check if a single food is safe."""
        return is_food_safe(food_name, self.allergies)

    def get_unsafe_exercises(self) -> Set[str]:
        """Get all unsafe exercise names."""
        return self._unsafe_exercises.copy()

    def get_unsafe_foods(self) -> Set[str]:
        """Get all unsafe food names."""
        return self._unsafe_foods.copy()

    def get_alternatives(self) -> Dict[str, List[str]]:
        """Get safe food alternatives for the user's allergies."""
        return get_safe_alternatives(self.allergies)

    def get_safety_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the safety filter configuration.

        Returns:
            Dictionary with safety filter summary
        """
        return {
            "injuries": self.injuries,
            "normalized_injuries": [normalize_injury(i) for i in self.injuries],
            "allergies": self.allergies,
            "normalized_allergies": [normalize_allergy(a) for a in self.allergies],
            "total_unsafe_exercises": len(self._unsafe_exercises),
            "total_unsafe_foods": len(self._unsafe_foods),
            "sample_unsafe_exercises": list(self._unsafe_exercises)[:10],
            "sample_unsafe_foods": list(self._unsafe_foods)[:10],
            "alternatives": self.get_alternatives()
        }

    def __repr__(self) -> str:
        return (
            f"SafetyFilter(injuries={self.injuries}, allergies={self.allergies}, "
            f"unsafe_exercises={len(self._unsafe_exercises)}, "
            f"unsafe_foods={len(self._unsafe_foods)})"
        )


# =============================================================================
# Convenience Functions
# =============================================================================

def create_filter_for_member(member_data: Dict) -> SafetyFilter:
    """
    Create a SafetyFilter for a member from database data.

    This is a convenience function that handles various data formats
    that might come from the database.

    Args:
        member_data: Member record from database

    Returns:
        Configured SafetyFilter
    """
    profile = {
        'injuries': member_data.get('injuries') or member_data.get('Injuries') or '',
        'medical_conditions': member_data.get('medical_conditions') or member_data.get('MedicalConditions') or '',
        'allergies': member_data.get('allergies') or member_data.get('Allergies') or '',
        'dietary_restrictions': member_data.get('dietary_restrictions') or member_data.get('DietaryRestrictions') or '',
    }

    return SafetyFilter.from_user_profile(profile)
