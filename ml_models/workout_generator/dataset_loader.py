"""
Dataset Loader for Workout Generator
Loads exercises from CSV datasets for the PulseGym AI
"""

import csv
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

# Path to datasets
DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                           "Documentation", "ML", "Dataset")
WORKOUT_CSV = os.path.join(
    DATASET_DIR, "Workout Dataset", "Dataset_Workout_plans.csv")
GYM_CSV = os.path.join(DATASET_DIR, "GYM.csv")
GYM_RECOMMENDATION_CSV = os.path.join(DATASET_DIR, "gym recommendation.csv")


@dataclass
class Exercise:
    """Exercise data class"""
    exercise_id: str
    name: str
    target_muscles: List[str]
    body_parts: List[str]
    equipment: List[str]
    secondary_muscles: List[str]
    instructions: List[str]
    difficulty: str = "intermediate"
    calories_per_rep: float = 0.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.exercise_id,
            "name": self.name,
            "muscle_group": self.body_parts[0] if self.body_parts else "full_body",
            "target_muscles": self.target_muscles,
            "body_parts": self.body_parts,
            "equipment": self.equipment,
            "secondary_muscles": self.secondary_muscles,
            "instructions": self.instructions,
            "difficulty": self.difficulty,
            "calories_per_rep": self.calories_per_rep
        }


@dataclass
class GymRule:
    """Goal-based workout rule"""
    gender: str
    goal: str
    bmi_category: str
    exercise_schedule: str
    meal_plan: str


@dataclass
class MedicalRecommendation:
    """Medical condition-aware recommendations"""
    sex: str
    age: int
    height: float
    weight: float
    hypertension: bool
    diabetes: bool
    bmi: float
    level: str
    fitness_goal: str
    fitness_type: str
    exercises: List[str]
    equipment: List[str]
    diet: str
    recommendation: str


