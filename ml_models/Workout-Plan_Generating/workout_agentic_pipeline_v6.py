import json
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

# ============================================================================
# 1. DOMAIN LAYER (Entities & Core Business Rules)
# Does not depend on any outer layers. Contains only pure logic & schemas.
# ============================================================================

class UserProfile(BaseModel):
    body_fat_pct: float = Field(..., description="User's body fat percentage")
    muscle_mass_kg: float = Field(..., description="User's muscle mass in kg")
    bmi: float = Field(..., description="User's Body Mass Index")
    level: str = Field(..., description="Fitness level: beginner, intermediate, advanced")
    goal: str = Field(..., description="Primary goal: fat_loss, hypertrophy, strength")
    injuries: List[str] = Field(default_factory=list, description="List of injured body parts")

class PlannedExercise(BaseModel):
    name: str
    sets: int
    reps: str
    rest_seconds: int

class WorkoutPlan(BaseModel):
    warmup: List[PlannedExercise]
    strength_exercises: List[PlannedExercise]
    cardio_finisher: Optional[str]

# ============================================================================
# 2. APPLICATION LAYER (Use Cases & Agent Orchestration)
# Contains the flow of data but not the specific database implementions.
# ============================================================================

class PlannerAgent:
    """Agent responsible for high-level workout strategy."""
    def analyze_profile(self, profile: UserProfile) -> dict:
        strategy = {
            "focus_areas": ["chest", "triceps"] if profile.goal == "hypertrophy" else ["full_body"],
            "needs_intense_cardio": profile.body_fat_pct > 25.0,
            "needs_careful_warmup": profile.bmi > 30.0 or len(profile.injuries) > 0
        }
        return strategy

class RAGRetrieverPort:
    """Interface (Port) defining how we fetch exercises."""
    def retrieve_safe_exercises(self, category: str, limit: int, avoid_muscles: List[str]) -> List[dict]:
        raise NotImplementedError

class WorkoutGenerationUseCase:
    """Orchestrates the Agents to build the final plan (Clean Architecture Use Case)."""
    def __init__(self, retriever_port: RAGRetrieverPort):
        self.retriever = retriever_port
        self.planner = PlannerAgent()
    
    def generate_workout(self, profile: UserProfile) -> WorkoutPlan:
        # Step 1: Planner Agent decides strategy
        strategy = self.planner.analyze_profile(profile)
        
        # Step 2: RAG Retrieval for safe exercises (Replaces LLM Hallucinations)
        avoid = profile.injuries
        warmup_exs = self.retriever.retrieve_safe_exercises("stretching", limit=3, avoid_muscles=avoid)
        strength_exs = self.retriever.retrieve_safe_exercises("strength", limit=5, avoid_muscles=avoid)
        cardio_exs = self.retriever.retrieve_safe_exercises("cardio", limit=1, avoid_muscles=[])
        
        # Step 3: LLM Structuring
        # In actual prod we prompt deepseek/gpt here with the filtered exercise names
        
        warmup = [
            PlannedExercise(name=ex['name'], sets=1, reps="30-60s hold", rest_seconds=0)
            for ex in warmup_exs
        ]
        
        strength = []
        for ex in strength_exs:
            reps = "8-12" if profile.goal == "hypertrophy" else "5-8"
            strength.append(PlannedExercise(name=ex['name'], sets=3, reps=reps, rest_seconds=90))
            
        cardio_plan = None
        if strategy["needs_intense_cardio"] and cardio_exs:
            cardio_plan = f"20 mins HIIT {cardio_exs[0]['name']} (Zone 4)"
        elif cardio_exs:
            cardio_plan = f"10 mins LISS {cardio_exs[0]['name']} (Cool-down)"

        return WorkoutPlan(
            warmup=warmup,
            strength_exercises=strength,
            cardio_finisher=cardio_plan
        )

# ============================================================================
# 3. INFRASTRUCTURE LAYER (Database, external APIs, etc.)
# Implements the ports defined by the application layer.
# ============================================================================

class CsvVectorDBMock(RAGRetrieverPort):
    """
    Simulates a Vector Database using our v6 CSV. 
    In prod, replace with FAISS or Milvus for semantic similarity.
    """
    def __init__(self, csv_file_path: str):
        self.df = pd.read_csv(csv_file_path)
        # We assume the CSV has columns: name, category, primaryMuscles, etc.
        # Fallback padding if structure is mismatched simply for demonstration
        if 'category' not in self.df.columns:
            self.df['category'] = 'strength'
        if 'primaryMuscles' not in self.df.columns:
            self.df['primaryMuscles'] = ''
        
    def retrieve_safe_exercises(self, category: str, limit: int, avoid_muscles: List[str]) -> List[dict]:
        # Basic filtering mimicking deterministic retrieval logic
        mask = self.df['category'].astype(str).str.lower() == category.lower()
        
        filtered = self.df[mask].copy()
        
        if len(filtered) == 0:
            return []
            
        # Optional: Prevent giving exercises that hit injured muscles
        if 'primaryMuscles' in filtered.columns and avoid_muscles:
            for m in avoid_muscles:
                filtered = filtered[~filtered['primaryMuscles'].str.lower().str.contains(m.lower(), na=False)]
                
        if len(filtered) == 0:
            return []
            
        sample = filtered.sample(n=min(limit, len(filtered)))
        return sample.to_dict('records')

# ============================================================================
# 4. PRESENTATION LAYER (API / Controllers)
# Exposes the system to the outside world.
# ============================================================================

if __name__ == "__main__":
    print("Initializing V6 Agentic RAG System...")
    
    # 1. Initialize Infrastructure Path
    CSV_PATH = r"d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\ml_models\Workout-Plan_Generating\Dataset\exercises_v6_complete_view.csv"
    
    import os
    if not os.path.exists(CSV_PATH):
        print(f"[{CSV_PATH}] not found. Check the exact directory structure!")
    else:
        # Load the adapter
        db_adapter = CsvVectorDBMock(CSV_PATH)
        workflow = WorkoutGenerationUseCase(db_adapter)
        
        # 2. Simulate User Profile Payload
        user_request = {
            "body_fat_pct": 28.5,
            "muscle_mass_kg": 35.0,
            "bmi": 29.2,
            "level": "intermediate",
            "goal": "fat_loss",
            "injuries": ["lower back"] 
        }
        
        try:
            profile = UserProfile(**user_request)
            plan = workflow.generate_workout(profile)
            
            print("\n--- Model V6 Generation Complete ---")
            print("Profile Analyzed:")
            print(profile.model_dump_json(indent=2))
            
            print("\nGenerated Safe Plan:")
            print(plan.model_dump_json(indent=4))
        except Exception as e:
            print(f"Error during flow execution: {e}")
