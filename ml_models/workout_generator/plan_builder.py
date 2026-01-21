"""
Workout Plan Builder
====================

Builds structured workout plans using Jinja2 templates.
Implements progressive overload and periodization.

Output: Guaranteed valid JSON structure (no LLM hallucination risk)

Now uses real exercise data from CSV datasets (7,961 exercises!)
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random

try:
    from jinja2 import Environment, FileSystemLoader
    JINJA_AVAILABLE = True
except ImportError:
    JINJA_AVAILABLE = False

logger = logging.getLogger(__name__)

# Body part mapping: CSV body parts -> workout split muscle groups
BODY_PART_TO_MUSCLE_GROUP = {
    # Upper body
    'chest': 'chest',
    'pectorals': 'chest',
    'upper arms': 'arms',
    'lower arms': 'arms',
    'shoulders': 'shoulders',
    'delts': 'shoulders',
    # Back
    'back': 'back',
    'lats': 'back',
    'upper back': 'back',
    'spine': 'back',
    # Lower body
    'upper legs': 'legs',
    'lower legs': 'legs',
    'thighs': 'legs',
    'calves': 'legs',
    'glutes': 'legs',
    'quads': 'legs',
    'hamstrings': 'legs',
    # Core
    'waist': 'core',
    'abs': 'core',
    'core': 'core',
    # Cardio
    'cardio': 'cardio',
    'cardiovascular system': 'cardio',
    # Other
    'neck': 'shoulders',
    'full_body': 'full_body',
}


class WorkoutPlanBuilder:
    """
    Builds personalized workout plans using templates.

    Key Features:
    - Template-based JSON generation (100% valid structure)
    - Progressive overload (increasing volume/intensity weekly)
    - Smart exercise distribution across muscle groups
    - Rest day placement
    """

    def __init__(self, config: Dict):
        """
        Initialize the plan builder.

        Args:
            config: Configuration dictionary
        """
        self.config = config

        # Workout generator config
        wg_config = config.get('workout_generator', {})
        self.default_weeks = wg_config.get('default_weeks', 4)
        self.exercises_per_day = wg_config.get('exercises_per_day', {
            'beginner': 4,
            'intermediate': 5,
            'advanced': 6
        })
        self.sets_reps = wg_config.get('sets_reps', {
            'strength': {'sets': 5, 'reps': [3, 5]},
            'hypertrophy': {'sets': 4, 'reps': [8, 12]},
            'endurance': {'sets': 3, 'reps': [15, 20]},
            'weight_loss': {'sets': 3, 'reps': [12, 15]}
        })

        # Progressive overload settings
        progression = wg_config.get('progression', {})
        self.volume_increase = progression.get(
            'volume_increase_per_week', 0.05)
        self.intensity_increase = progression.get(
            'intensity_increase_per_week', 0.025)

        # Initialize Jinja2 environment
        templates_path = os.path.join(os.path.dirname(__file__), 'templates')
        if JINJA_AVAILABLE and os.path.exists(templates_path):
            self.jinja_env = Environment(
                loader=FileSystemLoader(templates_path))
        else:
            if not JINJA_AVAILABLE:
                logger.warning("Jinja2 not available, templates disabled")
            self.jinja_env = None

        # Muscle group split definitions
        self.splits = {
            3: {  # 3 days per week - Full body
                'day_1': ['chest', 'back', 'legs'],
                'day_2': ['shoulders', 'arms', 'core'],
                'day_3': ['chest', 'back', 'legs']
            },
            4: {  # 4 days per week - Upper/Lower
                'day_1': ['chest', 'back', 'shoulders'],  # Upper
                'day_2': ['legs', 'core'],                # Lower
                'day_3': ['chest', 'back', 'arms'],       # Upper
                'day_4': ['legs', 'core']                 # Lower
            },
            5: {  # 5 days per week - Push/Pull/Legs
                'day_1': ['chest', 'shoulders', 'arms'],  # Push
                'day_2': ['back', 'arms'],                # Pull
                'day_3': ['legs'],                         # Legs
                'day_4': ['chest', 'shoulders'],          # Push
                'day_5': ['back', 'core']                 # Pull
            },
            6: {  # 6 days per week - PPL x2
                'day_1': ['chest', 'shoulders', 'arms'],
                'day_2': ['back', 'arms'],
                'day_3': ['legs'],
                'day_4': ['chest', 'shoulders', 'arms'],
                'day_5': ['back', 'arms'],
                'day_6': ['legs', 'core']
            }
        }

    def build_plan(
        self,
        user_id: int,
        profile: Dict,
        exercises: List[Dict],
        duration_weeks: int = 4
    ) -> Dict:
        """
        Build a complete workout plan.

        Args:
            user_id: User ID
            profile: User profile dictionary
            exercises: Available exercises (already safety-filtered)
            duration_weeks: Plan duration in weeks

        Returns:
            Complete workout plan dictionary
        """
        fitness_level = profile.get('fitness_level', 'beginner')
        goal = profile.get('goal', 'general')
        days_per_week = min(max(profile.get('days_per_week', 3), 3), 6)

        # Get split for this number of days
        split = self.splits.get(days_per_week, self.splits[3])

        # Get sets/reps config for goal
        goal_config = self._get_goal_config(goal)

        # Number of exercises per day based on fitness level
        exercises_count = self.exercises_per_day.get(fitness_level, 4)

        # Group exercises by muscle group for selection
        exercises_by_muscle = self._group_by_muscle(exercises)

        # Build week by week
        weeks = []
        for week_num in range(1, duration_weeks + 1):
            week_data = self._build_week(
                week_num=week_num,
                split=split,
                exercises_by_muscle=exercises_by_muscle,
                goal_config=goal_config,
                exercises_count=exercises_count
            )
            weeks.append(week_data)

        # Build final plan structure
        plan = {
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'duration_weeks': duration_weeks,
            'days_per_week': days_per_week,
            'goal': goal,
            'fitness_level': fitness_level,
            'split_type': self._get_split_name(days_per_week),
            'weeks': weeks,
            'notes': self._generate_notes(profile, goal)
        }

        return plan

    def _get_goal_config(self, goal: str) -> Dict:
        """Get sets/reps configuration for a goal."""
        goal_map = {
            'weight_loss': 'weight_loss',
            'muscle_gain': 'hypertrophy',
            'hypertrophy': 'hypertrophy',
            'strength': 'strength',
            'endurance': 'endurance',
            'general': 'hypertrophy'
        }

        config_key = goal_map.get(goal, 'hypertrophy')
        return self.sets_reps.get(config_key, self.sets_reps['hypertrophy'])

    def _group_by_muscle(self, exercises: List[Dict]) -> Dict[str, List[Dict]]:
        """Group exercises by muscle group, mapping body parts from CSV."""
        grouped = {}
        for ex in exercises:
            # Get body part from exercise (from CSV)
            body_parts = ex.get('body_parts', [])
            muscle_group = ex.get('muscle_group', 'general').lower()

            # Map body part to workout muscle group
            if body_parts:
                body_part = body_parts[0].lower() if isinstance(
                    body_parts, list) else body_parts.lower()
                muscle = BODY_PART_TO_MUSCLE_GROUP.get(body_part, muscle_group)
            else:
                muscle = BODY_PART_TO_MUSCLE_GROUP.get(
                    muscle_group, muscle_group)

            if muscle not in grouped:
                grouped[muscle] = []
            grouped[muscle].append(ex)

        return grouped

    def _get_split_name(self, days: int) -> str:
        """Get the name of the split type."""
        split_names = {
            3: 'Full Body',
            4: 'Upper/Lower',
            5: 'Push/Pull/Legs',
            6: 'Push/Pull/Legs (2x)'
        }
        return split_names.get(days, 'Custom')

    def _build_week(
        self,
        week_num: int,
        split: Dict,
        exercises_by_muscle: Dict[str, List[Dict]],
        goal_config: Dict,
        exercises_count: int
    ) -> Dict:
        """Build a single week of the plan."""

        # Calculate progressive overload multiplier
        volume_multiplier = 1 + (self.volume_increase * (week_num - 1))
        intensity_multiplier = 1 + (self.intensity_increase * (week_num - 1))

        days = []
        for day_key, muscle_groups in split.items():
            day_num = int(day_key.split('_')[1])

            day_exercises = self._select_exercises_for_day(
                muscle_groups=muscle_groups,
                exercises_by_muscle=exercises_by_muscle,
                count=exercises_count,
                goal_config=goal_config,
                volume_multiplier=volume_multiplier,
                intensity_multiplier=intensity_multiplier,
                week_num=week_num
            )

            days.append({
                'day': day_num,
                'name': f"Day {day_num}",
                'focus': ', '.join([m.title() for m in muscle_groups]),
                'exercises': day_exercises
            })

        return {
            'week': week_num,
            'theme': self._get_week_theme(week_num),
            'days': days,
            'notes': f"Week {week_num}: Focus on form and progressive overload."
        }

    def _select_exercises_for_day(
        self,
        muscle_groups: List[str],
        exercises_by_muscle: Dict[str, List[Dict]],
        count: int,
        goal_config: Dict,
        volume_multiplier: float,
        intensity_multiplier: float,
        week_num: int
    ) -> List[Dict]:
        """Select exercises for a single day."""

        selected = []
        exercises_per_muscle = max(1, count // len(muscle_groups))

        for muscle in muscle_groups:
            available = exercises_by_muscle.get(muscle, [])
            if not available:
                # Try similar muscle groups
                similar = self._get_similar_muscles(muscle)
                for sim in similar:
                    if sim in exercises_by_muscle:
                        available = exercises_by_muscle[sim]
                        break

            if available:
                # Select random exercises for variety
                chosen = random.sample(available, min(
                    exercises_per_muscle, len(available)))

                for ex in chosen:
                    base_sets = goal_config.get('sets', 4)
                    reps_range = goal_config.get('reps', [8, 12])

                    # Apply progressive overload
                    adjusted_sets = int(base_sets * volume_multiplier)

                    selected.append({
                        'id': ex.get('id'),
                        'name': ex.get('name'),
                        'muscle_group': ex.get('muscle_group'),
                        # Cap progression
                        'sets': min(adjusted_sets, base_sets + week_num),
                        'reps': f"{reps_range[0]}-{reps_range[1]}",
                        'rest_seconds': self._get_rest_time(goal_config),
                        'notes': ex.get('instructions', '')[:100] if ex.get('instructions') else '',
                        'equipment': ex.get('equipment', [])
                    })

        return selected[:count]  # Ensure we don't exceed count

    def _get_similar_muscles(self, muscle: str) -> List[str]:
        """Get similar muscle groups for fallback."""
        similar_map = {
            'chest': ['shoulders', 'arms'],
            'back': ['shoulders', 'arms'],
            'legs': ['core'],
            'shoulders': ['chest', 'arms'],
            'arms': ['chest', 'back'],
            'core': ['legs']
        }
        return similar_map.get(muscle, [])

    def _get_rest_time(self, goal_config: Dict) -> int:
        """Get rest time between sets based on goal."""
        base_sets = goal_config.get('sets', 4)
        reps = goal_config.get('reps', [8, 12])
        avg_reps = sum(reps) / 2

        # Higher sets and lower reps = strength = longer rest
        if base_sets >= 5 and avg_reps <= 5:
            return 180  # 3 minutes for strength
        elif avg_reps >= 15:
            return 45   # 45 seconds for endurance
        else:
            return 90   # 90 seconds for hypertrophy

    def _get_week_theme(self, week_num: int) -> str:
        """Get a theme/focus for each week."""
        themes = {
            1: "Foundation - Focus on form and baseline",
            2: "Build - Increase volume slightly",
            3: "Push - Challenge yourself with intensity",
            4: "Peak - Maximum effort week"
        }
        return themes.get(week_num, f"Week {week_num}")

    def _generate_notes(self, profile: Dict, goal: str) -> List[str]:
        """Generate helpful notes for the plan."""
        notes = [
            "Always warm up for 5-10 minutes before starting",
            "Stay hydrated throughout your workout",
            "If any exercise causes pain, stop immediately"
        ]

        if profile.get('injuries'):
            notes.append(
                f"⚠️ Exercises have been filtered for your injuries. Always listen to your body.")

        if goal == 'weight_loss':
            notes.append(
                "Consider adding 20-30 minutes of cardio after strength training")
        elif goal == 'muscle_gain':
            notes.append(
                "Focus on progressive overload - increase weight or reps each week")

        return notes

    def plan_to_json(self, plan: Dict) -> str:
        """Convert plan to formatted JSON string."""
        return json.dumps(plan, indent=2, ensure_ascii=False)
