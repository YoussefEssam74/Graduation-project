"""
safety_engine_v2.py
===================
PulseGym Safety Engine v2 — Post-generation LLM output validator and corrector.

Architecture
------------
::

    LLM generates raw plan (markdown)
            │
            ▼
    ┌─────────────────────────────┐
    │  SemanticExerciseDetector   │  Extract exercise names from markdown tables
    │  (fuzzy + synonym matching) │  using difflib + synonym expansion
    └─────────────┬───────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  ConstraintEngine           │  Check injury / equipment constraints
    │  (priority: injury >        │  Returns violations with replacement hints
    │   equipment > goal > pref)  │
    └─────────────┬───────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  ReplacementEngine          │  unsafe exercise → safest equivalent
    │  (equipment-aware)          │  respects available equipment
    └─────────────┬───────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  PrehabhInjector            │  Adds mandatory prehab if missing
    │  (duplicate-aware)          │  Checks existing plan before injecting
    └─────────────┬───────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  MuscleBalanceValidator     │  Validates push:pull ratio,
    │                             │  weekly volume per muscle group
    └─────────────┬───────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │  PlanScorer                 │  0–100 quality score + dimension breakdown
    └─────────────┬───────────────┘
                 │
                 ▼
        SafetyReport (dataclass)

Integrates with existing injury_rules_engine.InjuryRulesEngine
for severity-stratified clinical constraints.

Dependencies: Python stdlib only (difflib, re, dataclasses).
No ML libraries required for the safety layer.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Set, Tuple, Any

# Configure standard output to UTF-8 on Windows to prevent Unicode encoding issues
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass



# ══════════════════════════════════════════════════════════════════════════════
#  EXERCISE KNOWLEDGE GRAPH
# ══════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class Exercise:
    """Immutable node in the exercise knowledge graph."""
    name: str
    muscles_primary: Tuple[str, ...]
    muscles_secondary: Tuple[str, ...]
    movement_pattern: str          # squat | hip_hinge | horizontal_push | etc.
    equipment_required: Tuple[str, ...]  # ("barbell",) or ("dumbbells", "cables")
    injury_risk: Tuple[str, ...]   # ("shoulder", "knee") — regions at risk
    movement_type: str             # compound | isolation | cardio | rehab
    push_pull: str                 # push | pull | legs | core | cardio | neutral


# Full exercise knowledge graph
EXERCISE_GRAPH: List[Exercise] = [
    # ── CHEST ─────────────────────────────────────────────────────────────────
    Exercise("Barbell Bench Press",        ("chest",), ("triceps","front_delt"),       "horizontal_push", ("barbell",),              ("shoulder","wrist"), "compound", "push"),
    Exercise("Incline Barbell Press",      ("chest",), ("triceps","front_delt"),       "horizontal_push", ("barbell",),              ("shoulder","wrist"), "compound", "push"),
    Exercise("Dumbbell Bench Press",       ("chest",), ("triceps","front_delt"),       "horizontal_push", ("dumbbells",),            ("shoulder",),        "compound", "push"),
    Exercise("Incline Dumbbell Press",     ("chest",), ("triceps","front_delt"),       "horizontal_push", ("dumbbells",),            ("shoulder",),        "compound", "push"),
    Exercise("Decline Dumbbell Press",     ("chest",), ("triceps",),                  "horizontal_push", ("dumbbells",),            ("shoulder",),        "compound", "push"),
    Exercise("Cable Crossover",            ("chest",), ("front_delt",),               "horizontal_push", ("cables",),              (),                   "isolation","push"),
    Exercise("Cable Flyes",                ("chest",), ("front_delt",),               "horizontal_push", ("cables",),              (),                   "isolation","push"),
    Exercise("Dumbbell Flyes",             ("chest",), ("front_delt",),               "horizontal_push", ("dumbbells",),            ("shoulder",),        "isolation","push"),
    Exercise("Push-ups",                   ("chest",), ("triceps","front_delt"),       "horizontal_push", (),                       ("wrist",),           "compound", "push"),
    Exercise("Machine Chest Press",        ("chest",), ("triceps",),                  "horizontal_push", ("machines",),            (),                   "compound", "push"),
    # ── BACK ──────────────────────────────────────────────────────────────────
    Exercise("Barbell Row",                ("back",),  ("biceps","rear_delt"),         "horizontal_pull", ("barbell",),              ("lower_back",),      "compound", "pull"),
    Exercise("Dumbbell Row",               ("back",),  ("biceps","rear_delt"),         "horizontal_pull", ("dumbbells",),            (),                   "compound", "pull"),
    Exercise("One-Arm Dumbbell Row",       ("back",),  ("biceps","rear_delt"),         "horizontal_pull", ("dumbbells",),            (),                   "compound", "pull"),
    Exercise("Seated Cable Row",           ("back",),  ("biceps","rear_delt"),         "horizontal_pull", ("cables",),              (),                   "compound", "pull"),
    Exercise("Cable Row",                  ("back",),  ("biceps","rear_delt"),         "horizontal_pull", ("cables",),              (),                   "compound", "pull"),
    Exercise("Lat Pulldown",               ("back",),  ("biceps",),                   "vertical_pull",   ("cables","machines"),    (),                   "compound", "pull"),
    Exercise("Wide-Grip Lat Pulldown",     ("back",),  ("biceps",),                   "vertical_pull",   ("cables","machines"),    (),                   "compound", "pull"),
    Exercise("Close-Grip Lat Pulldown",    ("back",),  ("biceps",),                   "vertical_pull",   ("cables","machines"),    (),                   "compound", "pull"),
    Exercise("Pull-Ups",                   ("back",),  ("biceps",),                   "vertical_pull",   (),                       ("shoulder","elbow"), "compound", "pull"),
    Exercise("Chin-Ups",                   ("back",),  ("biceps",),                   "vertical_pull",   (),                       ("shoulder","elbow"), "compound", "pull"),
    Exercise("Face Pulls",                 ("rear_delt","rotator_cuff"), ("traps",),  "horizontal_pull", ("cables",),              (),                   "rehab",    "pull"),
    Exercise("Rear Delt Flyes",            ("rear_delt",), ("traps",),               "horizontal_pull", ("dumbbells","cables"),    (),                   "isolation","pull"),
    # ── SHOULDERS ─────────────────────────────────────────────────────────────
    Exercise("Barbell Overhead Press",     ("shoulders",),("triceps","traps"),         "vertical_push",   ("barbell",),              ("shoulder","lower_back"), "compound","push"),
    Exercise("Dumbbell Shoulder Press",    ("shoulders",),("triceps",),               "vertical_push",   ("dumbbells",),            ("shoulder",),        "compound", "push"),
    Exercise("Military Press",             ("shoulders",),("triceps","traps"),         "vertical_push",   ("barbell",),              ("shoulder","lower_back"), "compound","push"),
    Exercise("Arnold Press",               ("shoulders",),("triceps",),               "vertical_push",   ("dumbbells",),            ("shoulder",),        "compound", "push"),
    Exercise("Lateral Raises",             ("shoulders",),(),                         "shoulder_raise",  ("dumbbells","cables"),    ("shoulder",),        "isolation","push"),
    Exercise("Front Raises",               ("front_delt",),(),                        "shoulder_raise",  ("dumbbells","cables"),    ("shoulder",),        "isolation","push"),
    Exercise("Upright Rows",               ("shoulders","traps"),(),                  "vertical_pull",   ("barbell","cables"),      ("shoulder",),        "compound", "pull"),
    # ── BICEPS ────────────────────────────────────────────────────────────────
    Exercise("Barbell Curl",               ("biceps",),  (),                          "elbow_flexion",   ("barbell",),              ("elbow","wrist"),    "isolation","pull"),
    Exercise("Dumbbell Curl",              ("biceps",),  (),                          "elbow_flexion",   ("dumbbells",),            ("elbow",),           "isolation","pull"),
    Exercise("Hammer Curl",                ("biceps","brachialis"), (),               "elbow_flexion",   ("dumbbells",),            ("elbow",),           "isolation","pull"),
    Exercise("Cable Curl",                 ("biceps",),  (),                          "elbow_flexion",   ("cables",),              ("elbow",),           "isolation","pull"),
    Exercise("Concentration Curl",         ("biceps",),  (),                          "elbow_flexion",   ("dumbbells",),            ("elbow",),           "isolation","pull"),
    Exercise("Preacher Curl",              ("biceps",),  (),                          "elbow_flexion",   ("dumbbells","barbell","cables"),("elbow",),     "isolation","pull"),
    # ── TRICEPS ───────────────────────────────────────────────────────────────
    Exercise("Tricep Dips",                ("triceps",), ("chest","shoulder"),         "elbow_extension", (),                       ("shoulder","elbow"), "compound", "push"),
    Exercise("Skull Crushers",             ("triceps",), (),                          "elbow_extension", ("barbell","dumbbells"),   ("elbow","wrist"),    "isolation","push"),
    Exercise("Cable Pushdown",             ("triceps",), (),                          "elbow_extension", ("cables",),              ("elbow",),           "isolation","push"),
    Exercise("Overhead Tricep Extension",  ("triceps",), (),                          "elbow_extension", ("cables","dumbbells"),    ("shoulder","elbow"), "isolation","push"),
    Exercise("Dumbbell Kickback",          ("triceps",), (),                          "elbow_extension", ("dumbbells",),            ("elbow",),           "isolation","push"),
    Exercise("Close-Grip Bench Press",     ("triceps",), ("chest",),                  "horizontal_push", ("barbell",),              ("shoulder","wrist"), "compound", "push"),
    # ── LEGS ──────────────────────────────────────────────────────────────────
    Exercise("Barbell Back Squat",         ("quads","glutes"), ("hamstrings",),       "squat",           ("barbell",),              ("knee","lower_back"),"compound", "legs"),
    Exercise("Front Squat",                ("quads",),   ("glutes","core"),           "squat",           ("barbell",),              ("knee","wrist"),     "compound", "legs"),
    Exercise("Goblet Squat",               ("quads","glutes"), ("core",),             "squat",           ("dumbbells",),            ("knee",),            "compound", "legs"),
    Exercise("Box Squat",                  ("quads","glutes"), (),                    "squat",           ("barbell",),              ("knee","lower_back"),"compound", "legs"),
    Exercise("Leg Press",                  ("quads","glutes"), ("hamstrings",),       "squat",           ("machines",),            ("knee","lower_back"),"compound", "legs"),
    Exercise("Barbell Deadlift",           ("hamstrings","glutes"),("back","traps"),  "hip_hinge",       ("barbell",),              ("lower_back","knee"),"compound", "legs"),
    Exercise("Romanian Deadlift",          ("hamstrings","glutes"),("lower_back",),   "hip_hinge",       ("barbell","dumbbells"),   ("lower_back",),      "compound", "legs"),
    Exercise("Dumbbell Deadlift",          ("hamstrings","glutes"),("lower_back",),   "hip_hinge",       ("dumbbells",),            ("lower_back",),      "compound", "legs"),
    Exercise("Hip Thrust",                 ("glutes",),  ("hamstrings",),             "hip_hinge",       ("barbell","dumbbells","machines"),("lower_back",),"compound","legs"),
    Exercise("Glute Bridge",               ("glutes",),  ("hamstrings",),             "hip_hinge",       (),                       (),                   "compound", "legs"),
    Exercise("Dumbbell Lunge",             ("quads","glutes"), ("hamstrings",),       "lunge",           ("dumbbells",),            ("knee",),            "compound", "legs"),
    Exercise("Barbell Lunge",              ("quads","glutes"), ("hamstrings",),       "lunge",           ("barbell",),              ("knee","lower_back"),"compound", "legs"),
    Exercise("Reverse Lunge",              ("quads","glutes"), (),                    "lunge",           ("dumbbells",),            ("knee",),            "compound", "legs"),
    Exercise("Bulgarian Split Squat",      ("quads","glutes"), (),                    "lunge",           ("dumbbells","barbell"),   ("knee",),            "compound", "legs"),
    Exercise("Leg Extension",              ("quads",),   (),                          "knee_extension",  ("machines",),            ("knee",),            "isolation","legs"),
    Exercise("Seated Leg Curl",            ("hamstrings",),(),                        "knee_flexion",    ("machines",),            ("knee",),            "isolation","legs"),
    Exercise("Lying Leg Curl",             ("hamstrings",),(),                        "knee_flexion",    ("machines",),            ("knee",),            "isolation","legs"),
    Exercise("Terminal Knee Extension",    ("quads",),   (),                          "knee_extension",  ("cables",),              (),                   "rehab",    "legs"),
    Exercise("Standing Calf Raise",        ("calves",),  (),                          "calf",            (),                       ("ankle",),           "isolation","legs"),
    Exercise("Seated Calf Raise",          ("calves","soleus"),(),                    "calf",            ("machines",),            (),                   "isolation","legs"),
    Exercise("Step-Ups",                   ("quads","glutes"),(),                     "lunge",           (),                       ("knee",),            "compound", "legs"),
    # ── CORE ──────────────────────────────────────────────────────────────────
    Exercise("Plank",                      ("core",),    ("shoulders","glutes"),      "core_flexion",    (),                       (),                   "compound", "core"),
    Exercise("Side Plank",                 ("core","obliques"),(),                    "core_flexion",    (),                       ("shoulder","wrist"), "compound", "core"),
    Exercise("Russian Twists",             ("obliques",),(),                          "core_flexion",    (),                       (),                   "isolation","core"),
    Exercise("Leg Raises",                 ("core","hip_flexors"),(),                 "core_flexion",    (),                       (),                   "isolation","core"),
    Exercise("Cable Crunches",             ("core",),    (),                          "core_flexion",    ("cables",),              (),                   "isolation","core"),
    Exercise("Ab Crunches",                ("core",),    (),                          "core_flexion",    (),                       ("lower_back",),      "isolation","core"),
    Exercise("Bicycle Crunches",           ("core","obliques"),(),                    "core_flexion",    (),                       (),                   "isolation","core"),
    Exercise("Hanging Leg Raises",         ("core","hip_flexors"),(),                 "core_flexion",    (),                       ("shoulder","elbow"), "isolation","core"),
    Exercise("Dead Bug",                   ("core",),    ("lower_back",),             "core_flexion",    (),                       (),                   "rehab",    "core"),
    Exercise("Bird-Dog",                   ("core","lower_back"),(),                  "core_flexion",    (),                       (),                   "rehab",    "core"),
    Exercise("Pallof Press",               ("core","obliques"),(),                    "core_flexion",    ("cables",),              (),                   "rehab",    "core"),
    # ── PREHAB / REHAB ────────────────────────────────────────────────────────
    Exercise("Band External Rotation",     ("rotator_cuff",),(),                      "shoulder_raise",  ("resistance_bands",),    (),                   "rehab",    "neutral"),
    Exercise("Prone Y-T-W Raise",          ("rotator_cuff","rear_delt"),(),           "shoulder_raise",  (),                       (),                   "rehab",    "neutral"),
    Exercise("Banded Clamshell",           ("glutes","hip_abductors"),(),             "hip_hinge",       ("resistance_bands",),    (),                   "rehab",    "legs"),
    Exercise("Cable Pull-Through",         ("glutes","hamstrings"),(),                "hip_hinge",       ("cables",),              (),                   "rehab",    "legs"),
]

# Build lookup by name (lowercase) for fast access
_GRAPH_BY_NAME: Dict[str, Exercise] = {ex.name.lower(): ex for ex in EXERCISE_GRAPH}

# ── Synonym map: alternate names → canonical name ──────────────────────────────
EXERCISE_SYNONYMS: Dict[str, str] = {
    # Bench press variants
    "flat bench press": "Barbell Bench Press",
    "bench press": "Barbell Bench Press",
    "flat barbell bench": "Barbell Bench Press",
    "flat bench": "Barbell Bench Press",
    "db bench press": "Dumbbell Bench Press",
    "dumbbell press": "Dumbbell Bench Press",
    "incline db press": "Incline Dumbbell Press",
    "incline press": "Incline Dumbbell Press",
    "incline dumbbell bench press": "Incline Dumbbell Press",
    # Squat variants
    "squat": "Barbell Back Squat",
    "barbell squat": "Barbell Back Squat",
    "back squat": "Barbell Back Squat",
    "bb squat": "Barbell Back Squat",
    "back squats": "Barbell Back Squat",
    "squats": "Barbell Back Squat",
    # Deadlift variants
    "deadlift": "Barbell Deadlift",
    "barbell deadlift": "Barbell Deadlift",
    "rdl": "Romanian Deadlift",
    "romanian dl": "Romanian Deadlift",
    "stiff leg deadlift": "Romanian Deadlift",
    # Row variants
    "bent-over row": "Barbell Row",
    "bent over row": "Barbell Row",
    "barbell bent-over row": "Barbell Row",
    "db row": "Dumbbell Row",
    "one arm row": "One-Arm Dumbbell Row",
    "one-arm row": "One-Arm Dumbbell Row",
    "single arm row": "One-Arm Dumbbell Row",
    "cable row": "Seated Cable Row",
    "seated row": "Seated Cable Row",
    # Overhead press variants
    "ohp": "Barbell Overhead Press",
    "overhead press": "Barbell Overhead Press",
    "shoulder press": "Dumbbell Shoulder Press",
    "db shoulder press": "Dumbbell Shoulder Press",
    "db ohp": "Dumbbell Shoulder Press",
    "seated dumbbell shoulder press": "Dumbbell Shoulder Press",
    "military press": "Military Press",
    "db shoulder press variation": "Dumbbell Shoulder Press",
    "dumbbell shoulder press variation": "Dumbbell Shoulder Press",
    "incline shoulder press": "Dumbbell Shoulder Press",
    "incline shoulder press machine": "Dumbbell Shoulder Press",
    "shoulder press machine": "Dumbbell Shoulder Press",
    # Pull variants
    "pulldown": "Lat Pulldown",
    "pull-down": "Lat Pulldown",
    "pull down": "Lat Pulldown",
    "pullup": "Pull-Ups",
    "pull-up": "Pull-Ups",
    "pull up": "Pull-Ups",
    "chinup": "Chin-Ups",
    "chin-up": "Chin-Ups",
    "chin up": "Chin-Ups",
    # Upright row
    "upright row": "Upright Rows",
    "barbell upright row": "Upright Rows",
    "upright dumbbell raise": "Upright Rows",
    "upright dumbbell row": "Upright Rows",
    # Dip variants
    "dip": "Tricep Dips",
    "tricep dip": "Tricep Dips",
    "assisted dip": "Tricep Dips",
    "tricep dips (assisted)": "Tricep Dips",
    "assisted dips": "Tricep Dips",
    "assisted tricep dips": "Tricep Dips",
    "assisted tricep dip": "Tricep Dips",
    # Lunge variants
    "lunge": "Dumbbell Lunge",
    "walking lunge": "Dumbbell Lunge",
    "reverse lunge": "Reverse Lunge",
    "lunges": "Dumbbell Lunge",
    "reverse lunges": "Reverse Lunge",
    "step-up": "Step-Ups",
    "step up": "Step-Ups",
    # Leg press
    "leg press": "Leg Press",
    "leg press (calves)": "Leg Press",
    "leg presses": "Leg Press",
    # Curl variants
    "barbell curl": "Barbell Curl",
    "bicep curl": "Dumbbell Curl",
    "ez bar curl": "Barbell Curl",
    "hammer curls": "Hammer Curl",
    "concentration curls": "Concentration Curl",
    # Calf raise variants
    "calf raise": "Standing Calf Raise",
    "calf raises": "Standing Calf Raise",
    # Front raise variants
    "front raise": "Front Raises",
    "front dumbbell raise": "Front Raises",
    "front dumbbell raises": "Front Raises",
    # Glute/hip
    "hip thrust": "Hip Thrust",
    "glute bridge": "Glute Bridge",
    "bridge": "Glute Bridge",
    # Rehab
    "face pull": "Face Pulls",
    "band pull-apart": "Band External Rotation",
    "banded pull-apart": "Band External Rotation",
    "banded pull apart": "Band External Rotation",
    "external rotation": "Band External Rotation",
    "y-t-w": "Prone Y-T-W Raise",
    "ytw": "Prone Y-T-W Raise",
    "prone ytw": "Prone Y-T-W Raise",
}


# ══════════════════════════════════════════════════════════════════════════════
#  INJURY CONSTRAINT TABLES
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class InjuryConstraint:
    """Constraint data for one injury region."""
    banned_patterns: Set[str]          # movement_pattern values that are banned
    banned_exercise_names: Set[str]    # specific canonical names always banned
    mandatory_prehab: List[Exercise]   # exercises that MUST appear in the plan
    replacements: Dict[str, List[str]] # banned_exercise_name → [safe alternatives]


INJURY_CONSTRAINTS: Dict[str, InjuryConstraint] = {
    "shoulder": InjuryConstraint(
        banned_patterns={"vertical_push"},
        banned_exercise_names={
            "Military Press", "Barbell Overhead Press", "Dumbbell Shoulder Press",
            "Arnold Press", "Upright Rows", "Front Raises", "Tricep Dips",
            "Push Press", "Overhead Tricep Extension",
        },
        mandatory_prehab=[
            Exercise("Face Pulls",           ("rear_delt","rotator_cuff"),(),"horizontal_pull",("cables",),(),"rehab","pull"),
            Exercise("Band External Rotation",("rotator_cuff",),(),"shoulder_raise",("resistance_bands",),(),"rehab","neutral"),
            Exercise("Prone Y-T-W Raise",    ("rotator_cuff","rear_delt"),(),"shoulder_raise",(),(),"rehab","neutral"),
        ],
        replacements={
            "Military Press":            ["Cable Row", "Lat Pulldown", "Face Pulls"],
            "Barbell Overhead Press":    ["Cable Row", "Lat Pulldown", "Face Pulls"],
            "Dumbbell Shoulder Press":   ["Lateral Raises", "Rear Delt Flyes", "Face Pulls"],
            "Arnold Press":              ["Lateral Raises", "Rear Delt Flyes"],
            "Upright Rows":              ["Face Pulls", "Rear Delt Flyes"],
            "Front Raises":              ["Rear Delt Flyes", "Face Pulls"],
            "Tricep Dips":               ["Cable Pushdown", "Dumbbell Kickback", "Skull Crushers"],
            "Overhead Tricep Extension": ["Cable Pushdown", "Dumbbell Kickback"],
        }
    ),
    "knee": InjuryConstraint(
        banned_patterns={"squat", "lunge", "knee_extension"},
        banned_exercise_names={
            "Barbell Back Squat", "Front Squat", "Goblet Squat", "Box Squat",
            "Leg Press", "Dumbbell Lunge", "Barbell Lunge", "Reverse Lunge",
            "Bulgarian Split Squat", "Step-Ups", "Leg Extension",
            "Box Jumps", "Jump Squat",
        },
        mandatory_prehab=[
            Exercise("Glute Bridge",            ("glutes",),("hamstrings",),"hip_hinge",(),(),"compound","legs"),
            Exercise("Hip Thrust",              ("glutes",),("hamstrings",),"hip_hinge",("barbell","dumbbells","machines"),(),"compound","legs"),
            Exercise("Terminal Knee Extension", ("quads",),(),"knee_extension",("cables",),(),"rehab","legs"),
        ],
        replacements={
            "Barbell Back Squat":   ["Glute Bridge", "Hip Thrust", "Seated Leg Curl"],
            "Front Squat":          ["Glute Bridge", "Hip Thrust"],
            "Goblet Squat":         ["Glute Bridge", "Hip Thrust"],
            "Leg Press":            ["Hip Thrust", "Seated Leg Curl", "Glute Bridge"],
            "Dumbbell Lunge":       ["Hip Thrust", "Glute Bridge", "Seated Leg Curl"],
            "Barbell Lunge":        ["Hip Thrust", "Glute Bridge"],
            "Reverse Lunge":        ["Hip Thrust", "Glute Bridge"],
            "Bulgarian Split Squat":["Hip Thrust", "Glute Bridge"],
            "Step-Ups":             ["Glute Bridge", "Seated Leg Curl"],
            "Leg Extension":        ["Terminal Knee Extension", "Seated Leg Curl"],
        }
    ),
    "lower back": InjuryConstraint(
        banned_patterns={"hip_hinge"},
        banned_exercise_names={
            "Barbell Deadlift", "Romanian Deadlift", "Dumbbell Deadlift",
            "Barbell Row", "Dumbbell Row", "One-Arm Dumbbell Row",
            "Good Mornings", "Hyperextensions", "Stiff-Leg Deadlift",
        },
        mandatory_prehab=[
            Exercise("Bird-Dog",    ("core","lower_back"),(),"core_flexion",(),(),"rehab","core"),
            Exercise("Dead Bug",    ("core",),("lower_back",),"core_flexion",(),(),"rehab","core"),
            Exercise("Pallof Press",("core","obliques"),(),"core_flexion",("cables",),(),"rehab","core"),
        ],
        replacements={
            "Barbell Deadlift":    ["Hip Thrust", "Glute Bridge", "Cable Pull-Through"],
            "Romanian Deadlift":   ["Hip Thrust", "Glute Bridge", "Cable Pull-Through"],
            "Dumbbell Deadlift":   ["Hip Thrust", "Glute Bridge"],
            "Barbell Row":         ["Seated Cable Row", "Cable Row", "Lat Pulldown"],
            "Dumbbell Row":        ["Seated Cable Row", "Cable Row"],
            "One-Arm Dumbbell Row":["Seated Cable Row", "Cable Row"],
        }
    ),
}

# ── Constraint priority ordering ───────────────────────────────────────────────
CONSTRAINT_PRIORITY = ["injury", "equipment", "goal", "preference"]


# ══════════════════════════════════════════════════════════════════════════════
#  SEMANTIC EXERCISE DETECTOR
# ══════════════════════════════════════════════════════════════════════════════

class SemanticExerciseDetector:
    """
    Extracts exercise names from raw LLM markdown output using a three-pass
    matching strategy:

    Pass 1 — Exact synonym lookup (O(1) hash map).
    Pass 2 — Fuzzy string matching via difflib.SequenceMatcher (handles typos
              and minor phrasing variants, e.g. "Incline DB Press").
    Pass 3 — Keyword overlap scoring (handles descriptive variants like
              "Assisted Tricep Dips" matching "Tricep Dips").
    """

    # All known exercise names + synonyms for fuzzy matching pool
    _POOL: List[str] = list({ex.name.lower() for ex in EXERCISE_GRAPH} |
                            set(EXERCISE_SYNONYMS.keys()))

    @classmethod
    def resolve(cls, raw_name: str) -> Optional[Exercise]:
        """
        Resolve a raw exercise name string to an Exercise object.
        Returns None if no match found above confidence threshold.
        """
        norm = raw_name.strip().lower()

        # Stemming common fitness keywords to handle plurals
        stem_map = {
            "squats": "squat",
            "lunges": "lunge",
            "presses": "press",
            "rows": "row",
            "raises": "raise",
            "curls": "curl",
            "dips": "dip",
            "extensions": "extension",
            "flexions": "flexion",
            "bridges": "bridge",
            "thrusts": "thrust",
            "flyes": "fly",
            "flys": "fly"
        }
        for pl, sg in stem_map.items():
            norm = re.sub(r'\b' + pl + r'\b', sg, norm)

        # Pass 1: Exact synonym lookup
        if norm in EXERCISE_SYNONYMS:
            canonical = EXERCISE_SYNONYMS[norm].lower()
            return _GRAPH_BY_NAME.get(canonical)
        if norm in _GRAPH_BY_NAME:
            return _GRAPH_BY_NAME[norm]

        # Pass 2: Fuzzy matching via SequenceMatcher
        best_score, best_key = 0.0, None
        for pool_name in cls._POOL:
            score = SequenceMatcher(None, norm, pool_name).ratio()
            if score > best_score:
                best_score, best_key = score, pool_name

        if best_score >= 0.72 and best_key:
            # Resolve through synonym map if needed
            canonical_key = EXERCISE_SYNONYMS.get(best_key, best_key)
            return _GRAPH_BY_NAME.get(canonical_key.lower())

        # Pass 3: Keyword overlap scoring
        norm_words = set(re.split(r'\W+', norm)) - {"the", "a", "an", "with", "and", "of"}
        best_overlap, best_ex = 0, None
        for ex in EXERCISE_GRAPH:
            ex_words = set(re.split(r'\W+', ex.name.lower()))
            overlap = len(norm_words & ex_words) / max(len(ex_words), 1)
            if overlap > best_overlap and overlap >= 0.6:
                best_overlap, best_ex = overlap, ex
        return best_ex

    @classmethod
    def extract_from_markdown(cls, markdown: str) -> List[Tuple[int, str, Optional[Exercise]]]:
        """
        Scan markdown table rows and extract (line_number, raw_name, Exercise) tuples.
        Targets lines that look like table rows: | Exercise name | ... |
        """
        results = []
        lines = markdown.splitlines()
        in_table = False
        header_seen = False

        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped.startswith("|"):
                in_table = False
                header_seen = False
                continue

            cells = [c.strip() for c in stripped.split("|") if c.strip()]
            if not cells:
                continue

            # Detect header row
            first = cells[0].lower()
            if any(h in first for h in ("exercise", "movement", "activity")):
                in_table = True
                header_seen = True
                continue

            # Detect separator row
            if all(re.match(r'^[-:]+$', c) for c in cells):
                continue

            # Exercise data row
            if in_table and header_seen and cells:
                raw_name = cells[0]
                # Skip if looks like a header or separator
                if raw_name.startswith("-") or raw_name.lower() in ("exercise", "movement"):
                    continue
                resolved = cls.resolve(raw_name)
                results.append((i, raw_name, resolved))

        return results


# ══════════════════════════════════════════════════════════════════════════════
#  SAFETY REPORT
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class Violation:
    line_number: int
    raw_name: str
    resolved_name: Optional[str]
    constraint_type: str           # "injury:shoulder" | "equipment" | etc.
    reason: str
    replacements: List[str]        # suggested safe alternatives


@dataclass
class SafetyReport:
    """Full output of the PulseGym Safety Engine v2."""
    original_plan: str
    fixed_plan: str
    violations: List[Violation] = field(default_factory=list)
    prehab_injected: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    score: int = 0
    score_breakdown: Dict[str, int] = field(default_factory=dict)
    is_safe: bool = True

    def summary(self) -> str:
        lines = [
            f"Safety Score: {self.score}/100",
            f"Violations removed: {len(self.violations)}",
            f"Prehab injected: {self.prehab_injected}",
            f"Warnings: {len(self.warnings)}",
        ]
        if self.violations:
            lines.append("\nViolations:")
            for v in self.violations:
                lines.append(f"  [{v.constraint_type}] {v.raw_name} → {v.replacements[0] if v.replacements else 'removed'}")
        return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════════
#  MUSCLE BALANCE VALIDATOR
# ══════════════════════════════════════════════════════════════════════════════

class MuscleBalanceValidator:
    """
    Validates push:pull ratio and weekly volume per muscle group.
    NSCA and ACSM recommend a 1:1 push:pull ratio to prevent injury.
    """

    OPTIMAL_PUSH_PULL_RATIO = (0.8, 1.3)  # 0.8–1.3 : 1 push:pull

    @staticmethod
    def analyse(exercises: List[Exercise]) -> Dict[str, object]:
        push_count = sum(1 for e in exercises if e.push_pull == "push")
        pull_count = sum(1 for e in exercises if e.push_pull == "pull")
        ratio = round(push_count / max(pull_count, 1), 2)

        muscle_volume: Dict[str, int] = {}
        for ex in exercises:
            for m in ex.muscles_primary:
                muscle_volume[m] = muscle_volume.get(m, 0) + 1

        warnings = []
        lo, hi = MuscleBalanceValidator.OPTIMAL_PUSH_PULL_RATIO
        if ratio > hi:
            warnings.append(
                f"Push:Pull ratio is {ratio}:1 — too much push volume. "
                f"Add more pulling exercises (rows, pulldowns) to reach 1:1."
            )
        elif ratio < lo:
            warnings.append(
                f"Push:Pull ratio is {ratio}:1 — too much pull volume relative to push."
            )

        return {
            "push_count": push_count,
            "pull_count": pull_count,
            "ratio": ratio,
            "muscle_volume": muscle_volume,
            "warnings": warnings,
        }


# ══════════════════════════════════════════════════════════════════════════════
#  PLAN SCORER
# ══════════════════════════════════════════════════════════════════════════════

class PlanScorer:
    """
    Scores the fixed workout plan on 5 dimensions (0–20 each = 0–100 total).

    Dimensions
    ----------
    1. Safety (20)       — 0 violations = 20, each violation -4
    2. Completeness (20) — Has all 5 required sections
    3. Structure (20)    — All days have tables with ≥3 exercises
    4. Specificity (20)  — Has tempo, rest, sets/reps information
    5. Balance (20)      — Push:pull ratio within optimal range
    """

    REQUIRED_SECTIONS = ["## Overview", "## Weekly Schedule",
                         "## Day-by-Day Plan", "## Progressive Overload",
                         "## Recovery"]

    @classmethod
    def score(cls, plan: str, violations: List[Violation],
              exercises: List[Exercise]) -> Tuple[int, Dict[str, int]]:
        breakdown: Dict[str, int] = {}

        # 1. Safety
        safety = max(0, 20 - len(violations) * 4)
        breakdown["safety"] = safety

        # 2. Completeness
        found_sections = sum(
            1 for s in cls.REQUIRED_SECTIONS
            if s.lower() in plan.lower()
        )
        completeness = int((found_sections / len(cls.REQUIRED_SECTIONS)) * 20)
        breakdown["completeness"] = completeness

        # 3. Structure — count table rows
        table_rows = len(re.findall(r'^\|[^|]+\|', plan, re.MULTILINE))
        structure = min(20, int(table_rows / 3) * 4)
        breakdown["structure"] = structure

        # 4. Specificity — tempo, rest, sets columns present
        has_tempo = "tempo" in plan.lower() or re.search(r'\d-\d-\d', plan) is not None
        has_rest  = "rest" in plan.lower()
        has_rpe   = "rpe" in plan.lower() or "%" in plan
        specificity = (7 if has_tempo else 0) + (7 if has_rest else 0) + (6 if has_rpe else 0)
        breakdown["specificity"] = specificity

        # 5. Balance
        if exercises:
            balance_data = MuscleBalanceValidator.analyse(exercises)
            ratio = balance_data["ratio"]
            lo, hi = MuscleBalanceValidator.OPTIMAL_PUSH_PULL_RATIO
            balance = 20 if lo <= ratio <= hi else max(0, 20 - int(abs(ratio - 1.0) * 10))
        else:
            balance = 10  # neutral if no exercises detected
        breakdown["balance"] = balance

        total = sum(breakdown.values())
        return total, breakdown


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN SAFETY ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class PulseGymSafetyEngine:
    """
    Orchestrates all components of the PulseGym Safety Engine v2.

    Usage
    -----
    ::

        engine = PulseGymSafetyEngine(injuries="shoulder injury, knee pain",
                                       equipment="dumbbells and cables")
        report = engine.process(llm_raw_output)
        print(report.fixed_plan)
        print(report.summary())
    """

    def __init__(self, injuries: str = "None", equipment: str = ""):
        self.injuries = injuries.lower()
        self.equipment = equipment.lower()
        self._injury_severities = self._parse_severities()
        self._active_constraints: List[InjuryConstraint] = self._resolve_constraints()

    def _parse_severities(self) -> Dict[str, str]:
        """Determine injury severity level per region (mild, moderate, severe)."""
        severities = {}
        # Split injuries string to isolate clauses for each region
        clauses = re.split(r'[,;]|\band\b', self.injuries)
        for clause in clauses:
            clause = clause.strip()
            target_key = None
            for key in ["lower back", "shoulder", "knee"]:
                if key in clause:
                    target_key = key
                    break
            if target_key:
                if any(w in clause for w in ["severe", "tear", "rupture", "post-op", "post op", "surgery", "herniated", "chronic"]):
                    severities[target_key] = "severe"
                elif any(w in clause for w in ["mild", "tweak", "ache", "sore", "light"]):
                    severities[target_key] = "mild"
                else:
                    severities[target_key] = "moderate"
        
        # Fallback check
        for key in ["lower back", "shoulder", "knee"]:
            if key in self.injuries and key not in severities:
                if any(w in self.injuries for w in ["severe", "tear", "rupture", "post-op", "post op", "surgery", "herniated", "chronic"]):
                    severities[key] = "severe"
                elif any(w in self.injuries for w in ["mild", "tweak", "ache", "sore", "light"]):
                    severities[key] = "mild"
                else:
                    severities[key] = "moderate"
        return severities

    def _resolve_constraints(self) -> List[InjuryConstraint]:
        """Return ordered list of active InjuryConstraints, sorted by severity (severe first)."""
        active_keys = []
        for key in ["lower back", "shoulder", "knee"]:
            if key in self.injuries:
                active_keys.append(key)
        
        # Priority order: severe first, then moderate, then mild
        severity_order = {"severe": 0, "moderate": 1, "mild": 2}
        sorted_keys = sorted(active_keys, key=lambda k: severity_order.get(self._injury_severities.get(k, "moderate"), 1))
        
        return [INJURY_CONSTRAINTS[k] for k in sorted_keys if k in INJURY_CONSTRAINTS]

    def _get_fallback_replacements(self, region: str, raw_name: str) -> List[str]:
        """Bespoke safe alternatives when exercise name doesn't match knowledge graph."""
        if region == "shoulder":
            return ["Cable Row", "Lat Pulldown", "Face Pulls", "Lateral Raises", "Rear Delt Flyes"]
        elif region == "knee":
            return ["Glute Bridge", "Hip Thrust", "Seated Leg Curl", "Terminal Knee Extension", "Calf Raises"]
        elif region == "lower back":
            return ["Seated Cable Row", "Lat Pulldown", "Cable Pull-Through", "Bird-Dog", "Dead Bug", "Pallof Press"]
        return []

    def _is_banned(self, ex: Optional[Exercise], raw_name: str) -> Tuple[bool, str, List[str]]:
        """
        Check if an exercise violates any active constraint.
        Returns (is_banned, reason, [replacement_names]).
        Priority: injury > equipment > goal
        """
        raw_norm = raw_name.lower()

        # 1. Check active injuries
        for key in ["lower back", "shoulder", "knee"]:
            if key not in self.injuries:
                continue

            severity = self._injury_severities.get(key, "moderate")
            constraint = INJURY_CONSTRAINTS.get(key)

            # A. Graph-based Check (Exercise resolved)
            if ex is not None:
                if severity == "mild":
                    # Mild only bans absolute high-risk compound movements
                    if key == "shoulder" and ex.name in {"Military Press", "Barbell Overhead Press", "Upright Rows"}:
                        return True, f"injury:{key}", self._get_replacements(ex, constraint, raw_name)
                    elif key == "knee" and ex.name in {"Barbell Back Squat", "Front Squat", "Box Jumps", "Jump Squat"}:
                        return True, f"injury:{key}", self._get_replacements(ex, constraint, raw_name)
                    elif key == "lower back" and ex.name in {"Barbell Deadlift", "Good Mornings"}:
                        return True, f"injury:{key}", self._get_replacements(ex, constraint, raw_name)
                else:
                    # Moderate / Severe: apply standard bans
                    is_banned_ex = (ex.name in constraint.banned_exercise_names or
                                    ex.movement_pattern in constraint.banned_patterns)

                    # Severe adds secondary contraindications for safety
                    if severity == "severe":
                        if key == "shoulder" and ex.movement_pattern == "horizontal_push":
                            # Severe shoulder injury bans bench presses & dips as well
                            is_banned_ex = True
                        elif key == "knee" and ex.name in {"Leg Press", "Step-Ups", "Reverse Lunge", "Bulgarian Split Squat"}:
                            is_banned_ex = True
                        elif key == "lower back" and ex.movement_pattern in {"horizontal_pull", "vertical_pull"}:
                            if "row" in ex.name.lower() or "deadlift" in ex.name.lower():
                                is_banned_ex = True

                    if is_banned_ex:
                        return True, f"injury:{key}", self._get_replacements(ex, constraint, raw_name)

            # B. Keyword-based Fallback Check (Unlisted or weird exercise variations)
            if key == "shoulder":
                if any(kw in raw_norm for kw in ["overhead", "military", "shoulder press", "arnold press", "upright row", "front raise", "tricep dip", "push press"]):
                    if severity == "mild" and "barbell" not in raw_norm and "military" not in raw_norm:
                        pass
                    else:
                        return True, f"injury:shoulder", self._get_replacements(ex, constraint, raw_name)
                if severity == "severe" and any(kw in raw_norm for kw in ["bench press", "chest press", "dip", "pushup", "push-up"]):
                    return True, f"injury:shoulder", self._get_replacements(ex, constraint, raw_name)

            elif key == "knee":
                if any(kw in raw_norm for kw in ["squat", "lunge", "leg press", "step-up", "step up", "box jump", "jump squat", "leg extension"]):
                    if severity == "mild" and any(kw in raw_norm for kw in ["leg press", "reverse lunge"]):
                        pass
                    else:
                        return True, f"injury:knee", self._get_replacements(ex, constraint, raw_name)

            elif key == "lower back":
                if any(kw in raw_norm for kw in ["deadlift", "bent-over row", "bent over row", "good morning", "hyperextension", "spinal loading"]):
                    return True, f"injury:lower back", self._get_replacements(ex, constraint, raw_name)

        # 2. Equipment check
        if ex is not None and self.equipment and ex.equipment_required:
            available = set(re.split(r'[,\s]+', self.equipment))
            needed = set(ex.equipment_required)
            if needed and not (needed & available) and "machines" not in available:
                if not any(k in self.equipment for k in needed):
                    return True, "equipment", []

        return False, "", []

    def _get_replacements(self, ex: Optional[Exercise], constraint: Optional[InjuryConstraint], raw_name: str) -> List[str]:
        """Return equipment-filtered and injury-filtered list of replacement exercise names."""
        raw_reps = []
        if ex and constraint:
            raw_reps = constraint.replacements.get(ex.name, [])
        else:
            # Fallback to region-specific defaults
            for region in ["lower back", "shoulder", "knee"]:
                if region in self.injuries:
                    raw_reps = self._get_fallback_replacements(region, raw_name)
                    break
        
        # Filter by available equipment and ensure they don't violate other active injury constraints
        filtered = []
        for rep_name in raw_reps:
            rep_ex = _GRAPH_BY_NAME.get(rep_name.lower())
            if rep_ex is not None:
                # Multi-constraint checks (Injury Priority)
                is_rep_banned = False
                for other_key in ["lower back", "shoulder", "knee"]:
                    if other_key not in self.injuries:
                        continue
                    other_severity = self._injury_severities.get(other_key, "moderate")
                    other_constraint = INJURY_CONSTRAINTS.get(other_key)
                    if other_constraint:
                        if other_severity == "mild":
                            if other_key == "shoulder" and rep_ex.name in {"Military Press", "Barbell Overhead Press", "Upright Rows"}:
                                is_rep_banned = True
                            elif other_key == "knee" and rep_ex.name in {"Barbell Back Squat", "Front Squat", "Box Jumps", "Jump Squat"}:
                                is_rep_banned = True
                            elif other_key == "lower back" and rep_ex.name in {"Barbell Deadlift", "Good Mornings"}:
                                is_rep_banned = True
                        else:
                            if rep_ex.name in other_constraint.banned_exercise_names or rep_ex.movement_pattern in other_constraint.banned_patterns:
                                is_rep_banned = True
                            if other_severity == "severe":
                                if other_key == "shoulder" and rep_ex.movement_pattern == "horizontal_push":
                                    is_rep_banned = True
                                elif other_key == "knee" and rep_ex.name in {"Leg Press", "Step-Ups", "Reverse Lunge", "Bulgarian Split Squat"}:
                                    is_rep_banned = True
                                elif other_key == "lower back" and rep_ex.movement_pattern in {"horizontal_pull", "vertical_pull"}:
                                    if "row" in rep_ex.name.lower() or "deadlift" in rep_ex.name.lower():
                                        is_rep_banned = True

                if is_rep_banned:
                    continue

                # Equipment Check Priority
                if self.equipment and rep_ex.equipment_required:
                    available = set(re.split(r'[,\s]+', self.equipment))
                    needed = set(rep_ex.equipment_required)
                    if needed and not (needed & available) and "machines" not in available:
                        if not any(k in self.equipment for k in needed):
                            continue
            filtered.append(rep_name)
        return filtered or raw_reps

    def _replace_line(self, line: str, raw_name: str, replacements: List[str]) -> str:
        """Replace the exercise name in a table row with the first valid replacement."""
        if not replacements:
            return ""  # remove line entirely if no replacement
        new_name = replacements[0]
        return line.replace(raw_name, new_name, 1)

    def _check_already_present(self, plan: str, exercise_name: str) -> bool:
        """Check if a mandatory prehab exercise is already in the plan (dedup)."""
        return exercise_name.lower() in plan.lower()

    def process(self, raw_plan: str) -> SafetyReport:
        """
        Main entry point. Validates and fixes a raw LLM-generated workout plan.
        Returns a SafetyReport with the corrected plan and full audit trail.
        """
        if not self._active_constraints:
            # No injuries — just score and return
            detected = SemanticExerciseDetector.extract_from_markdown(raw_plan)
            exercises = [ex for _, _, ex in detected if ex]
            score, breakdown = PlanScorer.score(raw_plan, [], exercises)
            balance = MuscleBalanceValidator.analyse(exercises)
            return SafetyReport(
                original_plan=raw_plan,
                fixed_plan=raw_plan,
                score=score,
                score_breakdown=breakdown,
                warnings=balance["warnings"],
                is_safe=True,
            )

        violations: List[Violation] = []
        lines = raw_plan.splitlines()
        fixed_lines = []
        replaced_exercises: Set[str] = set()  # track what was already replaced

        # Detect exercises in the plan
        detected = SemanticExerciseDetector.extract_from_markdown(raw_plan)
        flagged_lines: Dict[int, Tuple[str, Optional[Exercise], List[str]]] = {}

        for line_num, raw_name, ex in detected:
            is_banned, reason, reps = self._is_banned(ex, raw_name)
            if is_banned:
                # Filter replacements by equipment and injuries
                constraint_key = reason.split(":")[1] if ":" in reason else ""
                constraint = INJURY_CONSTRAINTS.get(constraint_key)
                filtered_reps = self._get_replacements(ex, constraint, raw_name) if constraint and ex else reps

                # Avoid suggesting already-used replacements
                unique_reps = [r for r in filtered_reps if r not in replaced_exercises]

                violations.append(Violation(
                    line_number=line_num,
                    raw_name=raw_name,
                    resolved_name=ex.name if ex else None,
                    constraint_type=reason,
                    reason=f"Banned by {reason} constraint",
                    replacements=unique_reps,
                ))
                flagged_lines[line_num] = (raw_name, ex, unique_reps)
                if unique_reps:
                    replaced_exercises.add(unique_reps[0])

        # Rebuild plan with replacements
        for i, line in enumerate(lines):
            if i in flagged_lines:
                raw_name, ex, reps = flagged_lines[i]
                new_line = self._replace_line(line, raw_name, reps)
                if new_line:
                    fixed_lines.append(new_line)
                # else: line removed (no replacement available)
            else:
                fixed_lines.append(line)

        fixed_plan = "\n".join(fixed_lines)

        # Inject mandatory prehab (dedup-aware)
        prehab_injected = []
        prehab_sections = []
        for key, constraint in zip(["lower back", "shoulder", "knee"],
                                    [INJURY_CONSTRAINTS.get("lower back"),
                                     INJURY_CONSTRAINTS.get("shoulder"),
                                     INJURY_CONSTRAINTS.get("knee")]):
            if key not in self.injuries or constraint is None:
                continue
            # Resolve fixed plan exercises to prevent semantic duplicate injections
            fixed_detected = SemanticExerciseDetector.extract_from_markdown(fixed_plan)
            fixed_canonical_names = {ex.name.lower() for _, _, ex in fixed_detected if ex}

            missing = []
            for ex in constraint.mandatory_prehab:
                if ex.name.lower() in fixed_canonical_names:
                    continue
                # Fallback substring text search
                if any(ex.name.lower() in line.lower() or ex.name.lower()[:-1] in line.lower() for line in fixed_plan.splitlines()):
                    continue
                missing.append(ex)
            if missing:
                label = f"🩺 Mandatory Prehab — {key.title()} Injury"
                block = [f"\n---\n### {label}",
                         "| Exercise | Sets | Reps/Duration | Tempo | Rest |",
                         "|---|---|---|---|---|"]
                for ex in missing:
                    block.append(f"| {ex.name} | 3 | 15 | 2-0-1-0 | 60s |")
                    prehab_injected.append(ex.name)
                prehab_sections.append("\n".join(block))

        if prehab_sections:
            fixed_plan += "\n" + "\n".join(prehab_sections)

        # Score the fixed plan
        all_detected = SemanticExerciseDetector.extract_from_markdown(fixed_plan)
        all_exercises = [ex for _, _, ex in all_detected if ex]
        score, breakdown = PlanScorer.score(fixed_plan, violations, all_exercises)
        balance_data = MuscleBalanceValidator.analyse(all_exercises)
        warnings = balance_data.get("warnings", [])

        return SafetyReport(
            original_plan=raw_plan,
            fixed_plan=fixed_plan,
            violations=violations,
            prehab_injected=prehab_injected,
            warnings=warnings,
            score=score,
            score_breakdown=breakdown,
            is_safe=len(violations) == 0,
        )

    def _serialize_json_to_text(self, plan_json: Dict[str, Any]) -> str:
        """Helper to serialize a structured JSON workout plan to Markdown for scoring."""
        lines = []
        lines.append(f"## Overview\n{plan_json.get('plan_name', '')} - Goal: {plan_json.get('goal', '')} (Level: {plan_json.get('fitness_level', '')})")
        lines.append("\n## Weekly Schedule")
        for day in plan_json.get("days", []):
            focus = ", ".join(day.get("focus_areas", []))
            lines.append(f"- {day.get('day_name', '')}: Focus: {focus}")
        lines.append("\n## Day-by-Day Plan")
        for day in plan_json.get("days", []):
            lines.append(f"### {day.get('day_name', '')}")
            lines.append("| Exercise | Sets | Reps/Duration | Tempo | Rest |")
            lines.append("|---|---|---|---|---|")
            for ex in day.get("exercises", []):
                name = ex.get("name", "")
                sets = ex.get("sets", "3")
                reps = ex.get("reps", ex.get("reps/duration", "10"))
                tempo = ex.get("tempo", "2-0-1-0")
                rest = ex.get("rest", "60s")
                lines.append(f"| {name} | {sets} | {reps} | {tempo} | {rest} |")
        lines.append(f"\n## Progressive Overload Strategy\n{plan_json.get('notes', '')}")
        lines.append("\n## Recovery Guidelines\nEnsure proper sleep and nutrition.")
        return "\n".join(lines)

    def process_json(self, plan_json: Dict[str, Any]) -> Tuple[Dict[str, Any], SafetyReport]:
        """
        Validates and fixes a structured JSON-like workout plan (python dict).
        Returns (fixed_plan_json, SafetyReport).
        """
        import copy
        fixed_plan = copy.deepcopy(plan_json)

        # Prepare original plan markdown representation for original_plan field in report
        orig_plan_md = self._serialize_json_to_text(plan_json)

        if not self._active_constraints:
            # No injuries — just score and return
            detected_exercises = []
            for day in fixed_plan.get("days", []):
                for ex in day.get("exercises", []):
                    resolved = SemanticExerciseDetector.resolve(ex.get("name", ""))
                    if resolved:
                        detected_exercises.append(resolved)
            score, breakdown = PlanScorer.score(orig_plan_md, [], detected_exercises)
            balance = MuscleBalanceValidator.analyse(detected_exercises)
            report = SafetyReport(
                original_plan=orig_plan_md,
                fixed_plan=orig_plan_md,
                score=score,
                score_breakdown=breakdown,
                warnings=balance.get("warnings", []),
                is_safe=True,
            )
            return fixed_plan, report

        violations: List[Violation] = []
        replaced_exercises: Set[str] = set()

        for day_idx, day in enumerate(fixed_plan.get("days", [])):
            safe_exercises = []
            for ex_idx, ex in enumerate(day.get("exercises", [])):
                raw_name = ex.get("name", "")
                resolved_ex = SemanticExerciseDetector.resolve(raw_name)

                is_banned, reason, reps = self._is_banned(resolved_ex, raw_name)
                if is_banned:
                    constraint_key = reason.split(":")[1] if ":" in reason else ""
                    constraint = INJURY_CONSTRAINTS.get(constraint_key)
                    filtered_reps = self._get_replacements(resolved_ex, constraint, raw_name) if constraint and resolved_ex else reps
                    unique_reps = [r for r in filtered_reps if r not in replaced_exercises]

                    # Pick first replacement
                    if unique_reps:
                        rep_name = unique_reps[0]
                        replaced_exercises.add(rep_name)
                        
                        fixed_ex = copy.deepcopy(ex)
                        fixed_ex["name"] = rep_name
                        fixed_ex["notes"] = f"Replaced '{raw_name}' (unsafe for {reason} injury)"
                        
                        # Update metadata based on resolved replacement if available in knowledge graph
                        rep_resolved = SemanticExerciseDetector.resolve(rep_name)
                        if rep_resolved:
                            fixed_ex["movement_pattern"] = rep_resolved.movement_pattern
                            fixed_ex["exercise_type"] = rep_resolved.movement_type
                            fixed_ex["target_muscles"] = list(rep_resolved.muscles_primary)
                            if not fixed_ex.get("tempo") or fixed_ex.get("tempo") == "-":
                                fixed_ex["tempo"] = "2-0-1-0"
                                
                        safe_exercises.append(fixed_ex)
                        violations.append(Violation(
                            line_number=day_idx + 1,  # Approximate line by day index
                            raw_name=raw_name,
                            resolved_name=resolved_ex.name if resolved_ex else None,
                            constraint_type=reason,
                            reason=f"Banned by {reason} constraint",
                            replacements=unique_reps,
                        ))
                    else:
                        # No replacement available, remove the exercise
                        violations.append(Violation(
                            line_number=day_idx + 1,
                            raw_name=raw_name,
                            resolved_name=resolved_ex.name if resolved_ex else None,
                            constraint_type=reason,
                            reason=f"Banned by {reason} constraint (Removed — no safe replacement)",
                            replacements=[],
                        ))
                else:
                    safe_exercises.append(ex)
            day["exercises"] = safe_exercises

        # Inject mandatory prehab (distribute across days as warmups)
        prehab_injected = []
        
        # 1. Determine existing canonical names for deduplication
        existing_names = set()
        for day in fixed_plan.get("days", []):
            for ex in day.get("exercises", []):
                resolved = SemanticExerciseDetector.resolve(ex.get("name", ""))
                if resolved:
                    existing_names.add(resolved.name.lower())
                else:
                    existing_names.add(ex.get("name", "").lower())

        # 2. Find missing prehabs
        missing_prehabs = []
        for key, constraint in zip(["lower back", "shoulder", "knee"],
                                    [INJURY_CONSTRAINTS.get("lower back"),
                                     INJURY_CONSTRAINTS.get("shoulder"),
                                     INJURY_CONSTRAINTS.get("knee")]):
            if key not in self.injuries or constraint is None:
                continue
            for ex in constraint.mandatory_prehab:
                if ex.name.lower() not in existing_names:
                    missing_prehabs.append((key, ex))

        # 3. Prepend missing prehabs as warmups to training days
        days = fixed_plan.get("days", [])
        if days and missing_prehabs:
            for idx, (injury_key, prehab_ex) in enumerate(missing_prehabs):
                target_day = days[idx % len(days)]
                prehab_item = {
                    "name": prehab_ex.name,
                    "sets": "3",
                    "reps": "15",
                    "rest": "60s",
                    "tempo": "2-0-1-0",
                    "notes": f"🩺 Warm-up / Prehab for {injury_key} injury",
                    "target_muscles": list(prehab_ex.muscles_primary),
                    "exercise_type": prehab_ex.movement_type,
                    "movement_pattern": prehab_ex.movement_pattern
                }
                # Insert at the beginning of the exercises list
                target_day.setdefault("exercises", []).insert(0, prehab_item)
                prehab_injected.append(prehab_ex.name)

        # Re-serialize fixed plan to Markdown for scoring
        fixed_plan_md = self._serialize_json_to_text(fixed_plan)

        # Extract all resolved exercises in fixed plan for scoring
        all_resolved_exercises = []
        for day in fixed_plan.get("days", []):
            for ex in day.get("exercises", []):
                resolved = SemanticExerciseDetector.resolve(ex.get("name", ""))
                if resolved:
                    all_resolved_exercises.append(resolved)

        score, breakdown = PlanScorer.score(fixed_plan_md, violations, all_resolved_exercises)
        balance_data = MuscleBalanceValidator.analyse(all_resolved_exercises)
        warnings = balance_data.get("warnings", [])

        # Update notes in the json plan to record changes
        if violations:
            existing_notes = fixed_plan.get("notes", "")
            fixed_plan["notes"] = (
                f"{existing_notes} | [Safety Engine v2] Removed {len(violations)} violations. "
                f"Injected prehab: {', '.join(prehab_injected) if prehab_injected else 'None'}."
            ).strip(" | ")

        report = SafetyReport(
            original_plan=orig_plan_md,
            fixed_plan=fixed_plan_md,
            violations=violations,
            prehab_injected=prehab_injected,
            warnings=warnings,
            score=score,
            score_breakdown=breakdown,
            is_safe=len(violations) == 0,
        )

        return fixed_plan, report



