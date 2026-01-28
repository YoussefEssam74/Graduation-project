-- ============================================
-- Knowledge Embeddings Table for RAG System
-- Run this in Supabase SQL Editor
-- ============================================

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Embeddings table for RAG
CREATE TABLE IF NOT EXISTS "KnowledgeEmbeddings" (
    "Id" VARCHAR(50) PRIMARY KEY,
    "Category" VARCHAR(50) NOT NULL,
    "Text" TEXT NOT NULL,
    "Embedding" vector(384) NOT NULL,
    "Metadata" JSONB,
    "Version" INT DEFAULT 1,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create IVFFlat index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding 
ON "KnowledgeEmbeddings" 
USING ivfflat ("Embedding" vector_cosine_ops) 
WITH (lists = 100);

-- Index on category for filtered searches
CREATE INDEX IF NOT EXISTS idx_knowledge_category 
ON "KnowledgeEmbeddings"("Category");

-- Index on active status
CREATE INDEX IF NOT EXISTS idx_knowledge_active 
ON "KnowledgeEmbeddings"("IsActive") WHERE "IsActive" = TRUE;

-- ============================================
-- Similarity Search Function
-- ============================================
CREATE OR REPLACE FUNCTION fn_find_similar_knowledge(
    query_embedding vector(384),
    top_k INT DEFAULT 5,
    category_filter VARCHAR DEFAULT NULL,
    min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id VARCHAR,
    category VARCHAR,
    text TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ke."Id",
        ke."Category",
        ke."Text",
        ke."Metadata",
        (1 - (ke."Embedding" <=> query_embedding))::FLOAT as similarity
    FROM "KnowledgeEmbeddings" ke
    WHERE ke."IsActive" = TRUE
      AND (category_filter IS NULL OR ke."Category" = category_filter)
      AND (1 - (ke."Embedding" <=> query_embedding)) >= min_similarity
    ORDER BY ke."Embedding" <=> query_embedding
    LIMIT top_k;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Fitness Predictions Table
-- ============================================
CREATE TABLE IF NOT EXISTS "FitnessPredictions" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL REFERENCES "Users"("UserId") ON DELETE CASCADE,
    "PredictedLevel" VARCHAR(20) NOT NULL,
    "Confidence" FLOAT NOT NULL,
    "BeginnerScore" FLOAT,
    "IntermediateScore" FLOAT,
    "AdvancedScore" FLOAT,
    "InputAge" FLOAT,
    "InputWeightKg" FLOAT,
    "InputHeightCm" FLOAT,
    "InputBodyFatPct" FLOAT,
    "InputExperienceYears" FLOAT,
    "CreatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fitness_predictions_user 
ON "FitnessPredictions"("UserId");

-- ============================================
-- Vision Analysis Table
-- ============================================
CREATE TABLE IF NOT EXISTS "VisionAnalysis" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL REFERENCES "Users"("UserId") ON DELETE CASCADE,
    "ImageUrl" TEXT,
    "ChestStatus" VARCHAR(100),
    "ChestConfidence" FLOAT,
    "ArmsStatus" VARCHAR(100),
    "ArmsConfidence" FLOAT,
    "ShouldersStatus" VARCHAR(100),
    "ShouldersConfidence" FLOAT,
    "BodyFatStatus" VARCHAR(100),
    "BodyFatConfidence" FLOAT,
    "WeakMuscles" TEXT[],
    "OverallConfidence" FLOAT,
    "IsReliable" BOOLEAN,
    "AnalyzedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vision_analysis_user 
ON "VisionAnalysis"("UserId");

-- ============================================
-- Workout History Table (for progression)
-- ============================================
CREATE TABLE IF NOT EXISTS "WorkoutHistory" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL REFERENCES "Users"("UserId") ON DELETE CASCADE,
    "PlanId" INT NOT NULL REFERENCES "WorkoutPlans"("PlanId") ON DELETE CASCADE,
    "WeekNumber" INT NOT NULL,
    "DayNumber" INT NOT NULL,
    "ExerciseName" VARCHAR(100) NOT NULL,
    "PlannedSets" INT,
    "PlannedReps" INT,
    "ActualSets" INT,
    "ActualReps" INT,
    "WeightUsed" DECIMAL(10,2),
    "Completed" BOOLEAN DEFAULT FALSE,
    "Notes" TEXT,
    "CompletedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workout_history_user 
ON "WorkoutHistory"("UserId");

CREATE INDEX IF NOT EXISTS idx_workout_history_plan 
ON "WorkoutHistory"("PlanId");

-- ============================================
-- Extend WorkoutPlans if columns don't exist
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WorkoutPlans' AND column_name = 'GenerationSource') THEN
        ALTER TABLE "WorkoutPlans" ADD COLUMN "GenerationSource" VARCHAR(20) DEFAULT 'MANUAL';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WorkoutPlans' AND column_name = 'FitnessPredictionId') THEN
        ALTER TABLE "WorkoutPlans" ADD COLUMN "FitnessPredictionId" INT REFERENCES "FitnessPredictions"("Id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WorkoutPlans' AND column_name = 'VisionAnalysisId') THEN
        ALTER TABLE "WorkoutPlans" ADD COLUMN "VisionAnalysisId" INT REFERENCES "VisionAnalysis"("Id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WorkoutPlans' AND column_name = 'RegenerationAttempts') THEN
        ALTER TABLE "WorkoutPlans" ADD COLUMN "RegenerationAttempts" INT DEFAULT 0;
    END IF;
END $$;
