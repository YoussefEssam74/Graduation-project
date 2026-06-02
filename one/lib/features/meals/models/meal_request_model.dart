class MealRequestDto {
  final String name;
  final String? description;
  final int? calories;
  final double? proteinGrams;
  final double? carbsGrams;
  final double? fatGrams;
  final String? mealType;
  final int nutritionPlanId;

  MealRequestDto({
    required this.name,
    this.description,
    this.calories,
    this.proteinGrams,
    this.carbsGrams,
    this.fatGrams,
    this.mealType,
    required this.nutritionPlanId,
  });

  Map<String, dynamic> toJson() => {
    "name": name,
    "description": description,
    "calories": calories,
    "proteinGrams": proteinGrams,
    "carbsGrams": carbsGrams,
    "fatGrams": fatGrams,
    "mealType": mealType,
    "nutritionPlanId": nutritionPlanId,
  };
}
