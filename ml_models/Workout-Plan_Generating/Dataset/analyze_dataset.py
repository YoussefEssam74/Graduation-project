import pandas as pd
import json

df = pd.read_csv('workout_dataset.csv')

print('=== workout_days STRUCTURE ===')
for i in range(3):
    row = df.iloc[i]
    label = str(row['main_goal']) + ' | ' + str(row['workout_type']) + ' | ' + str(row['training_level']) + ' | ' + str(row['days_per_week']) + 'd'
    print('\n--- Row ' + str(i) + ': ' + label + ' ---')
    wd_str = row['workout_days']
    if pd.isna(wd_str):
        print('  NULL')
        continue
    try:
        wd = json.loads(wd_str)
        print('  Days: ' + str(len(wd)))
        for day in wd[:2]:
            dl = day.get('day_label', '')
            exs = day.get('exercises', [])
            print('  Day label: ' + str(dl))
            print('  Exercises (' + str(len(exs)) + '):')
            for ex in exs[:4]:
                print('    ' + str(ex))
    except Exception as e:
        print('  PARSE ERROR: ' + str(e))
        print('  RAW: ' + str(wd_str)[:200])

print('\n=== ALL EXERCISE FIELDS across dataset ===')
all_fields = set()
for wd_str in df['workout_days'].dropna():
    try:
        wd = json.loads(wd_str)
        for day in wd:
            for ex in day.get('exercises', []):
                all_fields.update(ex.keys())
    except:
        pass
print('Fields: ' + str(sorted(all_fields)))

has_sets = has_reps = has_rest = has_notes = has_tempo = has_rpe = 0
total_ex = 0
for wd_str in df['workout_days'].dropna():
    try:
        wd = json.loads(wd_str)
        for day in wd:
            for ex in day.get('exercises', []):
                total_ex += 1
                if str(ex.get('sets', '')).strip():
                    has_sets += 1
                if str(ex.get('reps', '')).strip():
                    has_reps += 1
                if str(ex.get('rest', '')).strip():
                    has_rest += 1
                if str(ex.get('notes', '')).strip():
                    has_notes += 1
                if str(ex.get('tempo', '')).strip():
                    has_tempo += 1
                if str(ex.get('rpe', '')).strip():
                    has_rpe += 1
    except:
        pass

print('\nTotal exercises: ' + str(total_ex))
print('Has sets: ' + str(has_sets) + ' (' + str(100*has_sets//max(total_ex,1)) + '%)')
print('Has reps: ' + str(has_reps) + ' (' + str(100*has_reps//max(total_ex,1)) + '%)')
print('Has rest: ' + str(has_rest) + ' (' + str(100*has_rest//max(total_ex,1)) + '%)')
print('Has notes: ' + str(has_notes) + ' (' + str(100*has_notes//max(total_ex,1)) + '%)')
print('Has tempo: ' + str(has_tempo) + ' (' + str(100*has_tempo//max(total_ex,1)) + '%)')
print('Has rpe: ' + str(has_rpe) + ' (' + str(100*has_rpe//max(total_ex,1)) + '%)')

print('\n=== UNIQUE VALUES per categorical column ===')
for col in ['main_goal', 'workout_type', 'training_level', 'target_gender', 'days_per_week']:
    vals = sorted(df[col].dropna().unique().tolist())
    print(col + ': ' + str(vals))

print('\n=== PROGRAM DURATION samples ===')
print(sorted(df['program_duration'].dropna().unique().tolist()))

print('\n=== TIME PER WORKOUT samples ===')
print(sorted(df['time_per_workout'].dropna().unique().tolist())[:20])

print('\n=== EQUIPMENT samples ===')
for eq in df['equipment'].dropna().head(5):
    print('  ' + str(eq))
