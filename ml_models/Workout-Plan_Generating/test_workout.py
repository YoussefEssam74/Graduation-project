import asyncio
from workout_api_direct import generate_direct, DirectWorkoutRequest
import builtins
builtins.print_orig = builtins.print
def print(*args, **kwargs):
    kwargs['flush'] = True
    print_orig(*args, **kwargs)
builtins.print = print

async def test():
    print('Testing Build Muscle (4 days, Upper/Lower)...')
    req1 = DirectWorkoutRequest(
        user_id=1,
        goal='Build Muscle',
        fitness_level='Intermediate',
        days_per_week=4,
        equipment=['Dumbbell', 'Barbell'],
        injuries=['Lower Back'],
        include_user_context=False
    )
    res = await generate_direct(req1)
    if res.plan:
        print('\nBUILD MUSCLE PLAN:')
        for d in res.plan.get('days', []):
            print(f"  Day: {d.get('day_name')}")
            if d.get('warmup'): print(f"    Warmup: {len(d['warmup'])} exercises")
            print(f"    Main: {len(d.get('exercises',[]))} exercises")
            if d.get('cardio'): print(f"    Cardio: {len(d['cardio'])} exercises")
        print('    Coaching Notes:', res.plan.get('injury_coaching_notes', 'None'))

    print('\nTesting Weight Loss (3 days, Full Body, Should have cardio)...')
    req2 = DirectWorkoutRequest(
        user_id=2,
        goal='WeightLoss',
        fitness_level='Beginner',
        days_per_week=3,
        equipment=['Bodyweight'],
        injuries=[],
        include_user_context=False
    )
    res2 = await generate_direct(req2)
    if res2.plan:
        print('\nWEIGHT LOSS PLAN:')
        for d in res2.plan.get('days', []):
            print(f"  Day: {d.get('day_name')}")
            if d.get('warmup'): print(f"    Warmup: {len(d['warmup'])} exercises")
            print(f"    Main: {len(d.get('exercises',[]))} exercises")
            if d.get('cardio'): print(f"    Cardio: {len(d['cardio'])} exercises")

asyncio.run(test())
