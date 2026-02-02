#!/usr/bin/env python3
"""
Quick test to verify exercise database and gym member data loads correctly
"""
from train import TrainingDataGenerator
import os
import sys
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    print("=" * 70)
    print("Testing Real Exercise Database & Gym Member Data Loader")
    print("=" * 70)

    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    exercise_db = os.path.join(
        script_dir, "../_ML/exercisedb_v1_sample/exercises.json")
    gym_data = os.path.join(
        script_dir, "../_ML/Dataset/gym_members_exercise_tracking.csv")

    print(f"\n1. Loading exercise database from: {exercise_db}")
    print(f"2. Loading gym member data from: {gym_data}")
    print()

    # Initialize generator
    generator = TrainingDataGenerator(
        exercise_db_path=exercise_db,
        gym_data_path=gym_data
    )

    print("\n" + "=" * 70)
    print("DATABASE STATISTICS")
    print("=" * 70)
    print(f"✅ Total exercises: {len(generator.exercises)}")
    print(f"✅ Body parts: {len(generator.all_bodyparts)}")
    print(f"✅ Equipment types: {len(generator.all_equipments)}")

    if generator.gym_members_df is not None:
        print(f"✅ Gym member profiles: {len(generator.gym_members_df)}")
        print(
            f"\n   Age range: {generator.gym_members_df['Age'].min():.0f} - {generator.gym_members_df['Age'].max():.0f}")
        print(
            f"   Weight range: {generator.gym_members_df['Weight (kg)'].min():.1f} - {generator.gym_members_df['Weight (kg)'].max():.1f} kg")
        print(
            f"   Experience levels: {generator.gym_members_df['Experience_Level'].value_counts().to_dict()}")

    # Show sample exercises from each body part
    print("\n" + "=" * 70)
    print("SAMPLE EXERCISES BY BODY PART")
    print("=" * 70)
    for bodypart in sorted(list(generator.all_bodyparts))[:5]:  # Show first 5
        exercises = generator.exercises_by_bodypart.get(bodypart, [])
        print(f"\n{bodypart.upper()} ({len(exercises)} exercises)")
        for ex in exercises[:3]:  # Show 3 examples
            eq = ex.get('equipments', ['bodyweight'])[0]
            print(f"  • {ex['name']} ({eq})")

    # Show sample equipment
    print("\n" + "=" * 70)
    print("AVAILABLE EQUIPMENT")
    print("=" * 70)
    equipment_list = sorted(list(generator.all_equipments))
    for i in range(0, len(equipment_list), 5):
        print("  " + ", ".join(equipment_list[i:i+5]))

    # Generate sample training examples
    print("\n" + "=" * 70)
    print("SAMPLE TRAINING EXAMPLES")
    print("=" * 70)

    for i in range(3):
        sample = generator.generate_sample(i)
        print(f"\n{'─' * 70}")
        print(f"EXAMPLE {i + 1}")
        print(f"{'─' * 70}")
        print(f"\n📥 INPUT PROMPT:")
        print(f"   {sample['input']}")

        # Parse output
        plan = json.loads(sample['output'])
        print(f"\n📤 OUTPUT PLAN:")
        print(f"   Plan Name: {plan['plan_name']}")
        print(f"   Duration: {plan['duration_weeks']} weeks")
        print(f"   Days per Week: {plan['days_per_week']}")
        print(f"   Total Exercises: {plan['metadata']['total_exercises']}")
        print(f"   Data Source: {plan['metadata']['data_source']}")

        # Show first day
        if plan['days']:
            day1 = plan['days'][0]
            print(
                f"\n   Day 1 - {day1['day_name']} ({len(day1['exercises'])} exercises):")
            for ex in day1['exercises'][:3]:  # Show first 3
                print(f"      • {ex['exercise_name']}")
                print(
                    f"        {ex['sets']} sets × {ex['reps']} reps, {ex['rest_seconds']}s rest")
                print(f"        Target: {', '.join(ex['target_muscles'])}")

    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED!")
    print("=" * 70)
    print("\nReady to generate full training dataset with:")
    print("  python train.py --generate-data 5000")
    print()


if __name__ == "__main__":
    main()
