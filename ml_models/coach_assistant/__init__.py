# Coach Assistant Module for PulseGym AI
# Uses Ollama + Phi-3 Mini for natural language chat

from .app import app
from .ollama_client import OllamaClient
from .context_builder import ContextBuilder

__all__ = ['app', 'OllamaClient', 'ContextBuilder']
