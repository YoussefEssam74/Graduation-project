"""
Comprehensive Test for Workout Generator
Tests: CSV loading, Safety filtering, Plan building
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_dataset_loading():
    """Test 1: CSV Dataset Loading"""
    print("\n" + "="*60)
    print("TEST 1: Dataset Loading")
    print("="*60)

    from workout_generator.dataset_loader import get_dataset_loader

    loader = get_dataset_loader()

    print(f"✓ Total exercises loaded: {loader.get_exercises_count()}")
    print(f"✓ Unique body parts: {len(loader.get_unique_body_parts())}")
    print(f"✓ Unique equipment: {len(loader.get_unique_equipment())}")
    print(f"✓ Unique muscles: {len(loader.get_unique_muscles())}")

    # Test body part distribution
    print("\nExercises by body part:")
    for bp in loader.get_unique_body_parts():
        count = len(loader.get_exercises_by_body_part(bp))
        print(f"  {bp}: {count}")

    # Test search
    chest_ex = loader.search_exercises("bench press", limit=3)
    print(f"\nSearch 'bench press': found {len(chest_ex)} exercises")
    for ex in chest_ex:
        print(f"  - {ex['name']}")

    return True


def test_safety_filter():
    """Test 2: Safety Filter with CSV exercises"""
    print("\n" + "="*60)
    print("TEST 2: Safety Filter")
    print("="*60)

    from safety import SafetyFilter
    from workout_generator.dataset_loader import get_all_exercises

    exercises = get_all_exercises()
    print(f"Total exercises: {len(exercises)}")

    # Test with knee injury
    sf_knee = SafetyFilter.from_user_profile({'injuries': ['knee']})
    safe_knee, result_knee = sf_knee.filter_exercises(exercises)
    print(f"\n✓ Knee injury filter:")
    print(f"  Original: {result_knee.original_count}")
    print(f"  Safe: {result_knee.filtered_count}")
    print(
        f"  Removed: {result_knee.removed_count} ({result_knee.removal_rate:.1f}%)")

    # Test with multiple injuries
    sf_multi = SafetyFilter.from_user_profile({
        'injuries': ['knee', 'lower back', 'shoulder']
    })
    safe_multi, result_multi = sf_multi.filter_exercises(exercises)
    print(f"\n✓ Multiple injuries (knee + lower back + shoulder):")
    print(f"  Original: {result_multi.original_count}")
    print(f"  Safe: {result_multi.filtered_count}")
    print(
        f"  Removed: {result_multi.removed_count} ({result_multi.removal_rate:.1f}%)")

    # Show some removed exercises
    print(f"\n  Sample removed exercises:")
    for item in result_multi.removed_items[:5]:
        print(f"    - {item}")

    return True


def test_plan_builder():
    """Test 3: Workout Plan Builder"""
    print("\n" + "="*60)
    print("TEST 3: Plan Builder")
    print("="*60)

    from safety import SafetyFilter
    from workout_generator.dataset_loader import get_all_exercises
    from workout_generator.plan_builder import WorkoutPlanBuilder

    # Get exercises
    all_exercises = get_all_exercises()

    # Filter for user with knee injury
    sf = SafetyFilter.from_user_profile({'injuries': ['knee']})
    safe_exercises, _ = sf.filter_exercises(all_exercises)

    print(f"Safe exercises available: {len(safe_exercises)}")

    # Create plan builder
    config = {
        'workout_generator': {
            'default_weeks': 4,
            'exercises_per_day': {
                'beginner': 4,
                'intermediate': 5,
                'advanced': 6
            },
            'sets_reps': {
                'strength': {'sets': 5, 'reps': [3, 5]},
                'hypertrophy': {'sets': 4, 'reps': [8, 12]},
                'endurance': {'sets': 3, 'reps': [15, 20]},
                'weight_loss': {'sets': 3, 'reps': [12, 15]}
            },
            'progression': {
                'volume_increase_per_week': 0.05,
                'intensity_increase_per_week': 0.025
            }
        }
    }

    builder = WorkoutPlanBuilder(config)

    # Build plan
    profile = {
        'fitness_level': 'intermediate',
        'goal': 'muscle_gain',
        'days_per_week': 4,
        'injuries': ['knee']
    }

    plan = builder.build_plan(
        user_id=1,
        profile=profile,
        exercises=safe_exercises,
        duration_weeks=4
    )

    print(f"\n✓ Plan generated successfully!")
    print(f"  User ID: {plan['user_id']}")
    print(f"  Duration: {plan['duration_weeks']} weeks")
    print(f"  Days per week: {plan['days_per_week']}")
    print(f"  Split type: {plan['split_type']}")
    print(f"  Goal: {plan['goal']}")

    # Show Week 1, Day 1
    week1 = plan['weeks'][0]
    print(f"\n  Week 1 - {week1['theme']}:")

    day1 = week1['days'][0]
    print(f"    {day1['name']} - {day1['focus']}:")
    for ex in day1['exercises'][:3]:
        print(f"      - {ex['name']}: {ex['sets']} sets x {ex['reps']} reps")

    return plan


def test_full_flow():
    """Test 4: Full API-style flow"""
    print("\n" + "="*60)
    print("TEST 4: Full API Flow")
    print("="*60)

    import json
    from safety import SafetyFilter
    from workout_generator.dataset_loader import get_dataset_loader
    from workout_generator.plan_builder import WorkoutPlanBuilder

    # Simulate API request
    request_data = {
        'user_id': 42,
        'profile': {
            'age': 28,
            'gender': 'male',
            'weight': 80,
            'height': 175,
            'fitness_level': 'beginner',
            'goal': 'weight_loss',
            'days_per_week': 3,
            'injuries': [],
            'available_equipment': ['dumbbell', 'barbell', 'body weight']
        }
    }

    print(f"Request: Generate workout for user {request_data['user_id']}")
    print(f"  Goal: {request_data['profile']['goal']}")
    print(f"  Fitness level: {request_data['profile']['fitness_level']}")
    print(f"  Days/week: {request_data['profile']['days_per_week']}")

    # Step 1: Load dataset
    loader = get_dataset_loader()

    # Step 2: Filter by equipment
    all_exercises = loader.get_all_exercises()
    equipment = request_data['profile'].get('available_equipment', [])

    if equipment:
        filtered = []
        for ex in all_exercises:
            ex_equip = [e.lower() for e in ex.get('equipment', [])]
            if any(eq.lower() in str(ex_equip) for eq in equipment):
                filtered.append(ex)
        exercises = filtered
    else:
        exercises = all_exercises

    print(f"\n  Exercises matching equipment: {len(exercises)}")

    # Step 3: Safety filter
    sf = SafetyFilter.from_user_profile(request_data['profile'])
    safe_exercises, filter_result = sf.filter_exercises(exercises)

    print(f"  After safety filter: {len(safe_exercises)}")

    # Step 4: Build plan
    config = {'workout_generator': {}}  # Use defaults
    builder = WorkoutPlanBuilder(config)

    plan = builder.build_plan(
        user_id=request_data['user_id'],
        profile=request_data['profile'],
        exercises=safe_exercises,
        duration_weeks=4
    )

    # Step 5: Output JSON
    print(f"\n✓ Workout plan generated!")
    print(f"  Total weeks: {plan['duration_weeks']}")
    print(
        f"  Total workout days: {sum(len(w['days']) for w in plan['weeks'])}")

    # Count total exercises
    total_ex = sum(
        len(day['exercises'])
        for week in plan['weeks']
        for day in week['days']
    )
    print(f"  Total exercises scheduled: {total_ex}")

    # Show JSON preview
    json_output = json.dumps(plan, indent=2)
    print(f"\n  JSON size: {len(json_output)} characters")
    print(f"\n  Sample output (first 500 chars):")
    print(json_output[:500])

    return True


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("WORKOUT GENERATOR - COMPREHENSIVE TEST SUITE")
    print("="*60)

    try:
        test_dataset_loading()
        test_safety_filter()
        test_plan_builder()
        test_full_flow()

        print("\n" + "="*60)
        print("ALL TESTS PASSED ✓")
        print("="*60)

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
