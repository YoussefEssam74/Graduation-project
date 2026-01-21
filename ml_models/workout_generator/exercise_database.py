"""
Exercise Database for Workout Generator
=======================================

Contains a comprehensive database of exercises with:
- Exercise name and description
- Target muscle groups
- Required equipment
- Difficulty level
- Step-by-step instructions
- Safety considerations

This is the seed data. In production, this should sync with the database.
"""

# Comprehensive exercise database organized by muscle group
EXERCISE_DATABASE = [
    # ===== CHEST EXERCISES =====
    {
        "id": 1,
        "name": "Barbell Bench Press",
        "description": "Classic compound chest exercise for building mass and strength",
        "muscle_group": "chest",
        "secondary_muscles": ["triceps", "shoulders"],
        "equipment": ["barbell", "bench"],
        "difficulty": "intermediate",
        "instructions": "Lie on bench, grip barbell slightly wider than shoulder width, lower bar to mid-chest, press back up",
        "tips": "Keep feet flat, maintain arch in lower back, control the descent",
        "calories_per_minute": 8
    },
    {
        "id": 2,
        "name": "Dumbbell Chest Press",
        "description": "Dumbbell variation allowing greater range of motion",
        "muscle_group": "chest",
        "secondary_muscles": ["triceps", "shoulders"],
        "equipment": ["dumbbells", "bench"],
        "difficulty": "beginner",
        "instructions": "Lie on bench with dumbbells at chest level, press up and together, lower with control",
        "tips": "Don't lock elbows at top, squeeze chest at peak contraction",
        "calories_per_minute": 7
    },
    {
        "id": 3,
        "name": "Incline Dumbbell Press",
        "description": "Targets upper chest with inclined angle",
        "muscle_group": "chest",
        "secondary_muscles": ["shoulders", "triceps"],
        "equipment": ["dumbbells", "incline_bench"],
        "difficulty": "intermediate",
        "instructions": "Set bench to 30-45 degrees, press dumbbells from shoulder level upward",
        "tips": "Focus on upper chest contraction, don't set incline too high",
        "calories_per_minute": 7
    },
    {
        "id": 4,
        "name": "Push-ups",
        "description": "Bodyweight chest exercise requiring no equipment",
        "muscle_group": "chest",
        "secondary_muscles": ["triceps", "shoulders", "core"],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "instructions": "Start in plank position, lower chest to ground, push back up",
        "tips": "Keep body straight, don't let hips sag or pike up",
        "calories_per_minute": 7
    },
    {
        "id": 5,
        "name": "Cable Flyes",
        "description": "Isolation exercise for chest with constant tension",
        "muscle_group": "chest",
        "secondary_muscles": ["shoulders"],
        "equipment": ["cable_machine"],
        "difficulty": "intermediate",
        "instructions": "Stand between cables, bring hands together in arc motion, squeeze chest",
        "tips": "Slight bend in elbows, focus on chest stretch and squeeze",
        "calories_per_minute": 5
    },
    {
        "id": 6,
        "name": "Dumbbell Flyes",
        "description": "Isolation movement for chest development",
        "muscle_group": "chest",
        "secondary_muscles": ["shoulders"],
        "equipment": ["dumbbells", "bench"],
        "difficulty": "intermediate",
        "instructions": "Lie on bench, lower dumbbells in arc to sides, bring back up",
        "tips": "Keep slight bend in elbows, don't go too deep to protect shoulders",
        "calories_per_minute": 5
    },
    {
        "id": 7,
        "name": "Decline Bench Press",
        "description": "Targets lower chest with declined angle",
        "muscle_group": "chest",
        "secondary_muscles": ["triceps", "shoulders"],
        "equipment": ["barbell", "decline_bench"],
        "difficulty": "intermediate",
        "instructions": "Secure legs on decline bench, lower bar to lower chest, press up",
        "tips": "Have spotter for safety, control the weight throughout",
        "calories_per_minute": 8
    },
    {
        "id": 8,
        "name": "Chest Dips",
        "description": "Bodyweight exercise for lower chest and triceps",
        "muscle_group": "chest",
        "secondary_muscles": ["triceps", "shoulders"],
        "equipment": ["dip_bars"],
        "difficulty": "intermediate",
        "instructions": "Lean forward on dip bars, lower body until stretch in chest, push back up",
        "tips": "Lean forward for chest emphasis, keep elbows flared slightly",
        "calories_per_minute": 8
    },

    # ===== BACK EXERCISES =====
    {
        "id": 9,
        "name": "Pull-ups",
        "description": "Bodyweight pulling exercise for back width",
        "muscle_group": "back",
        "secondary_muscles": ["biceps", "shoulders"],
        "equipment": ["pull_up_bar"],
        "difficulty": "intermediate",
        "instructions": "Hang from bar, pull body up until chin over bar, lower with control",
        "tips": "Full range of motion, don't swing or kip",
        "calories_per_minute": 8
    },
    {
        "id": 10,
        "name": "Lat Pulldown",
        "description": "Machine exercise for lat development",
        "muscle_group": "back",
        "secondary_muscles": ["biceps"],
        "equipment": ["cable_machine"],
        "difficulty": "beginner",
        "instructions": "Grip bar wide, pull down to upper chest, control return",
        "tips": "Don't lean back excessively, focus on lat contraction",
        "calories_per_minute": 6
    },
    {
        "id": 11,
        "name": "Barbell Row",
        "description": "Compound back exercise for thickness",
        "muscle_group": "back",
        "secondary_muscles": ["biceps", "rear_delts"],
        "equipment": ["barbell"],
        "difficulty": "intermediate",
        "instructions": "Bend over, pull barbell to lower chest/upper abs, lower with control",
        "tips": "Keep back flat, don't use momentum",
        "calories_per_minute": 7
    },
    {
        "id": 12,
        "name": "Dumbbell Row",
        "description": "Single arm rowing for back development",
        "muscle_group": "back",
        "secondary_muscles": ["biceps"],
        "equipment": ["dumbbell", "bench"],
        "difficulty": "beginner",
        "instructions": "One hand and knee on bench, row dumbbell to hip, lower slowly",
        "tips": "Keep core tight, don't rotate torso",
        "calories_per_minute": 6
    },
    {
        "id": 13,
        "name": "Seated Cable Row",
        "description": "Cable exercise for mid-back thickness",
        "muscle_group": "back",
        "secondary_muscles": ["biceps"],
        "equipment": ["cable_machine"],
        "difficulty": "beginner",
        "instructions": "Sit at cable row, pull handle to torso, squeeze shoulder blades",
        "tips": "Don't lean too far back, focus on back contraction",
        "calories_per_minute": 6
    },
    {
        "id": 14,
        "name": "Deadlift",
        "description": "Compound movement for entire posterior chain",
        "muscle_group": "back",
        "secondary_muscles": ["legs", "glutes", "core"],
        "equipment": ["barbell"],
        "difficulty": "advanced",
        "instructions": "Stand with bar over mid-foot, hinge and grip, stand up straight",
        "tips": "Keep back flat, drive through heels, bar stays close to body",
        "calories_per_minute": 10
    },
    {
        "id": 15,
        "name": "T-Bar Row",
        "description": "Machine or landmine row for back thickness",
        "muscle_group": "back",
        "secondary_muscles": ["biceps", "rear_delts"],
        "equipment": ["t_bar_machine", "barbell"],
        "difficulty": "intermediate",
        "instructions": "Straddle bar, row to chest, squeeze shoulder blades together",
        "tips": "Keep chest supported, don't use excessive body English",
        "calories_per_minute": 7
    },
    {
        "id": 16,
        "name": "Face Pulls",
        "description": "Cable exercise for rear delts and upper back",
        "muscle_group": "back",
        "secondary_muscles": ["rear_delts", "rotator_cuff"],
        "equipment": ["cable_machine"],
        "difficulty": "beginner",
        "instructions": "Set cable high, pull rope to face with elbows high, squeeze",
        "tips": "Great for shoulder health, don't go too heavy",
        "calories_per_minute": 4
    },

    # ===== LEG EXERCISES =====
    {
        "id": 17,
        "name": "Barbell Squat",
        "description": "King of leg exercises for overall development",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes", "core"],
        "equipment": ["barbell", "squat_rack"],
        "difficulty": "intermediate",
        "instructions": "Bar on upper back, squat down until thighs parallel, stand up",
        "tips": "Keep chest up, knees track over toes, full depth",
        "calories_per_minute": 10
    },
    {
        "id": 18,
        "name": "Leg Press",
        "description": "Machine exercise for quad development",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes"],
        "equipment": ["leg_press_machine"],
        "difficulty": "beginner",
        "instructions": "Sit in machine, press platform away, return with control",
        "tips": "Don't lock knees at top, keep lower back pressed into pad",
        "calories_per_minute": 7
    },
    {
        "id": 19,
        "name": "Romanian Deadlift",
        "description": "Hip hinge for hamstrings and glutes",
        "muscle_group": "legs",
        "secondary_muscles": ["back", "glutes"],
        "equipment": ["barbell"],
        "difficulty": "intermediate",
        "instructions": "Hold bar, push hips back, lower weight along legs, return",
        "tips": "Keep slight bend in knees, feel hamstring stretch",
        "calories_per_minute": 8
    },
    {
        "id": 20,
        "name": "Walking Lunges",
        "description": "Dynamic leg exercise for quads and glutes",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes", "core"],
        "equipment": ["bodyweight", "dumbbells"],
        "difficulty": "beginner",
        "instructions": "Step forward into lunge, push off, alternate legs",
        "tips": "Keep torso upright, don't let knee go past toes",
        "calories_per_minute": 8
    },
    {
        "id": 21,
        "name": "Goblet Squat",
        "description": "Beginner-friendly squat variation",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes", "core"],
        "equipment": ["dumbbell", "kettlebell"],
        "difficulty": "beginner",
        "instructions": "Hold weight at chest, squat down, stand up",
        "tips": "Great for learning squat form, keep elbows inside knees",
        "calories_per_minute": 7
    },
    {
        "id": 22,
        "name": "Leg Curl",
        "description": "Isolation exercise for hamstrings",
        "muscle_group": "legs",
        "secondary_muscles": [],
        "equipment": ["leg_curl_machine"],
        "difficulty": "beginner",
        "instructions": "Lie face down, curl weight toward glutes, lower with control",
        "tips": "Don't lift hips, squeeze hamstrings at top",
        "calories_per_minute": 5
    },
    {
        "id": 23,
        "name": "Leg Extension",
        "description": "Isolation exercise for quadriceps",
        "muscle_group": "legs",
        "secondary_muscles": [],
        "equipment": ["leg_extension_machine"],
        "difficulty": "beginner",
        "instructions": "Sit in machine, extend legs fully, lower with control",
        "tips": "Squeeze quads at top, control the negative",
        "calories_per_minute": 5
    },
    {
        "id": 24,
        "name": "Bulgarian Split Squat",
        "description": "Single leg squat for leg development",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes"],
        "equipment": ["bench", "dumbbells"],
        "difficulty": "intermediate",
        "instructions": "Rear foot on bench, squat down on front leg, push up",
        "tips": "Keep most weight on front foot, control the descent",
        "calories_per_minute": 8
    },
    {
        "id": 25,
        "name": "Calf Raises",
        "description": "Isolation exercise for calf development",
        "muscle_group": "legs",
        "secondary_muscles": [],
        "equipment": ["calf_raise_machine", "bodyweight"],
        "difficulty": "beginner",
        "instructions": "Stand on edge, lower heels, raise up on toes",
        "tips": "Full range of motion, pause at top",
        "calories_per_minute": 4
    },
    {
        "id": 26,
        "name": "Hip Thrust",
        "description": "Best exercise for glute development",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes"],
        "equipment": ["barbell", "bench"],
        "difficulty": "intermediate",
        "instructions": "Upper back on bench, bar on hips, thrust hips up, squeeze glutes",
        "tips": "Tuck chin, drive through heels, full hip extension",
        "calories_per_minute": 7
    },

    # ===== SHOULDER EXERCISES =====
    {
        "id": 27,
        "name": "Overhead Press",
        "description": "Compound shoulder exercise for overall development",
        "muscle_group": "shoulders",
        "secondary_muscles": ["triceps", "core"],
        "equipment": ["barbell"],
        "difficulty": "intermediate",
        "instructions": "Stand with bar at shoulders, press overhead, lower with control",
        "tips": "Tight core, don't lean back excessively",
        "calories_per_minute": 7
    },
    {
        "id": 28,
        "name": "Dumbbell Shoulder Press",
        "description": "Dumbbell variation for shoulder development",
        "muscle_group": "shoulders",
        "secondary_muscles": ["triceps"],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "instructions": "Seated or standing, press dumbbells from shoulders overhead",
        "tips": "Don't lock elbows at top, control the descent",
        "calories_per_minute": 6
    },
    {
        "id": 29,
        "name": "Lateral Raises",
        "description": "Isolation for side delts and shoulder width",
        "muscle_group": "shoulders",
        "secondary_muscles": [],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "instructions": "Raise dumbbells out to sides until shoulder height, lower slowly",
        "tips": "Slight bend in elbows, lead with elbows not hands",
        "calories_per_minute": 4
    },
    {
        "id": 30,
        "name": "Front Raises",
        "description": "Isolation for front delts",
        "muscle_group": "shoulders",
        "secondary_muscles": [],
        "equipment": ["dumbbells", "plate"],
        "difficulty": "beginner",
        "instructions": "Raise weight in front to shoulder height, lower with control",
        "tips": "Don't swing, keep core tight",
        "calories_per_minute": 4
    },
    {
        "id": 31,
        "name": "Reverse Flyes",
        "description": "Targets rear delts for shoulder balance",
        "muscle_group": "shoulders",
        "secondary_muscles": ["upper_back"],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "instructions": "Bent over, raise dumbbells out to sides, squeeze shoulder blades",
        "tips": "Light weight, focus on rear delt contraction",
        "calories_per_minute": 4
    },
    {
        "id": 32,
        "name": "Arnold Press",
        "description": "Rotational press for complete delt development",
        "muscle_group": "shoulders",
        "secondary_muscles": ["triceps"],
        "equipment": ["dumbbells"],
        "difficulty": "intermediate",
        "instructions": "Start with palms facing you, rotate and press overhead",
        "tips": "Smooth rotation, don't rush the movement",
        "calories_per_minute": 6
    },
    {
        "id": 33,
        "name": "Upright Row",
        "description": "Compound for traps and side delts",
        "muscle_group": "shoulders",
        "secondary_muscles": ["traps"],
        "equipment": ["barbell", "dumbbells"],
        "difficulty": "intermediate",
        "instructions": "Pull weight up along body to chin level, elbows high",
        "tips": "Wide grip is easier on shoulders, don't go too heavy",
        "calories_per_minute": 5
    },

    # ===== ARM EXERCISES =====
    {
        "id": 34,
        "name": "Barbell Curl",
        "description": "Classic bicep exercise for mass",
        "muscle_group": "arms",
        "secondary_muscles": ["forearms"],
        "equipment": ["barbell"],
        "difficulty": "beginner",
        "instructions": "Curl bar from thighs to shoulders, lower with control",
        "tips": "Don't swing, keep elbows at sides",
        "calories_per_minute": 5
    },
    {
        "id": 35,
        "name": "Dumbbell Curl",
        "description": "Dumbbell variation for bicep development",
        "muscle_group": "arms",
        "secondary_muscles": ["forearms"],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "instructions": "Curl dumbbells with supinated grip, lower slowly",
        "tips": "Alternate or simultaneous, full range of motion",
        "calories_per_minute": 4
    },
    {
        "id": 36,
        "name": "Hammer Curls",
        "description": "Neutral grip curl for biceps and brachialis",
        "muscle_group": "arms",
        "secondary_muscles": ["forearms"],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "instructions": "Curl with neutral (hammer) grip, lower with control",
        "tips": "Great for arm thickness, don't swing",
        "calories_per_minute": 4
    },
    {
        "id": 37,
        "name": "Tricep Pushdown",
        "description": "Cable exercise for tricep development",
        "muscle_group": "arms",
        "secondary_muscles": [],
        "equipment": ["cable_machine"],
        "difficulty": "beginner",
        "instructions": "Push cable bar down until arms straight, return with control",
        "tips": "Keep elbows at sides, squeeze at bottom",
        "calories_per_minute": 4
    },
    {
        "id": 38,
        "name": "Skull Crushers",
        "description": "Lying tricep extension for mass",
        "muscle_group": "arms",
        "secondary_muscles": [],
        "equipment": ["ez_bar", "bench"],
        "difficulty": "intermediate",
        "instructions": "Lower bar to forehead, extend arms, repeat",
        "tips": "Keep elbows pointing up, control the weight",
        "calories_per_minute": 5
    },
    {
        "id": 39,
        "name": "Tricep Dips",
        "description": "Bodyweight tricep exercise",
        "muscle_group": "arms",
        "secondary_muscles": ["chest", "shoulders"],
        "equipment": ["dip_bars", "bench"],
        "difficulty": "intermediate",
        "instructions": "Lower body by bending elbows, push back up",
        "tips": "Keep body upright for tricep focus",
        "calories_per_minute": 7
    },
    {
        "id": 40,
        "name": "Close Grip Bench Press",
        "description": "Compound tricep exercise",
        "muscle_group": "arms",
        "secondary_muscles": ["chest"],
        "equipment": ["barbell", "bench"],
        "difficulty": "intermediate",
        "instructions": "Grip barbell narrow, lower to lower chest, press up",
        "tips": "Hands shoulder width, elbows close to body",
        "calories_per_minute": 7
    },
    {
        "id": 41,
        "name": "Preacher Curl",
        "description": "Isolated bicep curl on preacher bench",
        "muscle_group": "arms",
        "secondary_muscles": [],
        "equipment": ["preacher_bench", "ez_bar"],
        "difficulty": "beginner",
        "instructions": "Rest arms on pad, curl weight up, lower slowly",
        "tips": "Don't fully extend at bottom, constant tension",
        "calories_per_minute": 4
    },
    {
        "id": 42,
        "name": "Overhead Tricep Extension",
        "description": "Stretch-focused tricep exercise",
        "muscle_group": "arms",
        "secondary_muscles": [],
        "equipment": ["dumbbell"],
        "difficulty": "beginner",
        "instructions": "Hold weight overhead, lower behind head, extend up",
        "tips": "Keep elbows pointing up, good stretch at bottom",
        "calories_per_minute": 4
    },

    # ===== CORE EXERCISES =====
    {
        "id": 43,
        "name": "Plank",
        "description": "Isometric core stability exercise",
        "muscle_group": "core",
        "secondary_muscles": ["shoulders"],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "instructions": "Hold body in straight line on forearms and toes",
        "tips": "Don't let hips sag or pike, breathe normally",
        "calories_per_minute": 4
    },
    {
        "id": 44,
        "name": "Crunches",
        "description": "Basic ab exercise",
        "muscle_group": "core",
        "secondary_muscles": [],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "instructions": "Lie on back, curl shoulders off ground, lower slowly",
        "tips": "Don't pull on neck, focus on ab contraction",
        "calories_per_minute": 5
    },
    {
        "id": 45,
        "name": "Russian Twists",
        "description": "Rotational core exercise for obliques",
        "muscle_group": "core",
        "secondary_muscles": ["obliques"],
        "equipment": ["bodyweight", "medicine_ball"],
        "difficulty": "beginner",
        "instructions": "Seated, lean back, rotate torso side to side",
        "tips": "Keep feet elevated for challenge, controlled rotation",
        "calories_per_minute": 6
    },
    {
        "id": 46,
        "name": "Leg Raises",
        "description": "Lower ab focused exercise",
        "muscle_group": "core",
        "secondary_muscles": ["hip_flexors"],
        "equipment": ["bodyweight"],
        "difficulty": "intermediate",
        "instructions": "Lie on back, raise legs to vertical, lower with control",
        "tips": "Press lower back into floor, controlled movement",
        "calories_per_minute": 5
    },
    {
        "id": 47,
        "name": "Hanging Leg Raises",
        "description": "Advanced lower ab exercise",
        "muscle_group": "core",
        "secondary_muscles": ["grip"],
        "equipment": ["pull_up_bar"],
        "difficulty": "advanced",
        "instructions": "Hang from bar, raise legs to horizontal or higher",
        "tips": "Don't swing, control the movement",
        "calories_per_minute": 6
    },
    {
        "id": 48,
        "name": "Cable Woodchops",
        "description": "Rotational core exercise",
        "muscle_group": "core",
        "secondary_muscles": ["obliques", "shoulders"],
        "equipment": ["cable_machine"],
        "difficulty": "intermediate",
        "instructions": "Pull cable diagonally across body in chopping motion",
        "tips": "Rotate through core, not arms",
        "calories_per_minute": 5
    },
    {
        "id": 49,
        "name": "Dead Bug",
        "description": "Core stability exercise",
        "muscle_group": "core",
        "secondary_muscles": [],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "instructions": "Lie on back, extend opposite arm/leg while keeping core braced",
        "tips": "Keep lower back pressed into floor",
        "calories_per_minute": 4
    },
    {
        "id": 50,
        "name": "Mountain Climbers",
        "description": "Dynamic core and cardio exercise",
        "muscle_group": "core",
        "secondary_muscles": ["shoulders", "hip_flexors"],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "instructions": "In plank position, drive knees toward chest alternating rapidly",
        "tips": "Keep hips low, maintain plank position",
        "calories_per_minute": 10
    },

    # ===== CARDIO/FULL BODY EXERCISES =====
    {
        "id": 51,
        "name": "Burpees",
        "description": "Full body high intensity exercise",
        "muscle_group": "full_body",
        "secondary_muscles": ["chest", "legs", "core"],
        "equipment": ["bodyweight"],
        "difficulty": "intermediate",
        "instructions": "Squat down, kick feet back, push-up, jump up with arms overhead",
        "tips": "Modify by stepping instead of jumping",
        "calories_per_minute": 12
    },
    {
        "id": 52,
        "name": "Kettlebell Swing",
        "description": "Explosive hip hinge for conditioning",
        "muscle_group": "full_body",
        "secondary_muscles": ["glutes", "hamstrings", "core"],
        "equipment": ["kettlebell"],
        "difficulty": "intermediate",
        "instructions": "Hinge at hips, swing kettlebell to shoulder height using hip drive",
        "tips": "Power comes from hips, not arms",
        "calories_per_minute": 12
    },
    {
        "id": 53,
        "name": "Box Jumps",
        "description": "Explosive plyometric exercise",
        "muscle_group": "legs",
        "secondary_muscles": ["glutes", "core"],
        "equipment": ["plyo_box"],
        "difficulty": "intermediate",
        "instructions": "Jump onto box, step down, repeat",
        "tips": "Land softly, step down to protect knees",
        "calories_per_minute": 10
    },
    {
        "id": 54,
        "name": "Battle Ropes",
        "description": "High intensity upper body cardio",
        "muscle_group": "full_body",
        "secondary_muscles": ["arms", "shoulders", "core"],
        "equipment": ["battle_ropes"],
        "difficulty": "intermediate",
        "instructions": "Create waves in ropes using alternating or simultaneous arm movements",
        "tips": "Keep core engaged, maintain rhythm",
        "calories_per_minute": 12
    },
    {
        "id": 55,
        "name": "Rowing Machine",
        "description": "Full body cardio and strength",
        "muscle_group": "full_body",
        "secondary_muscles": ["back", "legs", "arms"],
        "equipment": ["rowing_machine"],
        "difficulty": "beginner",
        "instructions": "Push with legs, lean back, pull handle to chest",
        "tips": "Legs, core, arms on pull; arms, core, legs on return",
        "calories_per_minute": 10
    },
    {
        "id": 56,
        "name": "Jump Rope",
        "description": "Cardio exercise for conditioning",
        "muscle_group": "full_body",
        "secondary_muscles": ["calves", "shoulders"],
        "equipment": ["jump_rope"],
        "difficulty": "beginner",
        "instructions": "Jump over rope with small hops, rotate rope with wrists",
        "tips": "Stay on balls of feet, small jumps",
        "calories_per_minute": 12
    },
    {
        "id": 57,
        "name": "Farmer's Walk",
        "description": "Loaded carry for grip and full body strength",
        "muscle_group": "full_body",
        "secondary_muscles": ["grip", "core", "traps"],
        "equipment": ["dumbbells", "kettlebells"],
        "difficulty": "beginner",
        "instructions": "Hold heavy weights at sides, walk with controlled steps",
        "tips": "Keep chest up, shoulders back, controlled breathing",
        "calories_per_minute": 8
    },
    {
        "id": 58,
        "name": "Thrusters",
        "description": "Compound squat to press movement",
        "muscle_group": "full_body",
        "secondary_muscles": ["legs", "shoulders", "core"],
        "equipment": ["barbell", "dumbbells"],
        "difficulty": "intermediate",
        "instructions": "Front squat, then drive weight overhead in one fluid motion",
        "tips": "Use momentum from squat to help press",
        "calories_per_minute": 11
    },

    # ===== ADDITIONAL VARIATIONS =====
    {
        "id": 59,
        "name": "Inverted Row",
        "description": "Bodyweight rowing for beginners",
        "muscle_group": "back",
        "secondary_muscles": ["biceps"],
        "equipment": ["smith_machine", "rings"],
        "difficulty": "beginner",
        "instructions": "Hang under bar, pull chest to bar, lower with control",
        "tips": "Great pull-up progression, keep body straight",
        "calories_per_minute": 6
    },
    {
        "id": 60,
        "name": "Chest Supported Row",
        "description": "Row variation that protects lower back",
        "muscle_group": "back",
        "secondary_muscles": ["biceps"],
        "equipment": ["incline_bench", "dumbbells"],
        "difficulty": "beginner",
        "instructions": "Lie chest on incline bench, row dumbbells up, lower slowly",
        "tips": "Takes lower back out of equation",
        "calories_per_minute": 5
    },
]


def get_all_exercises():
    """Return all exercises in the database."""
    return EXERCISE_DATABASE.copy()


def get_exercises_by_muscle_group(muscle_group: str):
    """Get exercises for a specific muscle group."""
    return [ex for ex in EXERCISE_DATABASE if ex['muscle_group'].lower() == muscle_group.lower()]


def get_exercises_by_difficulty(difficulty: str):
    """Get exercises for a specific difficulty level."""
    return [ex for ex in EXERCISE_DATABASE if ex['difficulty'].lower() == difficulty.lower()]


def get_exercises_by_equipment(equipment: list):
    """Get exercises that can be done with available equipment."""
    equipment_lower = [e.lower() for e in equipment]
    # Include bodyweight as always available
    equipment_lower.append('bodyweight')

    return [
        ex for ex in EXERCISE_DATABASE
        if any(eq.lower() in equipment_lower for eq in ex['equipment'])
    ]
