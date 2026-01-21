"""
Injury → Exercise Mappings for PulseGym AI
==========================================

This module defines which exercises are UNSAFE for specific injuries.
These mappings are used as HARD FILTERS - exercises are completely excluded
from workout plans if the user has the corresponding injury.

CRITICAL: This is a safety-first approach. When in doubt, exclude the exercise.
"""

from typing import List, Set, Dict

# =============================================================================
# INJURY → UNSAFE EXERCISES MAPPING
# =============================================================================
# Key: injury type (lowercase, normalized)
# Value: list of exercise names/patterns to EXCLUDE
# =============================================================================

INJURY_EXERCISE_MAP: Dict[str, List[str]] = {
    # ----- KNEE INJURIES -----
    "knee": [
        "squat", "squats", "front_squat", "back_squat", "goblet_squat",
        "lunge", "lunges", "walking_lunge", "reverse_lunge", "lateral_lunge",
        "leg_press", "hack_squat",
        "leg_extension", "leg_curl",
        "jump", "jumping", "box_jump", "jump_squat", "jumping_jack",
        "running", "run", "jogging", "sprinting", "sprint",
        "step_up", "step_ups", "stair_climbing",
        "burpee", "burpees",
        "mountain_climber", "mountain_climbers",
        "pistol_squat", "bulgarian_split_squat",
    ],

    "knee_acl": [
        # All knee exercises plus additional high-risk movements
        "squat", "squats", "front_squat", "back_squat",
        "lunge", "lunges",
        "leg_press",
        "jump", "jumping", "box_jump", "plyometrics",
        "running", "sprinting",
        "pivot", "cutting_drills",
        "leg_extension",  # High shear force on ACL
    ],

    # ----- BACK INJURIES -----
    "back": [
        "deadlift", "deadlifts", "sumo_deadlift", "romanian_deadlift", "rdl",
        "bent_over_row", "barbell_row", "pendlay_row",
        "good_morning", "good_mornings",
        "heavy_squat", "back_squat",
        "clean", "snatch", "power_clean",
        "hyperextension", "back_extension",
        "sit_up", "sit_ups", "crunch", "crunches",  # Can strain lower back
        "leg_raise", "hanging_leg_raise",
    ],

    "lower_back": [
        "deadlift", "deadlifts", "sumo_deadlift", "romanian_deadlift",
        "bent_over_row", "barbell_row",
        "good_morning",
        "squat",  # Heavy squats
        "leg_press",  # Can round lower back
        "sit_up", "crunch",
        "russian_twist",
        "superman",
    ],

    "upper_back": [
        "pull_up", "chin_up",  # If severe
        "lat_pulldown",
        "bent_over_row",
        "face_pull",
        "shrug", "shrugs",
    ],

    # ----- SHOULDER INJURIES -----
    "shoulder": [
        "overhead_press", "military_press", "shoulder_press",
        "lateral_raise", "front_raise", "rear_delt_fly",
        "upright_row", "upright_rows",
        "dip", "dips", "bench_dip",
        "push_up", "push_ups",  # Can aggravate
        "bench_press", "incline_bench", "decline_bench",
        "arnold_press",
        "pull_up", "chin_up",  # Strain on shoulder
        "snatch", "clean_and_jerk",
        "face_pull",
        "swimming",
    ],

    "rotator_cuff": [
        "overhead_press", "military_press",
        "lateral_raise", "front_raise",
        "upright_row",
        "dip", "dips",
        "pull_up",
        "bench_press",
        "internal_rotation", "external_rotation",  # Without supervision
        "throwing",
    ],

    # ----- WRIST INJURIES -----
    "wrist": [
        "push_up", "push_ups",
        "plank", "planks",
        "front_squat",  # Wrist flexibility required
        "clean", "power_clean",
        "wrist_curl", "reverse_wrist_curl",
        "bench_press",  # Can strain wrist
        "overhead_press",
        "pull_up",  # Grip stress
        "kettlebell",  # General strain
    ],

    # ----- ANKLE INJURIES -----
    "ankle": [
        "running", "jogging", "sprinting",
        "jump", "jumping", "box_jump", "jump_rope",
        "calf_raise", "calf_raises", "standing_calf_raise",
        "squat",  # Deep squats
        "lunge", "lunges",
        "step_up", "stair_climbing",
        "burpee",
        "lateral_movement", "agility_drill",
    ],

    # ----- HIP INJURIES -----
    "hip": [
        "squat", "squats", "deep_squat",
        "lunge", "lunges",
        "hip_thrust", "glute_bridge",
        "step_up", "step_ups",
        "leg_press",
        "deadlift",  # Can strain hip
        "running", "jogging",
        "hip_abduction", "hip_adduction",
        "fire_hydrant",
        "clamshell",
    ],

    "hip_flexor": [
        "running", "sprinting",
        "lunge", "lunges",
        "leg_raise", "hanging_leg_raise",
        "mountain_climber",
        "sit_up", "crunch",
        "bicycle_crunch",
        "high_knee",
    ],

    # ----- NECK INJURIES -----
    "neck": [
        "shrug", "shrugs",
        "upright_row",
        "neck_extension", "neck_flexion", "neck_rotation",
        "shoulder_press",  # Can strain neck
        "sit_up", "crunch",  # Pulling on neck
        "wrestling", "grappling",
    ],

    # ----- ELBOW INJURIES -----
    "elbow": [
        "tricep_dip", "bench_dip", "dip", "dips",
        "skull_crusher", "lying_tricep_extension",
        "close_grip_bench_press",
        "pull_up", "chin_up",
        "bicep_curl",  # Can aggravate
        "hammer_curl",
        "push_up",
        "bench_press",
        "overhead_tricep_extension",
    ],

    "tennis_elbow": [
        "wrist_curl", "reverse_wrist_curl",
        "bicep_curl",
        "hammer_curl",
        "pull_up", "chin_up",
        "row",  # Various rows
        "lat_pulldown",
        "gripping_exercises",
    ],

    # ----- HERNIATED DISC -----
    "herniated_disc": [
        "deadlift", "any_deadlift",
        "squat", "heavy_squat",
        "bent_over_row",
        "good_morning",
        "sit_up", "crunch",
        "leg_raise",
        "twisting_movements",
        "running",  # Impact
    ],

    # ----- PREGNANCY (Special Case) -----
    "pregnancy": [
        "heavy_lifting",  # Any heavy compound
        "lying_on_back",  # After first trimester
        "high_impact",
        "contact_sport",
        "hot_yoga",
        "scuba_diving",
    ],

    # ----- HEART CONDITION (Special Case) -----
    "heart_condition": [
        "heavy_lifting",
        "isometric_hold",  # Valsalva maneuver
        "high_intensity",
        "sprint",
        "plyo",  # Plyometrics
    ],
}

