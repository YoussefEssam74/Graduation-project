from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from typing import List, Dict
import os

app = Flask(__name__)

# Model config
MODEL_PATH = os.environ.get("MODEL_PATH", "./models/intellifit-llama-3b")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class FitnessCoachModel:
    def __init__(self, model_path: str):
        print(f"Loading model from {model_path} on {DEVICE}...")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
                device_map="auto"
            )
            self.model.eval()
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            # Fallback for when model files aren't physically present yet
            self.model = None
            self.tokenizer = None
    
    def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        user_context: Dict = None,
        max_tokens: int = 512
    ) -> str:
        if not self.model:
            return "Error: Model not loaded. Please ensure model files are present."

        # Build system prompt with user context
        system_prompt = self._build_system_prompt(user_context)
        # Convert simplistic message format to chat template manually if needed, 
        # but apply_chat_template handles list of dicts: [{'role': 'user', 'content': '...'}]
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        
        # Apply chat template
        prompt = self.tokenizer.apply_chat_template(
            full_messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # Generate
        inputs = self.tokenizer(prompt, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                do_sample=True
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Naive parsing: ideally the template handles this, but we often get the full text back
        if "assistant\n" in response:
            response = response.split("assistant\n")[-1].strip()
        
        return response
    
    def _build_system_prompt(self, user_context: Dict) -> str:
        if not user_context:
            return "You are an expert fitness coach assistant."
        
        return f"""You are an expert fitness coach for {user_context.get('name', 'the user')}.

User Profile:
- Age: {user_context.get('age')} years
- Weight: {user_context.get('weight')} kg
- Height: {user_context.get('height')} cm
- Fitness Level: {user_context.get('fitness_level')}
- Goal: {user_context.get('fitness_goal')}
- Medical Conditions/Injuries: {user_context.get('medical_conditions', 'None')}

**CRITICAL INSTRUCTIONS:**
1. **Safety First**: Always check the 'Medical Conditions/Injuries' field. If the user has an injury (e.g., 'knee injury'), YOU MUST modify your advice to avoid aggravating it.
   - Example directly from the user: "I have a knee injury." -> Response: "Understood. We will avoid squats and lunges. Let's focus on low-impact exercises like swimming or upper body work."
2. **Empathetic Tone**: Be supportive and human-like. Use phrases like "I hear you," "That must be tough," or "Let's work around that together."
3. **Scientific Accuracy**: Provide evidence-based advice but keep it accessible.

Provide personalized, motivating, and scientifically accurate fitness coaching that accounts for their specific health needs."""

# Initialize model
# Note: In a real deploy, we'd wait for model files. For now, we initialize wrapper.
coach_model = FitnessCoachModel(MODEL_PATH)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])
    user_context = data.get('user_context', {})
    
    try:
        response = coach_model.generate_response(messages, user_context)
        return jsonify({'response': response, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'device': DEVICE})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
