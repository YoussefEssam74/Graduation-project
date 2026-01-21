"""
Context Builder for Coach Assistant
====================================

Builds context strings for the LLM based on user profile and data.
Formats RAG results for inclusion in prompts.
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class ContextBuilder:
    """
    Builds context for LLM prompts.

    Creates personalized system prompts based on user profile,
    and formats retrieved documents for RAG augmentation.
    """

    def __init__(self, config: Dict):
        """
        Initialize the context builder.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        ca_config = config.get('coach_assistant', {})
        self.max_history = ca_config.get('max_history_messages', 10)

    def build_system_context(self, user_context: Optional[Dict] = None) -> str:
        """
        Build a system context/prompt with user information.

        Args:
            user_context: User profile dictionary

        Returns:
            System prompt string
        """
        base_prompt = """You are an expert fitness coach assistant for PulseGym.
You provide personalized, evidence-based fitness and nutrition advice.

IMPORTANT GUIDELINES:
1. SAFETY FIRST: Always acknowledge any injuries or medical conditions. Recommend consulting healthcare providers when appropriate.
2. BE SUPPORTIVE: Use an encouraging, empathetic tone. Celebrate progress and provide motivation.
3. BE SPECIFIC: Give actionable advice tailored to the user's goals and constraints.
4. STAY PROFESSIONAL: Only discuss fitness, nutrition, and wellness topics.
5. BE HONEST: If you don't know something, say so. Don't make up information."""

        if not user_context:
            return base_prompt

        # Build personalized context
        user_info = self._format_user_profile(user_context)

        personalized_prompt = f"""{base_prompt}

USER PROFILE:
{user_info}

PERSONALIZATION INSTRUCTIONS:
- Address the user by name if provided
- Consider their fitness level when suggesting exercises
- Account for their goal when giving advice
- CRITICAL: Always consider their injuries when recommending exercises
- CRITICAL: Always consider their allergies when discussing nutrition"""

        return personalized_prompt

    def _format_user_profile(self, context: Dict) -> str:
        """Format user profile into a readable string."""
        lines = []

        if context.get('name'):
            lines.append(f"- Name: {context['name']}")

        if context.get('age'):
            lines.append(f"- Age: {context['age']} years")

        if context.get('weight'):
            lines.append(f"- Weight: {context['weight']} kg")

        if context.get('height'):
            lines.append(f"- Height: {context['height']} cm")

        if context.get('gender'):
            lines.append(f"- Gender: {context['gender']}")

        if context.get('fitness_level'):
            lines.append(f"- Fitness Level: {context['fitness_level']}")

        if context.get('goal'):
            lines.append(f"- Goal: {context['goal']}")

        if context.get('injuries'):
            injuries = context['injuries']
            if isinstance(injuries, list):
                injuries = ', '.join(injuries)
            lines.append(f"- ⚠️ INJURIES/CONDITIONS: {injuries}")

        if context.get('allergies'):
            allergies = context['allergies']
            if isinstance(allergies, list):
                allergies = ', '.join(allergies)
            lines.append(f"- ⚠️ ALLERGIES/DIETARY RESTRICTIONS: {allergies}")

        if context.get('activity_level'):
            lines.append(f"- Activity Level: {context['activity_level']}")

        return '\n'.join(lines) if lines else "No profile information available"

    def format_rag_context(self, documents: List[Dict]) -> str:
        """
        Format RAG-retrieved documents for inclusion in prompt.

        Args:
            documents: List of retrieved document dictionaries

        Returns:
            Formatted context string
        """
        if not documents:
            return ""

        formatted = []
        for i, doc in enumerate(documents, 1):
            content = doc.get('content', doc.get('text', ''))
            source = doc.get('source', 'knowledge base')

            # Truncate if too long
            if len(content) > 500:
                content = content[:500] + "..."

            formatted.append(f"[{i}] {content}")

        return '\n\n'.join(formatted)

    def build_analysis_prompt(
        self,
        user_context: Dict,
        workout_history: List[Dict],
        nutrition_history: List[Dict]
    ) -> str:
        """
        Build a prompt for progress analysis.

        Args:
            user_context: User profile
            workout_history: Recent workouts
            nutrition_history: Recent meals/nutrition data

        Returns:
            Analysis prompt string
        """
        prompt_parts = [
            "Please analyze my fitness progress and provide insights.\n"]

        # Add user context
        if user_context:
            prompt_parts.append(
                f"My Profile:\n{self._format_user_profile(user_context)}\n")

        # Add workout history
        if workout_history:
            prompt_parts.append("Recent Workouts:")
            for w in workout_history[-5:]:  # Last 5 workouts
                date = w.get('date', 'Unknown date')
                exercises = w.get('exercises', [])
                if exercises:
                    ex_names = [e.get('name', 'Unknown')
                                for e in exercises[:3]]
                    prompt_parts.append(f"  - {date}: {', '.join(ex_names)}")
            prompt_parts.append("")

        # Add nutrition history
        if nutrition_history:
            prompt_parts.append("Recent Nutrition:")
            for n in nutrition_history[-3:]:  # Last 3 days
                date = n.get('date', 'Unknown date')
                calories = n.get('total_calories', 'Unknown')
                prompt_parts.append(f"  - {date}: {calories} calories")
            prompt_parts.append("")

        prompt_parts.append("Please provide:")
        prompt_parts.append("1. An analysis of my current progress")
        prompt_parts.append("2. What I'm doing well")
        prompt_parts.append("3. Areas for improvement")
        prompt_parts.append("4. Specific recommendations for next week")

        return '\n'.join(prompt_parts)

    def build_workout_advice_prompt(
        self,
        user_context: Dict,
        specific_question: str
    ) -> str:
        """Build a prompt for workout-specific advice."""
        prompt = f"""Based on my profile, please help me with this workout question:

{specific_question}

Consider my profile when answering:
{self._format_user_profile(user_context)}"""

        return prompt

    def build_nutrition_advice_prompt(
        self,
        user_context: Dict,
        specific_question: str
    ) -> str:
        """Build a prompt for nutrition-specific advice."""
        prompt = f"""Based on my profile, please help me with this nutrition question:

{specific_question}

Consider my profile and dietary restrictions:
{self._format_user_profile(user_context)}"""

        return prompt
