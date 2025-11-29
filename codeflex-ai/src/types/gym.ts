// Gym Management Types

export enum UserRole {
  Member = 'Member',
  Coach = 'Coach',
  Reception = 'Reception',
  Admin = 'Admin',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export interface User {
  userId: number;
  clerkId?: string;
  email: string;
  name: string;
  age: number;
  gender: Gender;
  phone?: string;
  profileImageUrl?: string;
  address?: string;
  fitnessGoal: string;
  tokenBalance: number;
  subscriptionPlanID?: number;
  createdAt: string;
  role: UserRole;
}

// Booking Types
export enum BookingStatus {
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  NoShow = 'NoShow',
}

export interface Booking {
  bookingID: number;
  userID: number;
  equipmentID?: number;
  coachID?: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  tokensCost: number;
  equipment?: Equipment;
  coach?: Coach;
}

// Equipment Types
export enum EquipmentStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  UnderMaintenance = 'UnderMaintenance',
}

export interface Equipment {
  equipmentID: number;
  name: string;
  category: string;
  status: EquipmentStatus;
  location: string;
  lastMaintenanceDate: string;
}

// InBody Types
export interface InBodyMeasurement {
  measurementID: number;
  userID: number;
  measurementDate: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  bodyWaterPercentage?: number;
  boneMass?: number;
  visceralFatLevel?: number;
  bmr?: number;
}

// Coach Types
export interface Coach {
  coachID: number;
  userID: number;
  specialization: string;
  certifications: string[];
  experienceYears: number;
  rating: number;
  hourlyRate: number;
}

// Subscription Types
export interface SubscriptionPlan {
  planID: number;
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  tokensIncluded: number;
  isPopular?: boolean;
}

// Workout Plan Types - Extended for AI generation
export interface WorkoutPlan {
  planId: string;
  userId: string;
  name: string;
  schedule: string[];
  exercises: ExerciseDay[];
  generatedBy: 'ai' | 'coach' | 'manual';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  tokensSpent?: number;
  createdAt: string;
  isActive: boolean;
}

export interface ExerciseDay {
  day: string;
  routines: Routine[];
}

export interface Routine {
  name: string;
  sets: number;
  reps: number;
  duration?: string;
  description?: string;
}

// Nutrition Plan Types - Extended for AI generation
export interface NutritionPlan {
  planId: string;
  userId: string;
  name: string;
  dailyCalories: number;
  meals: Meal[];
  generatedBy: 'ai' | 'coach' | 'manual';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  tokensSpent?: number;
  createdAt: string;
  isActive: boolean;
}

export interface Meal {
  name: string;
  foods: string[];
  calories?: number;
}

// AI Coach Types
export interface AIQueryLog {
  queryID: number;
  userID: number;
  queryText: string;
  responseText: string;
  tokensCost: number;
  queryTimestamp: string;
}

// Token Transaction Types
export enum TransactionType {
  Purchase = 'Purchase',
  Spend = 'Spend',
  Refund = 'Refund',
  Bonus = 'Bonus',
}

export interface TokenTransaction {
  transactionID: number;
  userID: number;
  amount: number;
  transactionType: TransactionType;
  description: string;
  transactionDate: string;
  balanceAfter: number;
}

// Stats Types
export interface MemberStats {
  currentWeight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  tokenBalance: number;
  activeWorkoutPlans: number;
  activeNutritionPlans: number;
  upcomingBookings: number;
  completedWorkouts: number;
  totalCaloriesBurned: number;
}

export interface ActivityItem {
  id: number;
  type: 'workout' | 'nutrition' | 'ai' | 'booking' | 'inbody';
  title: string;
  description: string;
  timestamp: string;
}
