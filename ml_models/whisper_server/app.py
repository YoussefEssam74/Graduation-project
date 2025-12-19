from flask import Flask, request, jsonify
import whisper
import tempfile
import os

app = Flask(__name__)

# Load Whisper model (base = 140MB, good balance)
# In production, cache this model or load from local volume
print("Loading Whisper model...")
try:
    model = whisper.load_model("base")
    print("Whisper model loaded.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    model = None

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500
        
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    audio_file = request.files['audio']
    language = request.form.get('language', 'en')
    
    # Save to temp file
    suffix = os.path.splitext(audio_file.filename)[1]
    if not suffix:
        suffix = ".webm" # Default
        
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name
    
    try:
        result = model.transcribe(tmp_path, language=language)
        return jsonify({'text': result['text'], 'language': result['language']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
