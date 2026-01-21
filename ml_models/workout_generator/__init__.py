# Workout Generator Module for PulseGym AI
# Uses RAG + Templates + Safety Filtering

# Lazy imports to avoid loading heavy ML dependencies at import time
from .exercise_database import EXERCISE_DATABASE, get_all_exercises


def get_app():
    """Get Flask app (lazy load)."""
    from .app import app
    return app


def get_plan_builder():
    """Get WorkoutPlanBuilder class (lazy load)."""
    from .plan_builder import WorkoutPlanBuilder
    return WorkoutPlanBuilder


def get_exercise_rag():
    """Get ExerciseRAG class (lazy load)."""
    from .rag_engine import ExerciseRAG
    return ExerciseRAG


# Direct imports for lightweight modules

__all__ = ['get_app', 'get_plan_builder', 'get_exercise_rag',
           'EXERCISE_DATABASE', 'get_all_exercises']
