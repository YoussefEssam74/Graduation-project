#!/usr/bin/env python3
"""
Lightweight test - just loads data without torch dependencies
"""
import os
import json
import pandas as pd


def main():
    print("=" * 70)
    print("Testing Real Exercise Database & Gym Member Data")
    print("=" * 70)

    # Paths
    base_dir = "d:/Youssef/Projects/_Graduation Project/Project Repo/Graduation-project/ml_models"
    exercise_db_path = f"{base_dir}/_ML/Dataset/Dataset_Workout_plans.csv"
    gym_data_path = f"{base_dir}/_ML/Dataset/gym recommendation.csv"

    # Load exercise database from CSV
    print(f"\n1. Loading exercise database...")
    exercises_df = pd.read_csv(exercise_db_path)
    print(f"   ✅ Loaded {len(exercises_df)} real exercises from CSV!")

    # Convert to list of dicts for easier processing
    exercises = exercises_df.to_dict('records')

    # Load gym member data
    print(f"\n2. Loading gym member data...")
    gym_df = pd.read_csv(gym_data_path)
    print(f"   ✅ Loaded {len(gym_df)} user profiles with fitness goals!")

    # Organize exercises
    print("\n" + "=" * 70)
    print("EXERCISE DATABASE STATISTICS")
    print("=" * 70)

    bodyparts = set()
    equipments = set()
    muscles = set()
    exercises_by_bodypart = {}

    for ex in exercises:
        # Parse body parts (might be comma-separated)
        bp_str = str(ex.get('bodyParts', ''))
        if bp_str and bp_str != 'nan':
            bp_list = bp_str.split('|') if '|' in bp_str else [bp_str]
            for bp in bp_list:
                bp = bp.strip()
                if bp:
                    bodyparts.add(bp)
                    if bp not in exercises_by_bodypart:
                        exercises_by_bodypart[bp] = []
                    exercises_by_bodypart[bp].append(ex)

        # Parse equipment
        eq_str = str(ex.get('equipments', ''))
        if eq_str and eq_str != 'nan':
            eq_list = eq_str.split('|') if '|' in eq_str else [eq_str]
            for eq in eq_list:
                eq = eq.strip()
                if eq:
                    equipments.add(eq)

        # Parse muscles
        muscle_str = str(ex.get('targetMuscles', ''))
        if muscle_str and muscle_str != 'nan':
            muscle_list = muscle_str.split(
                '|') if '|' in muscle_str else [muscle_str]
            for m in muscle_list:
                m = m.strip()
                if m:
                    muscles.add(m)

    print(f"✅ Total exercises: {len(exercises)}")
    print(f"✅ Body parts: {len(bodyparts)}")
    print(f"✅ Equipment types: {len(equipments)}")
    print(f"✅ Target muscles: {len(muscles)}")

    # Show sample exercises
    print("\n" + "=" * 70)
    print("SAMPLE EXERCISES BY BODY PART")
    print("=" * 70)

    for bodypart in sorted(list(bodyparts))[:6]:
        ex_list = exercises_by_bodypart.get(bodypart, [])
        print(f"\n{bodypart.upper()} ({len(ex_list)} exercises)")
        for ex in ex_list[:4]:
            eq = str(ex.get('equipments', 'bodyweight')).split(
                '|')[0] if ex.get('equipments') else 'bodyweight'
            target = str(ex.get('targetMuscles', '')).split(
                '|')[0] if ex.get('targetMuscles') else ''
            print(f"  • {ex.get('name', 'Unknown')} ({eq}) - targets: {target}")

    # Show equipment types
    print("\n" + "=" * 70)
    print("AVAILABLE EQUIPMENT TYPES")
    print("=" * 70)
    eq_list = sorted(list(equipments))
    for i in range(0, len(eq_list), 4):
        print("  " + " | ".join(eq_list[i:i+4]))

    # Gym member statistics
    print("\n" + "=" * 70)
    print("GYM MEMBER DATA STATISTICS")
    print("=" * 70)
    print(f"Total members: {len(gym_df)}")
    print(
        f"\nAge: {gym_df['Age'].min():.0f} - {gym_df['Age'].max():.0f} years (avg: {gym_df['Age'].mean():.1f})")
    print(
        f"Weight: {gym_df['Weight'].min():.1f} - {gym_df['Weight'].max():.1f} kg (avg: {gym_df['Weight'].mean():.1f})")
    print(
        f"BMI: {gym_df['BMI'].min():.1f} - {gym_df['BMI'].max():.1f} (avg: {gym_df['BMI'].mean():.1f})")

    print(f"\nFitness Goals:")
    print(gym_df['Fitness Goal'].value_counts().to_string())

    print(f"\nFitness Types:")
    print(gym_df['Fitness Type'].value_counts().to_string())

    print(f"\nHealth Conditions:")
    print(f"  Hypertension: {(gym_df['Hypertension'] == 'Yes').sum()} members")
    print(f"  Diabetes: {(gym_df['Diabetes'] == 'Yes').sum()} members")

    # Generate sample training example
    print("\n" + "=" * 70)
    print("SAMPLE TRAINING DATA GENERATION")
    print("=" * 70)

    import random
    random.seed(42)

    # Pick random member
    member = gym_df.sample(n=1).iloc[0]
    level_map = {'Underweight': 'Beginner', 'Normal': 'Intermediate',
                 'Overweight': 'Advanced', 'Obese': 'Intermediate'}
    fitness_level = level_map.get(member['Level'], 'Intermediate')

    # Pick goal and equipment from member data
    goal = member['Fitness Goal']
    equipment_list = str(member.get('Equipment', '')).split(',')
    equipment = [eq.strip() for eq in equipment_list if eq.strip()][:3]

    # Calculate realistic stats
    weight = member['Weight']
    bmi = member['BMI']

    # Generate input prompt using real data
    input_text = f"Generate a 4-day workout plan for {fitness_level.lower()} lifter, goal is {goal.lower()}"
    input_text += f", user weight {weight}kg, BMI {bmi:.1f}"
    if equipment:
        input_text += f", has access to {', '.join(equipment[:2])}"

    # Add health conditions
    conditions = []
    if member['Hypertension'] == 'Yes':
        conditions.append('hypertension')
    if member['Diabetes'] == 'Yes':
        conditions.append('diabetes')
    if conditions:
        input_text += f", health conditions: {', '.join(conditions)}"

    print(f"\n📥 SAMPLE INPUT PROMPT (from real user data):")
    print(f"   {input_text}")

    # Generate sample workout plan from REAL exercises
    plan_exercises = []
    for bodypart in random.sample(list(bodyparts), k=min(4, len(bodyparts))):
        ex_list = exercises_by_bodypart.get(bodypart, [])
        if ex_list:
            ex = random.choice(ex_list)
            plan_exercises.append({
                'name': ex.get('name', 'Unknown'),
                'bodypart': bodypart,
                'equipment': str(ex.get('equipments', 'bodyweight')).split('|')[0],
                'targets': str(ex.get('targetMuscles', '')).split('|')[0] if ex.get('targetMuscles') else '',
                'instructions': str(ex.get('instructions', ''))[:100] + '...'
            })

    print(f"\n📤 SAMPLE EXERCISES SELECTED (from 7961 real exercises):")
    for i, ex in enumerate(plan_exercises, 1):
        print(f"   {i}. {ex['name']}")
        print(
            f"      Body Part: {ex['bodypart']} | Equipment: {ex['equipment']}")
        print(f"      Targets: {ex['targets']}")
        print(f"      Instructions: {ex['instructions']}")

    print("\n" + "=" * 70)
    print("✅ DATA VALIDATION COMPLETE!")
    print("=" * 70)
    print("\n🎯 Ready to generate training dataset:")
    print(
        f"   - {len(exercises):,} REAL exercises with step-by-step instructions")
    print(f"   - {len(gym_df):,} REAL user profiles with fitness goals")
    print(f"   - {len(bodyparts)} body parts, {len(equipments)} equipment types")
    print(f"   - Health conditions, fitness goals, equipment preferences")
    print("\n📝 Next step: Generate 5000 training examples")
    print("   python train.py --generate-data 5000")
    print()


if __name__ == "__main__":
    main()
