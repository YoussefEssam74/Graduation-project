import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (Enhanced with gym features)
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    clerkId: v.string(),
    role: v.optional(v.string()), // Member, Coach, Reception, Admin
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    fitnessGoal: v.optional(v.string()),
    tokenBalance: v.number(),
    subscriptionPlanID: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  // Plans (Enhanced with approval system)
  plans: defineTable({
    userId: v.string(),
    name: v.string(),
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              name: v.string(),
              sets: v.optional(v.number()),
              reps: v.optional(v.number()),
              duration: v.optional(v.string()),
              description: v.optional(v.string()),
              exercises: v.optional(v.array(v.string())),
            })
          ),
        })
      ),
    }),
    dietPlan: v.object({
      dailyCalories: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(v.string()),
        })
      ),
    }),
    generatedBy: v.string(), // "ai", "coach", "manual"
    approvalStatus: v.string(), // "pending", "approved", "rejected"
    assignedCoachId: v.optional(v.string()),
    tokensSpent: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_user_id", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_approval_status", ["approvalStatus"]),

  // Equipment Bookings
  bookings: defineTable({
    userId: v.string(),
    equipmentId: v.optional(v.string()),
    coachId: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    status: v.string(), // Confirmed, Cancelled, Completed, NoShow
    tokensCost: v.number(),
    createdAt: v.string(),
  })
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_start_time", ["startTime"]),

  // Equipment Management
  equipment: defineTable({
    name: v.string(),
    category: v.string(),
    status: v.string(), // Available, Occupied, UnderMaintenance
    location: v.string(),
    lastMaintenanceDate: v.string(),
  }).index("by_status", ["status"]),

  // InBody Measurements
  inBodyMeasurements: defineTable({
    userId: v.string(),
    measurementDate: v.string(),
    weight: v.number(),
    bodyFatPercentage: v.number(),
    muscleMass: v.number(),
    bmi: v.number(),
    bodyWaterPercentage: v.optional(v.number()),
    boneMass: v.optional(v.number()),
    visceralFatLevel: v.optional(v.number()),
    bmr: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_date", ["measurementDate"]),

  // AI Query Logs
  aiQueryLogs: defineTable({
    userId: v.string(),
    queryText: v.string(),
    responseText: v.string(),
    tokensCost: v.number(),
    queryTimestamp: v.string(),
  }).index("by_user_id", ["userId"]),

  // Token Transactions
  tokenTransactions: defineTable({
    userId: v.string(),
    amount: v.number(),
    transactionType: v.string(), // Purchase, Spend, Refund, Bonus
    description: v.string(),
    transactionDate: v.string(),
    balanceAfter: v.number(),
  }).index("by_user_id", ["userId"]),
});