class DatasetLoader:
    """Loads and manages workout datasets"""

    _instance = None
    _exercises: List[Exercise] = []
    _gym_rules: List[GymRule] = []
    _medical_recs: List[MedicalRecommendation] = []
    _loaded = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not DatasetLoader._loaded:
            self._load_all_datasets()
            DatasetLoader._loaded = True

    def _load_all_datasets(self):
        """Load all CSV datasets"""
        self._load_exercises()
        self._load_gym_rules()
        self._load_medical_recommendations()

    def _parse_list(self, value: str, delimiter: str = "|") -> List[str]:
        """Parse a delimited string into a list"""
        if not value or value.strip() == "":
            return []
        return [item.strip() for item in value.split(delimiter) if item.strip()]

    def _parse_instructions(self, value: str) -> List[str]:
        """Parse instruction steps from string"""
        if not value:
            return []
        # Instructions are formatted as "Step:1 ... Step:2 ..."
        steps = []
        parts = value.split("Step:")
        for part in parts:
            if part.strip():
                # Remove the step number prefix
                text = part.strip()
                if text and text[0].isdigit():
                    text = text[1:].strip()
                if text:
                    steps.append(text)
        return steps

    def _infer_difficulty(self, name: str, equipment: List[str], instructions: List[str]) -> str:
        """Infer exercise difficulty from name and equipment"""
        name_lower = name.lower()

        # Advanced exercises
        advanced_keywords = ["planche", "handstand", "muscle up", "archer", "pistol",
                             "one arm", "single leg", "explosive", "plyometric", "turkish"]
        if any(kw in name_lower for kw in advanced_keywords):
            return "advanced"

        # Beginner exercises
        beginner_keywords = ["assisted", "seated",
                             "lying", "machine", "lever", "band"]
        if any(kw in name_lower for kw in beginner_keywords):
            return "beginner"

        # Equipment-based inference
        beginner_equipment = ["leverage machine",
                              "assisted", "smith machine", "cable"]
        if any(eq in str(equipment).lower() for eq in beginner_equipment):
            return "beginner"

        return "intermediate"

    def _estimate_calories(self, target_muscles: List[str], equipment: List[str]) -> float:
        """Estimate calories burned per rep based on muscle groups and equipment"""
        # Base calories per rep
        base = 0.3

        # Large muscle groups burn more
        large_muscles = ["glutes", "quads", "hamstrings",
                         "lats", "pectorals", "cardiovascular"]
        if any(muscle in str(target_muscles).lower() for muscle in large_muscles):
            base += 0.3

        # Compound movements with free weights burn more
        compound_equipment = ["barbell", "kettlebell", "dumbbell"]
        if any(eq in str(equipment).lower() for eq in compound_equipment):
            base += 0.2

        # Bodyweight exercises
        if "body weight" in str(equipment).lower():
            base += 0.15

        return round(base, 2)

    def _load_exercises(self):
        """Load exercises from Dataset_Workout_plans.csv"""
        DatasetLoader._exercises = []

        if not os.path.exists(WORKOUT_CSV):
            print(f"Warning: Workout CSV not found at {WORKOUT_CSV}")
            return

        try:
            with open(WORKOUT_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        equipment = self._parse_list(
                            row.get('equipments', ''), ',')
                        if not equipment:
                            equipment = [row.get('equipments', 'body weight')]

                        target_muscles = self._parse_list(
                            row.get('targetMuscles', ''), ',')
                        if not target_muscles:
                            target_muscles = [row.get('targetMuscles', '')]

                        exercise = Exercise(
                            exercise_id=row.get('exerciseId', ''),
                            name=row.get('name', ''),
                            target_muscles=target_muscles,
                            body_parts=self._parse_list(
                                row.get('bodyParts', ''), ','),
                            equipment=equipment,
                            secondary_muscles=self._parse_list(
                                row.get('secondaryMuscles', ''), '|'),
                            instructions=self._parse_instructions(
                                row.get('instructions', '')),
                            difficulty=self._infer_difficulty(
                                row.get('name', ''),
                                equipment,
                                self._parse_instructions(
                                    row.get('instructions', ''))
                            ),
                            calories_per_rep=self._estimate_calories(
                                target_muscles, equipment)
                        )
                        DatasetLoader._exercises.append(exercise)
                    except Exception as e:
                        # Skip malformed rows
                        continue

            print(
                f"Loaded {len(DatasetLoader._exercises)} exercises from dataset")
        except Exception as e:
            print(f"Error loading workout dataset: {e}")

    def _load_gym_rules(self):
        """Load goal-based rules from GYM.csv"""
        DatasetLoader._gym_rules = []

        if not os.path.exists(GYM_CSV):
            print(f"Warning: GYM CSV not found at {GYM_CSV}")
            return

        try:
            with open(GYM_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rule = GymRule(
                        gender=row.get('Gender', '').lower(),
                        goal=row.get('Goal', ''),
                        bmi_category=row.get('BMI Category', ''),
                        exercise_schedule=row.get('Exercise Schedule', ''),
                        meal_plan=row.get('Meal Plan', '')
                    )
                    DatasetLoader._gym_rules.append(rule)
            print(f"Loaded {len(DatasetLoader._gym_rules)} gym rules")
        except Exception as e:
            print(f"Error loading gym rules: {e}")

    def _load_medical_recommendations(self):
        """Load medical condition recommendations from gym recommendation.csv"""
        DatasetLoader._medical_recs = []

        if not os.path.exists(GYM_RECOMMENDATION_CSV):
            print(f"Warning: Medical recommendations CSV not found")
            return

        try:
            with open(GYM_RECOMMENDATION_CSV, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rec = MedicalRecommendation(
                        sex=row.get('Sex', '').lower(),
                        age=int(row.get('Age', 0)),
                        height=float(row.get('Height', 0)),
                        weight=float(row.get('Weight', 0)),
                        hypertension=row.get(
                            'Hypertension', '').lower() == 'yes',
                        diabetes=row.get('Diabetes', '').lower() == 'yes',
                        bmi=float(row.get('BMI', 0)),
                        level=row.get('Level', ''),
                        fitness_goal=row.get('Fitness Goal', ''),
                        fitness_type=row.get('Fitness Type', ''),
                        exercises=self._parse_list(
                            row.get('Exercises', ''), ','),
                        equipment=self._parse_list(
                            row.get('Equipment', ''), ','),
                        diet=row.get('Diet', ''),
                        recommendation=row.get('Recommendation', '')
                    )
                    DatasetLoader._medical_recs.append(rec)
            print(
                f"Loaded {len(DatasetLoader._medical_recs)} medical recommendations")
        except Exception as e:
            print(f"Error loading medical recommendations: {e}")

    # ==================== PUBLIC API ====================

    def get_all_exercises(self) -> List[Dict[str, Any]]:
        """Get all exercises as dictionaries"""
        return [ex.to_dict() for ex in DatasetLoader._exercises]

    def get_exercises_count(self) -> int:
        """Get total number of exercises"""
        return len(DatasetLoader._exercises)

    def get_exercises_by_body_part(self, body_part: str) -> List[Dict[str, Any]]:
        """Get exercises targeting a specific body part"""
        body_part = body_part.lower()
        return [
            ex.to_dict() for ex in DatasetLoader._exercises
            if body_part in [bp.lower() for bp in ex.body_parts]
        ]

    def get_exercises_by_muscle(self, muscle: str) -> List[Dict[str, Any]]:
        """Get exercises targeting a specific muscle"""
        muscle = muscle.lower()
        return [
            ex.to_dict() for ex in DatasetLoader._exercises
            if muscle in [m.lower() for m in ex.target_muscles]
        ]

    def get_exercises_by_equipment(self, equipment: str) -> List[Dict[str, Any]]:
        """Get exercises using specific equipment"""
        equipment = equipment.lower()
        return [
            ex.to_dict() for ex in DatasetLoader._exercises
            if any(equipment in eq.lower() for eq in ex.equipment)
        ]

    def get_exercises_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """Get exercises by difficulty level"""
        return [
            ex.to_dict() for ex in DatasetLoader._exercises
            if ex.difficulty == difficulty.lower()
        ]

    def get_bodyweight_exercises(self) -> List[Dict[str, Any]]:
        """Get all bodyweight exercises (no equipment needed)"""
        return [
            ex.to_dict() for ex in DatasetLoader._exercises
            if "body weight" in [eq.lower() for eq in ex.equipment]
        ]

    def search_exercises(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search exercises by name or muscle"""
        query = query.lower()
        results = []
        for ex in DatasetLoader._exercises:
            if query in ex.name.lower():
                results.append(ex.to_dict())
            elif any(query in m.lower() for m in ex.target_muscles):
                results.append(ex.to_dict())
            elif any(query in bp.lower() for bp in ex.body_parts):
                results.append(ex.to_dict())
            if len(results) >= limit:
                break
        return results

    def get_unique_body_parts(self) -> List[str]:
        """Get list of all unique body parts"""
        parts = set()
        for ex in DatasetLoader._exercises:
            parts.update(ex.body_parts)
        return sorted(list(parts))

    def get_unique_equipment(self) -> List[str]:
        """Get list of all unique equipment"""
        equipment = set()
        for ex in DatasetLoader._exercises:
            equipment.update(ex.equipment)
        return sorted(list(equipment))

    def get_unique_muscles(self) -> List[str]:
        """Get list of all unique target muscles"""
        muscles = set()
        for ex in DatasetLoader._exercises:
            muscles.update(ex.target_muscles)
        return sorted(list(muscles))

    # ==================== RULE-BASED SELECTION ====================

    def get_workout_rule(self, gender: str, goal: str, bmi_category: str) -> Optional[GymRule]:
        """Get workout rule based on user profile"""
        gender = gender.lower()
        goal = goal.lower()
        bmi_category = bmi_category.lower()

        for rule in DatasetLoader._gym_rules:
            if (rule.gender.lower() == gender and
                rule.goal.lower() == goal and
                    rule.bmi_category.lower() == bmi_category):
                return rule
        return None

    def get_medical_recommendation(self, sex: str, hypertension: bool = False,
                                   diabetes: bool = False,
                                   fitness_goal: str = "Weight Gain") -> Optional[MedicalRecommendation]:
        """Get medical recommendation based on conditions"""
        sex = sex.lower()

        for rec in DatasetLoader._medical_recs:
            if (rec.sex == sex and
                rec.hypertension == hypertension and
                rec.diabetes == diabetes and
                    rec.fitness_goal.lower() == fitness_goal.lower()):
                return rec
        return None

    def get_bmi_category(self, bmi: float) -> str:
        """Classify BMI into category"""
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25:
            return "Normal weight"
        elif bmi < 30:
            return "Overweight"
        else:
            return "Obesity"


# Singleton accessor
_loader: Optional[DatasetLoader] = None


def get_dataset_loader() -> DatasetLoader:
    """Get or create the dataset loader singleton"""
    global _loader
    if _loader is None:
        _loader = DatasetLoader()
    return _loader


# Convenience functions
def get_all_exercises() -> List[Dict[str, Any]]:
    """Get all exercises"""
    return get_dataset_loader().get_all_exercises()


def get_exercises_by_body_part(body_part: str) -> List[Dict[str, Any]]:
    """Get exercises by body part"""
    return get_dataset_loader().get_exercises_by_body_part(body_part)


def get_exercises_by_muscle(muscle: str) -> List[Dict[str, Any]]:
    """Get exercises by muscle"""
    return get_dataset_loader().get_exercises_by_muscle(muscle)


def get_exercises_by_equipment(equipment: str) -> List[Dict[str, Any]]:
    """Get exercises by equipment"""
    return get_dataset_loader().get_exercises_by_equipment(equipment)


def search_exercises(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search exercises"""
    return get_dataset_loader().search_exercises(query, limit)


if __name__ == "__main__":
    # Test the loader
    loader = get_dataset_loader()

    print(f"\n=== Dataset Statistics ===")
    print(f"Total exercises: {loader.get_exercises_count()}")
    print(f"Unique body parts: {len(loader.get_unique_body_parts())}")
    print(f"Unique equipment: {len(loader.get_unique_equipment())}")
    print(f"Unique muscles: {len(loader.get_unique_muscles())}")

    print(f"\n=== Body Parts ===")
    for bp in loader.get_unique_body_parts():
        count = len(loader.get_exercises_by_body_part(bp))
        print(f"  {bp}: {count} exercises")

    print(f"\n=== Sample Exercises (Chest) ===")
    chest_exercises = loader.get_exercises_by_body_part("chest")[:3]
    for ex in chest_exercises:
        print(f"  - {ex['name']} ({ex['difficulty']})")
        print(f"    Equipment: {ex['equipment']}")
        print(f"    Target: {ex['target_muscles']}")
