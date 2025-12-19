"""Helper functions to preprocess workout examples and user profiles.
This is a lightweight stub: implement actual normalization and feature building later.
"""
from typing import Dict


def profile_to_features(profile: Dict) -> Dict:
    """Convert user profile dict to normalized features dict.
    Expected keys: age, weight, height, injuries, goal, experience_level
    """
    features = {
        'age': profile.get('age'),
        'goal': profile.get('goal', 'general'),
        'level': profile.get('experience_level', 'beginner')
    }
    return features


def example_to_prompt(example_row: Dict, profile: Dict) -> str:
    """Create a prompt string combining an example workout and user profile."""
    features = profile_to_features(profile)
    prompt = f"User goal: {features['goal']}. Level: {features['level']}.\n"
    prompt += f"Example workout: {example_row.get('exercises', '')}\n"
    prompt += "Create a 4-week progressive plan tailored to user."
    return prompt
