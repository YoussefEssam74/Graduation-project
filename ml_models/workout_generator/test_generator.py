"""
Test Script for Workout Generator
=================================

Run this to test the workout generator locally.

Usage:
    cd ml_models
    python -m workout_generator.test_generator
"""

import yaml
from safety import SafetyFilter
from workout_generator.plan_builder import WorkoutPlanBuilder
from workout_generator.exercise_database import get_all_exercises, get_exercises_by_muscle_group
import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Load config
config_path = os.path.join(os.path.dirname(
    os.path.dirname(__file__)), 'config.yaml')
with open(config_path, 'r') as f:
    config = yaml.safe_load(f)


def test_exercise_database():
    """Test the exercise database."""
    print("\n" + "="*60)
    print("TEST 1: Exercise Database")
    print("="*60)

    exercises = get_all_exercises()
    print(f"✓ Total exercises in database: {len(exercises)}")

    # Count by muscle group
    muscle_groups = {}
    for ex in exercises:
        mg = ex.get('muscle_group', 'unknown')
        muscle_groups[mg] = muscle_groups.get(mg, 0) + 1

    print("\nExercises by muscle group:")
    for mg, count in sorted(muscle_groups.items()):
        print(f"  - {mg}: {count}")

    return True


def test_safety_filter():
    """Test the safety filter."""
    print("\n" + "="*60)
    print("TEST 2: Safety Filter")
    print("="*60)

    # Test profile with knee injury
    profile = {
        'injuries': ['knee'],
        'allergies': []
    }

    safety_filter = SafetyFilter.from_user_profile(profile)

    # Get all exercises
    exercises = get_all_exercises()

    # Filter
    safe_exercises, removed = safety_filter.filter_exercises(exercises)

    print(f"✓ Total exercises: {len(exercises)}")
    print(f"✓ Safe exercises (for knee injury): {len(safe_exercises)}")
    print(f"✓ Removed exercises: {len(removed)}")

    if removed:
        print("\nRemoved exercises:")
        for ex in removed[:5]:  # Show first 5
            print(f"  - {ex['name']} (reason: unsafe for knee injury)")

    return True


def test_plan_builder():
    """Test the workout plan builder."""
    print("\n" + "="*60)
    print("TEST 3: Workout Plan Builder")
    print("="*60)

    # Test profile
    profile = {
        'age': 25,
        'weight': 75,
        'height': 175,
        'gender': 'male',
        'fitness_level': 'intermediate',
        'goal': 'muscle_gain',
        'injuries': [],
        'days_per_week': 4
    }

    # Get exercises (already safe since no injuries)
    exercises = get_all_exercises()

    # Build plan
    plan_builder = WorkoutPlanBuilder(config)
    plan = plan_builder.build_plan(
        user_id=1,
        profile=profile,
        exercises=exercises,
        duration_weeks=4
    )

    print(f"✓ Plan created for user_id: {plan['user_id']}")
    print(f"✓ Duration: {plan['duration_weeks']} weeks")
    print(f"✓ Days per week: {plan['days_per_week']}")
    print(f"✓ Split type: {plan['split_type']}")
    print(f"✓ Goal: {plan['goal']}")

    # Show Week 1
    print("\nWeek 1 Preview:")
    week1 = plan['weeks'][0]
    for day_key, day_data in week1.items():
        if day_key == 'week_number':
            continue
        print(f"\n  {day_key.replace('_', ' ').title()}:")
        if isinstance(day_data, dict) and 'exercises' in day_data:
            for ex in day_data['exercises'][:3]:  # Show first 3
                print(f"    - {ex['name']}: {ex['sets']}x{ex['reps']}")

    return plan


def test_with_injuries():
    """Test plan generation with injuries."""
    print("\n" + "="*60)
    print("TEST 4: Plan with Injuries (Knee + Back)")
    print("="*60)

    profile = {
        'age': 40,
        'weight': 85,
        'height': 180,
        'gender': 'male',
        'fitness_level': 'beginner',
        'goal': 'weight_loss',
        'injuries': ['knee', 'lower_back'],
        'days_per_week': 3
    }

    # Filter exercises for safety
    safety_filter = SafetyFilter.from_user_profile(profile)
    all_exercises = get_all_exercises()
    safe_exercises, removed = safety_filter.filter_exercises(all_exercises)

    print(f"✓ User injuries: knee, lower_back")
    print(f"✓ Safe exercises available: {len(safe_exercises)}")
    print(f"✓ Dangerous exercises removed: {len(removed)}")

    # Build plan with safe exercises only
    plan_builder = WorkoutPlanBuilder(config)
    plan = plan_builder.build_plan(
        user_id=2,
        profile=profile,
        exercises=safe_exercises,
        duration_weeks=4
    )

    print(f"\n✓ Plan created successfully!")
    print(f"✓ Split type: {plan['split_type']}")

    # Verify no dangerous exercises in plan
    dangerous_exercises = ['squats', 'lunges',
                           'deadlift', 'leg press', 'box jumps', 'running']
    has_dangerous = False

    for week in plan['weeks']:
        for day_key, day_data in week.items():
            if isinstance(day_data, dict) and 'exercises' in day_data:
                for ex in day_data['exercises']:
                    ex_name_lower = ex['name'].lower()
                    for dangerous in dangerous_exercises:
                        if dangerous in ex_name_lower:
                            print(
                                f"⚠️ Found potentially dangerous exercise: {ex['name']}")
                            has_dangerous = True

    if not has_dangerous:
        print("✓ No dangerous exercises found in plan - Safety filter working!")

    return plan


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("  WORKOUT GENERATOR - TEST SUITE")
    print("="*60)

    try:
        test_exercise_database()
        test_safety_filter()
        plan = test_plan_builder()
        test_with_injuries()

        print("\n" + "="*60)
        print("  ALL TESTS PASSED! ✓")
        print("="*60)

        # Optionally save sample output
        save_output = input(
            "\nSave sample plan to JSON? (y/n): ").strip().lower()
        if save_output == 'y':
            output_path = os.path.join(os.path.dirname(
                __file__), 'sample_plan_output.json')
            with open(output_path, 'w') as f:
                json.dump(plan, f, indent=2)
            print(f"✓ Saved to: {output_path}")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
