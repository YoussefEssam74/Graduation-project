import 'package:flutter/material.dart';

class NutritionPlanModel {
  final int planId;
  final String planName;
  final String? description;
  final bool isActive;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? dailyCalories;
  final int? proteinGrams;
  final int? carbsGrams;
  final int? fatGrams;
  final String? dietaryPreferences;
  final List<NutritionDayModel> days;

  NutritionPlanModel({
    required this.planId,
    required this.planName,
    this.description,
    required this.isActive,
    this.startDate,
    this.endDate,
    this.dailyCalories,
    this.proteinGrams,
    this.carbsGrams,
    this.fatGrams,
    this.dietaryPreferences,
    this.days = const [],
  });

  factory NutritionPlanModel.fromJson(Map<String, dynamic> json) {
    List<NutritionDayModel> daysList = [];
    if (json['days'] != null && json['days'] is List) {
      daysList = (json['days'] as List)
          .map((d) => NutritionDayModel.fromJson(d))
          .toList();
    }

    return NutritionPlanModel(
      planId: json['planId'] ?? json['id'] ?? 0,
      planName: json['planName'] ?? json['name'] ?? 'My Nutrition Plan',
      description: json['description'],
      isActive: json['isActive'] ?? json['active'] ?? true,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'])
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'])
          : null,
      dailyCalories: json['dailyCalories'] ?? json['calories'],
      proteinGrams: json['proteinGrams'] ?? json['protein'],
      carbsGrams: json['carbsGrams'] ?? json['carbs'],
      fatGrams: json['fatGrams'] ?? json['fat'],
      dietaryPreferences: json['dietaryPreferences'],
      days: daysList,
    );
  }

  String get caloriesDisplay =>
      dailyCalories != null ? '${dailyCalories}kcal' : '—';
  String get proteinDisplay => proteinGrams != null ? '${proteinGrams}g' : '—';
  String get carbsDisplay => carbsGrams != null ? '${carbsGrams}g' : '—';
  String get fatDisplay => fatGrams != null ? '${fatGrams}g' : '—';
}

class NutritionDayModel {
  final int dayNumber;
  final String? dayName;
  final List<NutritionMealModel> meals;

  NutritionDayModel({
    required this.dayNumber,
    this.dayName,
    this.meals = const [],
  });

  factory NutritionDayModel.fromJson(Map<String, dynamic> json) {
    List<NutritionMealModel> mealsList = [];
    if (json['meals'] != null && json['meals'] is List) {
      mealsList = (json['meals'] as List)
          .map((m) => NutritionMealModel.fromJson(m))
          .toList();
    }
    return NutritionDayModel(
      dayNumber: json['dayNumber'] ?? 1,
      dayName: json['dayName'],
      meals: mealsList,
    );
  }

  String get displayName =>
      dayName?.isNotEmpty == true ? dayName! : 'Day $dayNumber';
}

class NutritionMealModel {
  final String mealType;
  final String? description;
  final int? calories;
  final int? protein;
  final int? carbs;
  final int? fat;
  final List<String> foods;

  NutritionMealModel({
    required this.mealType,
    this.description,
    this.calories,
    this.protein,
    this.carbs,
    this.fat,
    this.foods = const [],
  });

  factory NutritionMealModel.fromJson(Map<String, dynamic> json) {
    List<String> foodList = [];
    if (json['foods'] is List) {
      foodList = (json['foods'] as List).map((f) => f.toString()).toList();
    }
    return NutritionMealModel(
      mealType: json['mealType'] ?? json['type'] ?? 'Meal',
      description: json['description'],
      calories: json['calories'],
      protein: json['protein'],
      carbs: json['carbs'],
      fat: json['fat'],
      foods: foodList,
    );
  }

  IconData get mealIcon {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return const IconData(0xe3ae, fontFamily: 'MaterialIcons'); // wb_sunny
      case 'lunch':
        return const IconData(
          0xe25a,
          fontFamily: 'MaterialIcons',
        ); // lunch_dining
      case 'dinner':
        return const IconData(
          0xe1bc,
          fontFamily: 'MaterialIcons',
        ); // dinner_dining
      case 'snack':
        return const IconData(0xe552, fontFamily: 'MaterialIcons'); // apple
      default:
        return const IconData(
          0xef4f,
          fontFamily: 'MaterialIcons',
        ); // restaurant
    }
  }
}
