# Safety module for PulseGym AI
# Hard filtering for injuries and allergies BEFORE any AI processing

from .injury_mappings import INJURY_EXERCISE_MAP, get_unsafe_exercises
from .allergy_mappings import ALLERGY_FOOD_MAP, get_unsafe_foods
from .filter_engine import SafetyFilter

__all__ = [
    'INJURY_EXERCISE_MAP',
    'ALLERGY_FOOD_MAP',
    'get_unsafe_exercises',
    'get_unsafe_foods',
    'SafetyFilter'
]
