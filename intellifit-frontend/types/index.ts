// User Types - Matches backend UserDto
export enum UserRole {
  Member = 'Member',
  Coach = 'Coach',
  Reception = 'Reception',
  Admin = 'Admin',
}

export interface User {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number; // Backend uses int (0=Male, 1=Female)
  role: string;
  profileImageUrl?: string;
  address?: string;
  tokenBalance: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// Auth DTOs - Match backend
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
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

// Booking Types - Matches backend BookingDto
export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Completed = 2,
  Cancelled = 3,
  NoShow = 4,
}

export interface Booking {
  bookingId: number;
  userId: number;
  userName: string;
  equipmentId?: number;
  equipmentName?: string;
  coachId?: number;
  coachName?: string;
  bookingType: string;
  startTime: string;
  endTime: string;
  status: number; // Backend uses int for status
  statusText: string;
  tokensCost: number;
  notes?: string;
  createdAt: string;
}

export interface CreateBooking {
  userId: number;
  equipmentId?: number;
  coachId?: number;
  bookingType: string;
  startTime: string;
  endTime: string;
  notes?: string;
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

// InBody Measurement Types - Matches backend InBodyMeasurementDto
export interface InBodyMeasurement {
  measurementId: number;
  userId: number;
  userName: string;
  weight: number;
  height: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  boneMass?: number;
  bodyWater?: number;
  visceralFat?: number;
  bmi?: number;
  basalMetabolicRate?: number;
  conductedByReceptionId?: number;
  conductedByName?: string;
  notes?: string;
  measurementDate: string;
  createdAt: string;
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

// Dashboard Stats Types - Matches backend Stats DTOs
export interface MemberStats {
  userId: number;
  userName: string;
  tokenBalance: number;
  totalBookings: number;
  completedBookings: number;
  activeWorkoutPlans: number;
  activeNutritionPlans: number;
  totalWorkoutsCompleted: number;
  inBodyMeasurements: number;
  currentWeight?: number;
  currentBodyFat?: number;
  latestBmi?: number;
  lastInBodyDate?: string;
  lastBookingDate?: string;
  activeSubscriptionId?: number;
  subscriptionEndDate?: string;
}

export interface CoachStats {
  coachId: number;
  coachName: string;
  totalClients: number;
  activeWorkoutPlans: number;
  activeNutritionPlans: number;
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  averageRating: number;
  totalReviews: number;
  totalEarnings: number;
  tokensEarned: number;
  nextBookingDate?: string;
}

export interface ReceptionStats {
  totalMembers: number;
  activeMembers: number;
  todayCheckIns: number;
  todayBookings: number;
  pendingBookings: number;
  availableEquipment: number;
  inUseEquipment: number;
  maintenanceEquipment: number;
  todayInBodyTests: number;
  todayRevenue: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
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
