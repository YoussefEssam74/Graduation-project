"""
Coach Assistant Flask Application
=================================

REST API for AI-powered fitness coaching chat.
Uses Ollama + Phi-3 Mini for natural language responses.

Endpoints:
    POST /chat - Chat with the AI coach
    POST /analyze - Analyze user's progress
    GET /health - Health check

Port: 5012 (configured in config.yaml)
"""

from .rag_retriever import KnowledgeRAG
from .context_builder import ContextBuilder
from .ollama_client import OllamaClient
from safety import SafetyFilter
import os
import sys
import logging
from flask import Flask, request, jsonify
import yaml

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load configuration
config_path = os.path.join(os.path.dirname(
    os.path.dirname(__file__)), 'config.yaml')
with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

# Initialize components
ollama_client = OllamaClient(config)
context_builder = ContextBuilder(config)
knowledge_rag = KnowledgeRAG(config)


@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat with the AI fitness coach.

    Request Body:
        {
            "message": str,           # User's message
            "user_context": {         # Optional user profile
                "name": str,
                "age": int,
                "weight": float,
                "height": float,
                "fitness_level": str,
                "goal": str,
                "injuries": [str],
                "allergies": [str]
            },
            "conversation_history": [  # Optional previous messages
                {"role": "user", "content": str},
                {"role": "assistant", "content": str}
            ]
        }

    Response:
        {
            "status": "success",
            "response": str,
            "context_used": bool
        }
    """
    try:
        data = request.json

        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        user_message = data['message']
        user_context = data.get('user_context', {})
        conversation_history = data.get('conversation_history', [])

        # Build context for the LLM
        system_context = context_builder.build_system_context(user_context)

        # Get relevant knowledge from RAG (if available)
        rag_context = ""
        if knowledge_rag.is_ready():
            relevant_docs = knowledge_rag.search(user_message, top_k=3)
            if relevant_docs:
                rag_context = context_builder.format_rag_context(relevant_docs)

        # Combine contexts
        full_context = system_context
        if rag_context:
            full_context += f"\n\nRelevant Information:\n{rag_context}"

        # Generate response using Ollama
        response = ollama_client.generate_response(
            message=user_message,
            system_context=full_context,
            conversation_history=conversation_history
        )

        return jsonify({
            'status': 'success',
            'response': response,
            'context_used': bool(user_context),
            'rag_used': bool(rag_context)
        })

    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/analyze', methods=['POST'])
def analyze_progress():
    """
    Analyze user's fitness progress and provide insights.

    Request Body:
        {
            "user_id": int,
            "user_context": {...},
            "workout_history": [...],  # Recent workouts
            "nutrition_history": [...] # Recent meals
        }

    Response:
        {
            "status": "success",
            "analysis": str,
            "recommendations": [str]
        }
    """
    try:
        data = request.json or {}

        user_context = data.get('user_context', {})
        workout_history = data.get('workout_history', [])
        nutrition_history = data.get('nutrition_history', [])

        # Build analysis prompt
        analysis_prompt = context_builder.build_analysis_prompt(
            user_context=user_context,
            workout_history=workout_history,
            nutrition_history=nutrition_history
        )

        # Generate analysis using Ollama
        response = ollama_client.generate_response(
            message=analysis_prompt,
            system_context="You are an expert fitness analyst. Provide constructive, actionable feedback.",
            conversation_history=[]
        )

        return jsonify({
            'status': 'success',
            'analysis': response
        })

    except Exception as e:
        logger.error(f"Error in analysis: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    ollama_status = ollama_client.check_health()

    return jsonify({
        'status': 'healthy' if ollama_status else 'degraded',
        'service': 'coach_assistant',
        'ollama_connected': ollama_status,
        'model': ollama_client.model_name,
        'rag_ready': knowledge_rag.is_ready()
    })


@app.route('/models', methods=['GET'])
def list_models():
    """List available Ollama models."""
    try:
        models = ollama_client.list_models()
        return jsonify({
            'status': 'success',
            'models': models,
            'current_model': ollama_client.model_name
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = config.get('services', {}).get(
        'coach_assistant', {}).get('port', 5012)
    host = config.get('services', {}).get(
        'coach_assistant', {}).get('host', '0.0.0.0')

    logger.info(f"Starting Coach Assistant on {host}:{port}")
    app.run(host=host, port=port, debug=config.get(
        'development', {}).get('debug_mode', False))
