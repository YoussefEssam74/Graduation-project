// User Types
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
  email: string;
  name: string;
  age: number;
  gender: Gender;
  fitnessGoal: string;
  tokenBalance: number;
  subscriptionPlanID?: number;
  createdAt: string;
  role: UserRole;
}

// Exercise Types
export enum DifficultyLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
}

export interface Exercise {
  exerciseID: number;
  name: string;
  difficulty: DifficultyLevel;
  muscleGroup: string;
  equipment: string;
  description: string;
  videoURL?: string;
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

// Booking Types
export enum BookingStatus {
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow',
}

export interface Booking {
  bookingID: number;
  userID: number;
  equipmentID: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  tokensCost: number;
  equipment?: Equipment;
}

// Meal Types
export interface Meal {
  mealID: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  description: string;
  addedByCoachID?: number;
}

// Workout Plan Types
export enum WorkoutPlanStatus {
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum PlanSource {
  AI = 'AI',
  Coach = 'Coach',
  Manual = 'Manual',
}

export enum ApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface WorkoutPlanTemplate {
  templateID: number;
  coachID?: number;
  templateName: string;
  description?: string;
  difficultyLevel: DifficultyLevel;
  durationWeeks: number;
  workoutsPerWeek: number;
  isPublic: boolean;
  createdAt: string;
  exercises?: TemplateExercise[];
}

export interface TemplateExercise {
  templateExerciseID: number;
  templateID: number;
  exerciseID: number;
  weekNumber: number;
  dayNumber: number;
  sets: number;
  reps: number;
  restSeconds: number;
  notes?: string;
  exercise?: Exercise;
}

export interface MemberWorkoutPlan {
  planInstanceID: number;
  userID: number;
  templateID?: number;
  assignedByCoachID?: number;
  generatedByAI_ID?: number;
  startDate: string;
  endDate: string;
  status: WorkoutPlanStatus;
  completedWorkouts: number;
  planSource: PlanSource;
  approvalStatus: ApprovalStatus;
  template?: WorkoutPlanTemplate;
}

// Nutrition Plan Types
export interface NutritionPlan {
  planID: number;
  userID: number;
  ai_ID: number;
  reviewedByCoachID?: number;
  planName: string;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  generatedAt: string;
  approvalStatus: ApprovalStatus;
  reviewedAt?: string;
  reviewComments?: string;
  isActive: boolean;
  planSource: PlanSource;
  meals?: Meal[];
}

// InBody Measurement Types
export interface InBodyMeasurement {
  inBodyID: number;
  userID: number;
  measurementDate: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  visceralFatLevel: number;
  bodyWaterPercentage: number;
  boneMass: number;
  bmr: number;
  bmi: number;
  receptionistID: number;
}

// Subscription Plan Types
export interface SubscriptionPlan {
  planID: number;
  name: string;
  description: string;
  monthlyFee: number;
  features: string[];
  durationMonths: number;
}

// AI Chat Types
export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Stats Types
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

export interface CoachStats {
  activeClients: number;
  totalPlans: number;
  upcomingSessions: number;
  averageRating: number;
}

export interface ReceptionStats {
  todayCheckins: number;
  activeMembers: number;
  pendingPayments: number;
  maintenanceAlerts: number;
}

// Activity Feed Types
export interface ActivityItem {
  id: string;
  type: 'workout' | 'nutrition' | 'inbody' | 'booking' | 'ai';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}
