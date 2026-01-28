"""
Mock Vision Server - For testing without CLIP model
Provides the same API endpoints as the real vision server
but returns mock analysis data for development and testing.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import random

app = Flask(__name__)
CORS(app)

# Mock muscle analysis results
MOCK_ANALYSES = {
    "chest": {
        "status": "developed",
        "confidence": 0.78,
        "all_scores": {"undeveloped": 0.12, "developing": 0.10, "developed": 0.78}
    },
    "arms": {
        "status": "developing",
        "confidence": 0.65,
        "all_scores": {"undeveloped": 0.20, "developing": 0.65, "developed": 0.15}
    },
    "shoulders": {
        "status": "developed",
        "confidence": 0.72,
        "all_scores": {"undeveloped": 0.08, "developing": 0.20, "developed": 0.72}
    },
    "body_composition": {
        "status": "athletic",
        "confidence": 0.81,
        "all_scores": {"skinny": 0.05, "average": 0.14, "athletic": 0.81}
    }
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "server": "mock_vision_server",
        "model": "mock-openai/clip-vit-base-patch32",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze uploaded body image (mock)"""
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No file selected"}), 400
    
    # Return mock analysis
    return create_mock_analysis()

@app.route('/analyze-base64', methods=['POST'])
def analyze_base64():
    """Analyze base64-encoded image (mock)"""
    data = request.json
    if not data or 'image_base64' not in data:
        return jsonify({"success": False, "error": "No image_base64 provided"}), 400
    
    # Return mock analysis
    return create_mock_analysis()

def create_mock_analysis():
    """Generate mock analysis result"""
    # Randomly determine weak muscles for variety
    weak_muscles = []
    if random.random() < 0.5:
        weak_muscles.append("arms")
    if random.random() < 0.3:
        weak_muscles.append("chest")
    if random.random() < 0.4:
        weak_muscles.append("shoulders")
    
    if not weak_muscles:
        weak_muscles = ["arms"]  # Default to avoid empty
    
    suggestions = []
    if "arms" in weak_muscles:
        suggestions.append("Add bicep curls and tricep extensions to your routine")
    if "chest" in weak_muscles:
        suggestions.append("Include more pressing movements like bench press and push-ups")
    if "shoulders" in weak_muscles:
        suggestions.append("Focus on overhead press and lateral raises")
    
    return jsonify({
        "success": True,
        "chest": MOCK_ANALYSES["chest"],
        "arms": MOCK_ANALYSES["arms"],
        "shoulders": MOCK_ANALYSES["shoulders"],
        "body_composition": MOCK_ANALYSES["body_composition"],
        "weak_muscles": weak_muscles,
        "overall_confidence": 0.74,
        "is_reliable": True,
        "suggestions": suggestions
    })

if __name__ == '__main__':
    print("=" * 60)
    print("MOCK Vision Server (for development/testing)")
    print("=" * 60)
    print("Endpoints:")
    print("  GET  /health        - Health check")
    print("  POST /analyze       - Analyze uploaded image")
    print("  POST /analyze-base64 - Analyze base64 image")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5200, debug=True)
