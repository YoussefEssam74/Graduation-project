import sys, json
sys.stdout.reconfigure(encoding='utf-8')

with open('mns_plans_v2.jsonl', encoding='utf-8') as f:
    records = [json.loads(l) for l in f]

print(f'Total records: {len(records)}')
r = records[0]

summary = {
    'url': r['url'],
    'title': r['title'],
    'main_goal': r['main_goal'],
    'workout_type': r['workout_type'],
    'training_level': r['training_level'],
    'program_duration': r['program_duration'],
    'days_per_week': r['days_per_week'],
    'equipment': r['equipment'],
    'target_gender': r['target_gender'],
    'recommended_supps': r['recommended_supps'],
    'pdf_url': r['pdf_url'],
    'description_length': len(r['description']),
    'workout_days_count': len(r['workout_days']),
    'schedule_examples_count': len(r['schedule_examples']),
    'has_target_schema': bool(r.get('target_output_schema')),
    'target_schema_keys': list((r.get('target_output_schema') or {}).keys())[:5],
}

print(json.dumps(summary, indent=2, ensure_ascii=False))

if r['workout_days']:
    print('\nFirst day:', r['workout_days'][0]['day_label'])
    for ex in r['workout_days'][0]['exercises'][:3]:
        print(' ', ex)

print('\n=== Coverage ===')
has_title = sum(1 for x in records if x['title'])
has_goal = sum(1 for x in records if x['main_goal'])
has_desc = sum(1 for x in records if x['description'])
has_days = sum(1 for x in records if x['workout_days'])
has_pdf = sum(1 for x in records if x['pdf_url'])
has_schema = sum(1 for x in records if x.get('target_output_schema'))
total_ex = sum(sum(len(d['exercises']) for d in x['workout_days']) for x in records)

print(f"Has title:         {has_title}/{len(records)} ({100*has_title//len(records)}%)")
print(f"Has goal:          {has_goal}/{len(records)} ({100*has_goal//len(records)}%)")
print(f"Has description:   {has_desc}/{len(records)} ({100*has_desc//len(records)}%)")
print(f"Has workout_days:  {has_days}/{len(records)} ({100*has_days//len(records)}%)")
print(f"Has pdf_url:       {has_pdf}/{len(records)} ({100*has_pdf//len(records)}%)")
print(f"Has target_schema: {has_schema}/{len(records)} ({100*has_schema//len(records)}%)")
print(f"Total exercises:   {total_ex}")
