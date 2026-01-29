#!/bin/bash

# Workout Plan Generator - Environment Setup Script
# Sets up Python environment and installs all dependencies

set -e  # Exit on error

echo "🚀 Workout Plan Generator - Environment Setup"
echo "=============================================="

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.10 or later."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python version: $PYTHON_VERSION"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "⚠️  Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "🔗 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install PyTorch
echo ""
echo "📦 Installing PyTorch..."
# For GPU (CUDA 11.8):
# pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118
# For CPU:
pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0

# Install core dependencies
echo ""
echo "📦 Installing core dependencies..."
pip install --no-cache-dir \
    transformers==4.35.0 \
    peft==0.7.0 \
    datasets==2.15.0 \
    accelerate==0.25.0 \
    bitsandbytes==0.41.0 \
    tensorboard==2.14.0 \
    wandb==0.16.0 \
    scipy==1.11.4 \
    scikit-learn==1.3.2 \
    numpy==1.24.3 \
    pandas==2.1.1 \
    tqdm==4.66.1 \
    pydantic==2.5.0 \
    pytest==7.4.3 \
    pytest-asyncio==0.21.1 \
    pytest-cov==4.1.0 \
    asyncpg==0.29.0 \
    psycopg2-binary==2.9.9 \
    python-dotenv==1.0.0

# Install FastAPI dependencies (if setting up inference service)
echo ""
echo "📦 Installing FastAPI dependencies..."
pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    python-multipart==0.0.6 \
    httpx==0.25.1

# Verify installation
echo ""
echo "🔍 Verifying installation..."
python -c "import torch; print(f'✅ PyTorch {torch.__version__}')"
python -c "import transformers; print(f'✅ Transformers {transformers.__version__}')"
python -c "import peft; print(f'✅ PEFT {peft.__version__}')"
python -c "import torch; print(f'✅ CUDA available: {torch.cuda.is_available()}')"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Setup complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Activate venv: source venv/bin/activate"
    echo "2. Generate data: python train.py --generate-data 5000"
    echo "3. Start training: python train.py --epochs 5"
    echo ""
    echo "For GPU acceleration:"
    echo "  Install CUDA: https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html"
    echo "  Install cuDNN: https://developer.nvidia.com/cudnn"
    echo ""
else
    echo "❌ Verification failed. Check installation."
    exit 1
fi
