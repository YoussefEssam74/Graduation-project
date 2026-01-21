"""
Nutrition Generator Flask Application
=====================================

REST API for generating personalized nutrition/meal plans.

Endpoints:
    POST /generate - Generate a meal plan for a user
    POST /calculate-macros - Calculate macros for a user profile
    GET /health - Health check

Port: 5011 (configured in config.yaml)
"""

from .meal_matcher import MealMatcher
from .macro_calculator import MacroCalculator
from safety import SafetyFilter
import os
import sys
import logging
from flask import Flask, request, jsonify
import yaml

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


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
macro_calculator = MacroCalculator(config)
meal_matcher = MealMatcher(config)


@app.route('/generate', methods=['POST'])
def generate_nutrition_plan():
    """
    Generate a personalized nutrition/meal plan.

    Request Body:
        {
            "user_id": int,
            "profile": {
                "age": int,
                "weight": float,           # kg
                "height": float,           # cm
                "gender": str,             # "male" or "female"
                "activity_level": str,     # "sedentary", "light", "moderate", "active", "very_active"
                "goal": str,               # "weight_loss", "muscle_gain", "maintenance"
                "allergies": [str],        # List of allergies
                "dietary_restrictions": [str]  # e.g., "vegetarian", "vegan", "halal"
            },
            "plan_duration_days": int  # Default: 7
        }

    Response:
        {
            "status": "success",
            "plan": {
                "user_id": int,
                "daily_targets": {...},
                "days": [...]
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
        duration_days = data.get('plan_duration_days', 7)

        # Validate required fields
        required_fields = ['age', 'weight', 'height', 'gender']
        missing = [f for f in required_fields if f not in profile]
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        # Calculate macros
        macros = macro_calculator.calculate_daily_targets(profile)

        # Create safety filter for user
        safety_filter = SafetyFilter.from_user_profile(profile)

        logger.info(f"Generating nutrition plan for user {user_id}")
        logger.info(f"Daily targets: {macros}")
        logger.info(f"Safety filter: {safety_filter}")

        # Get suitable meals using RAG (filtered for safety)
        plan = meal_matcher.build_meal_plan(
            user_id=user_id,
            profile=profile,
            macros=macros,
            safety_filter=safety_filter,
            duration_days=duration_days
        )

        return jsonify({
            'status': 'success',
            'plan': plan,
            'daily_targets': macros,
            'safety_summary': safety_filter.get_safety_summary()
        })

    except Exception as e:
        logger.error(f"Error generating nutrition plan: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/calculate-macros', methods=['POST'])
def calculate_macros():
    """
    Calculate daily macro targets for a user profile.

    Request Body:
        {
            "profile": {
                "age": int,
                "weight": float,       # kg
                "height": float,       # cm
                "gender": str,         # "male" or "female"
                "activity_level": str, # "sedentary", "light", "moderate", "active", "very_active"
                "goal": str            # "weight_loss", "muscle_gain", "maintenance"
            }
        }

    Response:
        {
            "status": "success",
            "macros": {
                "bmr": float,
                "tdee": float,
                "target_calories": float,
                "protein_g": float,
                "carbs_g": float,
                "fat_g": float
            }
        }
    """
    try:
        data = request.json or {}
        profile = data.get('profile', {})

        if not profile:
            return jsonify({'error': 'Profile is required'}), 400

        macros = macro_calculator.calculate_daily_targets(profile)

        return jsonify({
            'status': 'success',
            'macros': macros
        })

    except Exception as e:
        logger.error(f"Error calculating macros: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/meals', methods=['POST'])
def search_meals():
    """
    Search for meals matching criteria.

    Request Body:
        {
            "query": str,           # Natural language query
            "meal_type": str,       # "breakfast", "lunch", "dinner", "snack"
            "max_calories": int,    # Maximum calories per serving
            "allergies": [str],     # Allergies to filter for
            "limit": int            # Max results
        }

    Response:
        {
            "status": "success",
            "meals": [...]
        }
    """
    try:
        data = request.json or {}

        query = data.get('query', '')
        meal_type = data.get('meal_type')
        max_calories = data.get('max_calories')
        allergies = data.get('allergies', [])
        limit = data.get('limit', 20)

        # Create safety filter if allergies provided
        safety_filter = SafetyFilter(
            allergies=allergies) if allergies else None

        # Search meals
        meals = meal_matcher.search_meals(
            query=query,
            meal_type=meal_type,
            max_calories=max_calories,
            safety_filter=safety_filter,
            limit=limit
        )

        return jsonify({
            'status': 'success',
            'meals': meals,
            'count': len(meals)
        })

    except Exception as e:
        logger.error(f"Error searching meals: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'nutrition_generator',
        'rag_ready': meal_matcher.is_ready(),
        'meals_indexed': meal_matcher.get_index_count()
    })


@app.route('/reindex', methods=['POST'])
def reindex():
    """Rebuild the meal index from database."""
    try:
        count = meal_matcher.rebuild_index()
        return jsonify({
            'status': 'success',
            'message': f'Indexed {count} meals'
        })
    except Exception as e:
        logger.error(f"Error reindexing: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = config.get('services', {}).get(
        'nutrition_generator', {}).get('port', 5011)
    host = config.get('services', {}).get(
        'nutrition_generator', {}).get('host', '0.0.0.0')

    logger.info(f"Starting Nutrition Generator on {host}:{port}")
    app.run(host=host, port=port, debug=config.get(
        'development', {}).get('debug_mode', False))