# ══════════════════════════════════════════════════════════════════════════════
#  QUICK SELF-TEST (run as script)
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    SAMPLE_PLAN = """
## Overview
Hypertrophy plan for intermediate lifters with shoulder and knee injuries.

## Weekly Schedule
| Day | Focus |
|---|---|
| Monday | Chest & Triceps |
| Wednesday | Back & Biceps |
| Friday | Legs |

## Day-by-Day Plan
### Monday — Chest & Triceps
| Exercise | Sets | Reps/Duration | Tempo | Rest |
|---|---|---|---|---|
| Incline Dumbbell Bench Press | 3 | 8-12 | 3-0-1-0 | 60s |
| Military Press | 3 | 10 | 2-0-2-0 | 60s |
| Cable Flyes | 3 | 12 | 2-0-2-0 | 45s |
| Tricep Dips | 3 | 12 | - | 45s |

### Wednesday — Back & Biceps
| Exercise | Sets | Reps/Duration | Tempo | Rest |
|---|---|---|---|---|
| Seated Cable Row | 3 | 10 | 2-0-2-0 | 60s |
| Lat Pulldown | 3 | 12 | 2-0-2-0 | 60s |
| Hammer Curl | 3 | 12 | - | 45s |

### Friday — Legs
| Exercise | Sets | Reps/Duration | Tempo | Rest |
|---|---|---|---|---|
| Leg Press | 3 | 12 | 2-0-2-0 | 60s |
| Glute Bridge | 3 | 15 | 2-0-2-0 | 45s |
| Seated Leg Curl | 3 | 12 | - | 45s |

## Progressive Overload Strategy
Week 1-2: 3×10 @ RPE 7. Week 3-4: add 2.5 kg.

## Recovery Guidelines
7-8 hours sleep. 1.6 g/kg protein.
"""

    engine = PulseGymSafetyEngine(
        injuries="shoulder injury, knee pain",
        equipment="dumbbells and cables"
    )
    report = engine.process(SAMPLE_PLAN)

    print("=" * 60)
    print("SAFETY REPORT")
    print("=" * 60)
    print(report.summary())
    print("\n" + "=" * 60)
    print("FIXED PLAN")
    print("=" * 60)
    print(report.fixed_plan)
