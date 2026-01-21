"""
Ollama Client for Coach Assistant
=================================

Client for interacting with Ollama LLM server.
Uses Phi-3 Mini by default (3.8B params, runs on CPU).

Ollama must be installed and running locally:
    1. Install: https://ollama.ai/download
    2. Pull model: ollama pull phi3:mini
    3. Run server: ollama serve (runs on localhost:11434)
"""

import logging
import requests
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    Client for Ollama LLM server.

    Ollama provides local LLM inference with various models.
    We use Phi-3 Mini as it's:
    - Small enough to run on CPU (3.8B params, ~4GB RAM)
    - Good quality for its size
    - Free and open source
    """

    def __init__(self, config: Dict):
        """
        Initialize the Ollama client.

        Args:
            config: Configuration dictionary
        """
        self.config = config

        # Ollama configuration
        ollama_config = config.get('ollama', {})
        self.base_url = ollama_config.get('base_url', 'http://localhost:11434')
        self.model_name = ollama_config.get('model', 'phi3:mini')

        # Generation parameters
        gen_config = ollama_config.get('generation', {})
        self.max_tokens = gen_config.get('max_tokens', 512)
        self.temperature = gen_config.get('temperature', 0.7)
        self.top_p = gen_config.get('top_p', 0.9)
        self.repeat_penalty = gen_config.get('repeat_penalty', 1.1)

        # Default system prompt
        self.default_system_prompt = ollama_config.get('system_prompt',
                                                       "You are an expert fitness coach assistant. Provide helpful, safe, and personalized advice.")

        logger.info(
            f"Ollama client initialized: {self.base_url}, model: {self.model_name}")

    def check_health(self) -> bool:
        """
        Check if Ollama server is running and accessible.

        Returns:
            True if server is healthy, False otherwise
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False

    def list_models(self) -> List[str]:
        """
        List available models on Ollama server.

        Returns:
            List of model names
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return [m['name'] for m in data.get('models', [])]
        except Exception as e:
            logger.error(f"Error listing models: {e}")
        return []

    def generate_response(
        self,
        message: str,
        system_context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate a response using Ollama.

        Args:
            message: User's message
            system_context: System prompt with user context
            conversation_history: Previous messages in conversation

        Returns:
            Generated response text
        """
        # Build messages array
        messages = []

        # Add system message
        system = system_context or self.default_system_prompt
        messages.append({
            "role": "system",
            "content": system
        })

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Keep last 10 messages
                messages.append(msg)

        # Add current user message
        messages.append({
            "role": "user",
            "content": message
        })

        try:
            # Call Ollama API
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "options": {
                        "num_predict": self.max_tokens,
                        "temperature": self.temperature,
                        "top_p": self.top_p,
                        "repeat_penalty": self.repeat_penalty
                    },
                    "stream": False
                },
                timeout=60
            )

            if response.status_code == 200:
                data = response.json()
                return data.get('message', {}).get('content', '')
            else:
                logger.error(
                    f"Ollama API error: {response.status_code} - {response.text}")
                return self._fallback_response(message)

        except requests.exceptions.Timeout:
            logger.error("Ollama request timed out")
            return self._fallback_response(message)
        except requests.exceptions.ConnectionError:
            logger.error(
                "Cannot connect to Ollama server. Make sure it's running.")
            return self._fallback_response(message, connection_error=True)
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return self._fallback_response(message)

    def _fallback_response(self, message: str, connection_error: bool = False) -> str:
        """
        Generate a fallback response when Ollama is unavailable.

        This provides basic helpful responses even when the LLM is down.
        """
        if connection_error:
            return (
                "I'm sorry, but I'm currently unable to connect to my AI engine. "
                "Please make sure Ollama is running (run 'ollama serve' in terminal). "
                "In the meantime, here are some general tips:\n\n"
                "1. Stay consistent with your workouts\n"
                "2. Get adequate sleep (7-9 hours)\n"
                "3. Stay hydrated throughout the day\n"
                "4. Focus on progressive overload in training\n\n"
                "Please try again once Ollama is running."
            )

        # Simple keyword-based fallback
        message_lower = message.lower()

        if any(word in message_lower for word in ['workout', 'exercise', 'training']):
            return (
                "For workout advice, I recommend focusing on compound exercises like "
                "squats, deadlifts, bench press, and rows. Start with weights you can "
                "control with good form, and progressively increase over time. "
                "Aim for 3-4 training days per week for most goals."
            )

        if any(word in message_lower for word in ['diet', 'nutrition', 'eat', 'food', 'meal']):
            return (
                "For nutrition, focus on getting adequate protein (around 0.8-1g per pound "
                "of body weight), eating plenty of vegetables, and staying hydrated. "
                "Meal prep can help you stay consistent with your nutrition goals."
            )

        if any(word in message_lower for word in ['injury', 'pain', 'hurt']):
            return (
                "If you're experiencing pain or have an injury, I strongly recommend "
                "consulting with a healthcare professional or physiotherapist. "
                "In general, rest the affected area and avoid exercises that aggravate it. "
                "Don't push through pain - it's your body's warning signal."
            )

        if any(word in message_lower for word in ['weight loss', 'lose weight', 'fat loss']):
            return (
                "For weight loss, focus on creating a sustainable calorie deficit through "
                "a combination of nutrition and exercise. Aim for 0.5-1 pound per week for "
                "healthy, sustainable weight loss. Strength training helps preserve muscle "
                "while in a deficit."
            )

        if any(word in message_lower for word in ['muscle', 'gain', 'bulk', 'build']):
            return (
                "For muscle gain, focus on progressive overload in your training, "
                "adequate protein intake (0.8-1g per pound), and a slight calorie surplus. "
                "Recovery is crucial - make sure you're getting enough sleep and rest days."
            )

        return (
            "I'm having trouble processing your request right now. "
            "Please try again in a moment, or ask me about workouts, nutrition, "
            "or fitness goals specifically."
        )

    def pull_model(self, model_name: Optional[str] = None) -> bool:
        """
        Pull/download a model to Ollama.

        Args:
            model_name: Model to pull (defaults to configured model)

        Returns:
            True if successful
        """
        model = model_name or self.model_name

        try:
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model},
                timeout=300  # 5 minutes for download
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error pulling model: {e}")
            return False