# =============================================================================
# ALIASES - Map common variations to main injury types
# =============================================================================
INJURY_ALIASES: Dict[str, str] = {
    "knee injury": "knee",
    "bad knee": "knee",
    "knee pain": "knee",
    "acl": "knee_acl",
    "acl tear": "knee_acl",
    "mcl": "knee",
    "meniscus": "knee",

    "back injury": "back",
    "bad back": "back",
    "back pain": "back",
    "lower back pain": "lower_back",
    "lumbar": "lower_back",
    "sciatica": "lower_back",
    "herniated": "herniated_disc",
    "slipped disc": "herniated_disc",

    "shoulder injury": "shoulder",
    "bad shoulder": "shoulder",
    "shoulder pain": "shoulder",
    "rotator": "rotator_cuff",
    "torn rotator": "rotator_cuff",

    "wrist injury": "wrist",
    "bad wrist": "wrist",
    "carpal tunnel": "wrist",

    "ankle injury": "ankle",
    "sprained ankle": "ankle",
    "ankle sprain": "ankle",

    "hip injury": "hip",
    "hip pain": "hip",
    "hip flexor strain": "hip_flexor",

    "neck injury": "neck",
    "neck pain": "neck",
    "whiplash": "neck",

    "elbow injury": "elbow",
    "elbow pain": "elbow",
    "tennis elbow": "tennis_elbow",
    "golfer's elbow": "elbow",

    "pregnant": "pregnancy",
    "expecting": "pregnancy",

    "heart": "heart_condition",
    "cardiac": "heart_condition",
    "heart disease": "heart_condition",

    # Additional aliases
    "lower back": "lower_back",
    "lowerback": "lower_back",
    "lumbar": "lower_back",
}


def normalize_injury(injury: str) -> str:
    """Normalize injury string to match mapping keys."""
    normalized = injury.lower().strip()
    return INJURY_ALIASES.get(normalized, normalized)


def get_unsafe_exercises(injuries: List[str]) -> Set[str]:
    """
    Get all exercises that should be EXCLUDED for a list of injuries.

    Args:
        injuries: List of injury descriptions (e.g., ["knee", "lower back pain"])

    Returns:
        Set of exercise names to EXCLUDE

    Example:
        >>> get_unsafe_exercises(["knee injury", "shoulder"])
        {'squat', 'lunges', 'overhead_press', 'lateral_raise', ...}
    """
    unsafe = set()

    for injury in injuries:
        normalized = normalize_injury(injury)

        if normalized in INJURY_EXERCISE_MAP:
            unsafe.update(INJURY_EXERCISE_MAP[normalized])
        else:
            # Log unknown injury for review
            print(
                f"WARNING: Unknown injury type '{injury}' (normalized: '{normalized}')")

    return unsafe


def is_exercise_safe(exercise_name: str, injuries: List[str]) -> bool:
    """
    Check if a specific exercise is safe for user with given injuries.

    Args:
        exercise_name: Name of the exercise
        injuries: List of user's injuries

    Returns:
        True if exercise is safe, False if it should be excluded
    """
    unsafe_exercises = get_unsafe_exercises(injuries)

    # Check exact match
    if exercise_name.lower() in unsafe_exercises:
        return False

    # Check partial match (e.g., "barbell squat" contains "squat")
    exercise_lower = exercise_name.lower()
    for unsafe in unsafe_exercises:
        if unsafe in exercise_lower or exercise_lower in unsafe:
            return False

    return True


def filter_exercises(
    exercises: List[Dict],
    injuries: List[str],
    name_field: str = "name"
) -> List[Dict]:
    """
    Filter a list of exercise dictionaries, removing unsafe ones.

    Args:
        exercises: List of exercise dicts with name field
        injuries: List of user's injuries
        name_field: Key name for exercise name in dict

    Returns:
        Filtered list with only safe exercises
    """
    if not injuries:
        return exercises

    unsafe = get_unsafe_exercises(injuries)
    filtered = []

    for exercise in exercises:
        name = exercise.get(name_field, "").lower()

        # Check if exercise name matches any unsafe exercise
        is_unsafe = False
        for unsafe_name in unsafe:
            if unsafe_name in name or name in unsafe_name:
                is_unsafe = True
                break

        if not is_unsafe:
            filtered.append(exercise)

    return filtered
