"""
Macro Calculator for Nutrition Generator
=========================================

Calculates daily calorie and macro targets using scientific formulas:
- BMR: Mifflin-St Jeor equation (most accurate for modern populations)
- TDEE: BMR × Activity Multiplier
- Macros: Split based on goal (weight loss, muscle gain, etc.)

All calculations are deterministic - no AI hallucination possible.
"""

import logging
from typing import Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MacroTargets:
    """Calculated macro targets."""
    bmr: float
    tdee: float
    target_calories: float
    protein_g: float
    carbs_g: float
    fat_g: float

    def to_dict(self) -> Dict[str, float]:
        return {
            'bmr': round(self.bmr, 0),
            'tdee': round(self.tdee, 0),
            'target_calories': round(self.target_calories, 0),
            'protein_g': round(self.protein_g, 0),
            'carbs_g': round(self.carbs_g, 0),
            'fat_g': round(self.fat_g, 0)
        }


class MacroCalculator:
    """
    Calculator for daily calorie and macro targets.

    Uses scientifically validated formulas:
    - Mifflin-St Jeor for BMR (1990, most accurate)
    - Activity multipliers for TDEE
    - Evidence-based macro splits for goals
    """

    def __init__(self, config: Dict):
        """
        Initialize the calculator.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        ng_config = config.get('nutrition_generator', {})

        # Load activity multipliers from config
        self.activity_multipliers = ng_config.get('activity_multipliers', {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        })

        # Load macro splits from config
        self.macro_splits = ng_config.get('macro_splits', {
            'weight_loss': {'protein': 0.40, 'carbs': 0.30, 'fat': 0.30, 'calorie_adjustment': -500},
            'muscle_gain': {'protein': 0.30, 'carbs': 0.45, 'fat': 0.25, 'calorie_adjustment': 400},
            'maintenance': {'protein': 0.30, 'carbs': 0.40, 'fat': 0.30, 'calorie_adjustment': 0},
            'athletic_performance': {'protein': 0.25, 'carbs': 0.50, 'fat': 0.25, 'calorie_adjustment': 300}
        })

        # BMR formula to use
        self.bmr_formula = ng_config.get('bmr_formula', 'mifflin_st_jeor')

    def calculate_bmr(
        self,
        weight_kg: float,
        height_cm: float,
        age: int,
        gender: str
    ) -> float:
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.

        Formula:
            Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
            Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

        Args:
            weight_kg: Weight in kilograms
            height_cm: Height in centimeters
            age: Age in years
            gender: "male" or "female"

        Returns:
            BMR in calories per day
        """
        # Base calculation (same for both genders)
        base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)

        # Gender adjustment
        if gender.lower() in ['male', 'm']:
            bmr = base + 5
        else:
            bmr = base - 161

        logger.debug(
            f"BMR calculated: {bmr} kcal (weight={weight_kg}kg, height={height_cm}cm, age={age}, gender={gender})")

        return bmr

    def calculate_bmr_harris_benedict(
        self,
        weight_kg: float,
        height_cm: float,
        age: int,
        gender: str
    ) -> float:
        """
        Alternative: Harris-Benedict equation (1919, revised 1984).

        Slightly less accurate but commonly used for comparison.

        Formula:
            Male:   BMR = 88.362 + (13.397 × weight_kg) + (4.799 × height_cm) - (5.677 × age)
            Female: BMR = 447.593 + (9.247 × weight_kg) + (3.098 × height_cm) - (4.330 × age)
        """
        if gender.lower() in ['male', 'm']:
            bmr = 88.362 + (13.397 * weight_kg) + \
                (4.799 * height_cm) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight_kg) + \
                (3.098 * height_cm) - (4.330 * age)

        return bmr

    def calculate_tdee(self, bmr: float, activity_level: str) -> float:
        """
        Calculate Total Daily Energy Expenditure.

        TDEE = BMR × Activity Multiplier

        Activity Levels:
            - sedentary: Little to no exercise (desk job)
            - light: Light exercise 1-3 days/week
            - moderate: Moderate exercise 3-5 days/week
            - active: Hard exercise 6-7 days/week
            - very_active: Very hard exercise, physical job, 2x training

        Args:
            bmr: Basal Metabolic Rate
            activity_level: Activity level string

        Returns:
            TDEE in calories per day
        """
        # Normalize activity level
        activity = activity_level.lower().replace(' ', '_')

        # Get multiplier (default to sedentary if unknown)
        multiplier = self.activity_multipliers.get(activity, 1.2)

        tdee = bmr * multiplier

        logger.debug(
            f"TDEE calculated: {tdee} kcal (BMR={bmr}, activity={activity}, multiplier={multiplier})")

        return tdee

    def calculate_macros(
        self,
        target_calories: float,
        goal: str
    ) -> Dict[str, float]:
        """
        Calculate macro targets in grams.

        Macro Splits by Goal:
            - weight_loss: High protein (40%), Lower carbs (30%), Moderate fat (30%)
            - muscle_gain: Moderate protein (30%), High carbs (45%), Lower fat (25%)
            - maintenance: Balanced (30% protein, 40% carbs, 30% fat)
            - athletic_performance: Lower protein (25%), High carbs (50%), Lower fat (25%)

        Calorie Values:
            - Protein: 4 cal/gram
            - Carbs: 4 cal/gram
            - Fat: 9 cal/gram

        Args:
            target_calories: Daily calorie target
            goal: Fitness goal string

        Returns:
            Dictionary with protein_g, carbs_g, fat_g
        """
        # Get macro split for goal (default to maintenance)
        split = self.macro_splits.get(
            goal.lower(), self.macro_splits['maintenance'])

        # Calculate calories from each macro
        protein_cals = target_calories * split['protein']
        carbs_cals = target_calories * split['carbs']
        fat_cals = target_calories * split['fat']

        # Convert to grams
        protein_g = protein_cals / 4
        carbs_g = carbs_cals / 4
        fat_g = fat_cals / 9

        return {
            'protein_g': protein_g,
            'carbs_g': carbs_g,
            'fat_g': fat_g
        }

    def calculate_daily_targets(self, profile: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate complete daily targets from user profile.

        Args:
            profile: User profile dictionary with:
                - age: int
                - weight: float (kg)
                - height: float (cm)
                - gender: str
                - activity_level: str
                - goal: str

        Returns:
            Dictionary with all calculated targets
        """
        # Extract profile data
        age = profile.get('age', 30)
        weight = profile.get('weight', 70)
        height = profile.get('height', 170)
        gender = profile.get('gender', 'male')
        activity_level = profile.get('activity_level', 'moderate')
        goal = profile.get('goal', 'maintenance')

        # Step 1: Calculate BMR
        if self.bmr_formula == 'harris_benedict':
            bmr = self.calculate_bmr_harris_benedict(
                weight, height, age, gender)
        else:
            bmr = self.calculate_bmr(weight, height, age, gender)

        # Step 2: Calculate TDEE
        tdee = self.calculate_tdee(bmr, activity_level)

        # Step 3: Apply calorie adjustment for goal
        split = self.macro_splits.get(
            goal.lower(), self.macro_splits['maintenance'])
        calorie_adjustment = split.get('calorie_adjustment', 0)
        target_calories = tdee + calorie_adjustment

        # Ensure minimum safe calories
        min_calories = 1200 if gender.lower() in ['female', 'f'] else 1500
        target_calories = max(target_calories, min_calories)

        # Step 4: Calculate macros
        macros = self.calculate_macros(target_calories, goal)

        # Build result
        result = MacroTargets(
            bmr=bmr,
            tdee=tdee,
            target_calories=target_calories,
            protein_g=macros['protein_g'],
            carbs_g=macros['carbs_g'],
            fat_g=macros['fat_g']
        )

        logger.info(f"Calculated targets: {result.to_dict()}")

        return result.to_dict()

    def get_meal_distribution(
        self,
        target_calories: float,
        meals_per_day: int = 5
    ) -> Dict[str, float]:
        """
        Distribute daily calories across meals.

        Standard distribution (5 meals):
            - Breakfast: 25%
            - Morning Snack: 10%
            - Lunch: 30%
            - Afternoon Snack: 10%
            - Dinner: 25%

        Args:
            target_calories: Total daily calories
            meals_per_day: Number of meals (3, 4, 5, or 6)

        Returns:
            Dictionary with calories per meal
        """
        distributions = {
            3: {
                'breakfast': 0.30,
                'lunch': 0.40,
                'dinner': 0.30
            },
            4: {
                'breakfast': 0.25,
                'lunch': 0.35,
                'snack': 0.10,
                'dinner': 0.30
            },
            5: {
                'breakfast': 0.25,
                'morning_snack': 0.10,
                'lunch': 0.30,
                'afternoon_snack': 0.10,
                'dinner': 0.25
            },
            6: {
                'breakfast': 0.20,
                'morning_snack': 0.10,
                'lunch': 0.25,
                'afternoon_snack': 0.10,
                'dinner': 0.25,
                'evening_snack': 0.10
            }
        }

        dist = distributions.get(meals_per_day, distributions[5])

        return {meal: round(target_calories * pct) for meal, pct in dist.items()}
