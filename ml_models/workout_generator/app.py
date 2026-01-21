"""
Workout Generator Flask Application
===================================

REST API for generating personalized workout plans.

Endpoints:
    POST /generate - Generate a workout plan for a user
    GET /health - Health check

Port: 5010 (configured in config.yaml)
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
import yaml

# Add parent directory to path for imports BEFORE importing local modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Add current directory to path for local imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag_engine import ExerciseRAG
from plan_builder import WorkoutPlanBuilder
from safety import SafetyFilter


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load configuration
config_path = os.path.join(os.path.dirname(
    os.path.dirname(__file__)), 'config.yaml')
with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

# Initialize components
exercise_rag = ExerciseRAG(config)
plan_builder = WorkoutPlanBuilder(config)


@app.route('/generate', methods=['POST'])
def generate_workout():
    """
    Generate a personalized workout plan.

    Request Body:
        {
            "user_id": int,
            "profile": {
                "age": int,
                "weight": float,
                "height": float,
                "gender": str,
                "fitness_level": str,  # "beginner", "intermediate", "advanced"
                "goal": str,           # "weight_loss", "muscle_gain", "strength", etc.
                "injuries": [str],     # List of injuries
                "preferred_equipment": [str],  # Available equipment
                "days_per_week": int   # 3-6
            },
            "plan_duration_weeks": int  # Default: 4
        }

    Response:
        {
            "status": "success",
            "plan": {
                "user_id": int,
                "duration_weeks": int,
                "days_per_week": int,
                "goal": str,
                "weeks": [...]
            },
            "safety_summary": {...}
        }
    """
    try:
        data = request.json

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        user_id = data.get('user_id')
        profile = data.get('profile', {})
        duration_weeks = data.get('plan_duration_weeks', 4)

        # Validate required fields
        if not profile:
            return jsonify({'error': 'Profile is required'}), 400

        # Create safety filter for user
        safety_filter = SafetyFilter.from_user_profile(profile)

        # Log safety configuration
        logger.info(f"Generating workout for user {user_id}")
        logger.info(f"Safety filter: {safety_filter}")

        # Get relevant exercises from RAG (filtered for safety)
        exercises = exercise_rag.get_exercises_for_profile(
            profile=profile,
            safety_filter=safety_filter
        )

        if not exercises:
            return jsonify({
                'status': 'error',
                'error': 'No suitable exercises found for user profile and safety constraints'
            }), 400

        # Build the workout plan
        plan = plan_builder.build_plan(
            user_id=user_id,
            profile=profile,
            exercises=exercises,
            duration_weeks=duration_weeks
        )

        return jsonify({
            'status': 'success',
            'plan': plan,
            'safety_summary': safety_filter.get_safety_summary(),
            'exercises_available': len(exercises)
        })

    except Exception as e:
        logger.error(f"Error generating workout: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/exercises', methods=['POST'])
def search_exercises():
    """
    Search for exercises based on criteria.

    Request Body:
        {
            "query": str,           # Natural language query
            "muscle_group": str,    # Target muscle group
            "equipment": [str],     # Required equipment
            "injuries": [str],      # Injuries to filter for
            "limit": int            # Max results
        }

    Response:
        {
            "status": "success",
            "exercises": [...]
        }
    """
    try:
        data = request.json or {}

        query = data.get('query', '')
        muscle_group = data.get('muscle_group')
        equipment = data.get('equipment', [])
        injuries = data.get('injuries', [])
        limit = data.get('limit', 20)

        # Create safety filter if injuries provided
        safety_filter = SafetyFilter(injuries=injuries) if injuries else None

        # Search exercises
        exercises = exercise_rag.search_exercises(
            query=query,
            muscle_group=muscle_group,
            equipment=equipment,
            safety_filter=safety_filter,
            limit=limit
        )

        return jsonify({
            'status': 'success',
            'exercises': exercises,
            'count': len(exercises)
        })

    except Exception as e:
        logger.error(f"Error searching exercises: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'workout_generator',
        'rag_ready': exercise_rag.is_ready(),
        'exercises_indexed': exercise_rag.get_index_count()
    })


@app.route('/reindex', methods=['POST'])
def reindex():
    """
    Rebuild the exercise index from database.

    This should be called when exercises are added/modified in the database.
    """
    try:
        count = exercise_rag.rebuild_index()
        return jsonify({
            'status': 'success',
            'message': f'Indexed {count} exercises'
        })
    except Exception as e:
        logger.error(f"Error reindexing: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = config.get('services', {}).get(
        'workout_generator', {}).get('port', 5010)
    host = config.get('services', {}).get(
        'workout_generator', {}).get('host', '0.0.0.0')

    logger.info(f"Starting Workout Generator on {host}:{port}")
    app.run(host=host, port=port, debug=config.get(
        'development', {}).get('debug_mode', False))
