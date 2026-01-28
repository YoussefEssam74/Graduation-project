"""
Mock Embedding Server - For testing without ML dependencies
Provides the same API endpoints as the real embedding server
but returns mock data for development and testing.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# Mock knowledge base
MOCK_KNOWLEDGE = [
    {
        "id": 1,
        "content": "For beginners, start with compound exercises like squats, bench press, and deadlifts. Focus on learning proper form before adding weight.",
        "category": "beginner_training",
        "similarity": 0.92
    },
    {
        "id": 2,
        "content": "Progressive overload is key to muscle growth. Gradually increase weight, reps, or sets over time to continue making gains.",
        "category": "muscle_building",
        "similarity": 0.88
    },
    {
        "id": 3,
        "content": "For weight loss, combine resistance training with cardio. A caloric deficit is essential, but maintain protein intake to preserve muscle mass.",
        "category": "weight_loss",
        "similarity": 0.85
    },
    {
        "id": 4,
        "content": "Rest and recovery are as important as training. Aim for 7-9 hours of sleep and take 1-2 rest days per week.",
        "category": "recovery",
        "similarity": 0.78
    }
]

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "server": "mock_embedding_server",
        "model": "mock-all-MiniLM-L6-v2",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@app.route('/knowledge/search', methods=['POST'])
@app.route('/search', methods=['POST'])
def search():
    """Mock knowledge base search"""
    data = request.get_json(silent=True) or {}
    query = data.get('query', '')
    try:
        top_k = int(data.get('top_k', 5))
    except (ValueError, TypeError):
        top_k = 5
    
    # Return mock results based on keywords in query
    results = []
    for doc in MOCK_KNOWLEDGE[:top_k]:
        results.append({
            "id": doc["id"],
            "text": doc["content"],
            "category": doc["category"],
            "similarity": doc["similarity"]
        })
    
    return jsonify({
        "success": True,
        "query": query,
        "results": results,
        "total_documents": len(MOCK_KNOWLEDGE)
    })

@app.route('/embed', methods=['POST'])
def embed():
    """Mock embedding generation"""
    data = request.get_json(silent=True) or {}
    text = data.get('text', '')
    
    # Return mock 384-dimensional embedding
    mock_embedding = [0.1] * 384
    
    return jsonify({
        "success": True,
        "text": text[:100],
        "embedding": mock_embedding,
        "dimension": 384
    })

@app.route('/context', methods=['POST'])
def build_context():
    """Build workout context from knowledge base"""
    data = request.get_json(silent=True) or {}
    fitness_level = data.get('fitness_level', 'Beginner')
    goal = data.get('goal', 'muscle gain')
    injuries = data.get('injuries', [])
    weak_muscles = data.get('weak_muscles', [])
    
    # Build context string
    context_parts = [
        f"Training for {fitness_level.lower()} level user with goal: {goal}.",
        MOCK_KNOWLEDGE[0]["content"],
        MOCK_KNOWLEDGE[1]["content"]
    ]
    
    if injuries:
        context_parts.append(f"Note: User has reported injuries: {', '.join(injuries)}. Modify exercises accordingly.")
    
    if weak_muscles:
        context_parts.append(f"Focus areas for improvement: {', '.join(weak_muscles)}.")
    
    return jsonify({
        "success": True,
        "context": " ".join(context_parts),
        "sources": [doc["id"] for doc in MOCK_KNOWLEDGE[:2]],
        "fitness_level": fitness_level
    })

@app.route('/knowledge/stats', methods=['GET'])
@app.route('/stats', methods=['GET'])
def stats():
    """Return knowledge base statistics"""
    return jsonify({
        "total_documents": len(MOCK_KNOWLEDGE),
        "by_category": {"beginner_training": 1, "muscle_building": 1, "weight_loss": 1, "recovery": 1},
        "last_updated": datetime.datetime.utcnow().isoformat(),
        "categories": list(set(d["category"] for d in MOCK_KNOWLEDGE)),
        "embedding_dimension": 384,
        "model": "mock-all-MiniLM-L6-v2"
    })

if __name__ == '__main__':
    print("=" * 60)
    print("MOCK Embedding Server (for development/testing)")
    print("=" * 60)
    print("Endpoints:")
    print("  GET  /health  - Health check")
    print("  POST /search  - Search knowledge base")
    print("  POST /embed   - Generate embeddings")
    print("  POST /context - Build workout context")
    print("  GET  /stats   - Knowledge base statistics")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5100, debug=True)
