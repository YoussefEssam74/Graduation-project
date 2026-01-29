@echo off
REM Workout Plan Generator - Windows Environment Setup Script
REM Sets up Python environment and installs all dependencies for Windows

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Workout Plan Generator - Setup (Windows)
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.10+ from https://www.python.org
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python version: %PYTHON_VERSION%

REM Create virtual environment
echo.
echo 📦 Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ⚠️  Virtual environment already exists
)

REM Activate virtual environment
echo.
echo 🔗 Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo 📦 Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

REM Install PyTorch
echo.
echo 📦 Installing PyTorch (CPU version)...
echo    (For GPU, see setup-gpu.bat)
pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0

REM Install core dependencies
echo.
echo 📦 Installing core dependencies...
pip install --no-cache-dir ^
    transformers==4.35.0 ^
    peft==0.7.0 ^
    datasets==2.15.0 ^
    accelerate==0.25.0 ^
    bitsandbytes==0.41.0 ^
    tensorboard==2.14.0 ^
    wandb==0.16.0 ^
    scipy==1.11.4 ^
    scikit-learn==1.3.2 ^
    numpy==1.24.3 ^
    pandas==2.1.1 ^
    tqdm==4.66.1 ^
    pydantic==2.5.0 ^
    pytest==7.4.3 ^
    pytest-asyncio==0.21.1 ^
    pytest-cov==4.1.0 ^
    asyncpg==0.29.0 ^
    psycopg2-binary==2.9.9 ^
    python-dotenv==1.0.0

REM Install FastAPI dependencies
echo.
echo 📦 Installing FastAPI dependencies...
pip install --no-cache-dir ^
    fastapi==0.104.1 ^
    uvicorn[standard]==0.24.0 ^
    python-multipart==0.0.6 ^
    httpx==0.25.1

REM Verify installation
echo.
echo 🔍 Verifying installation...
python -c "import torch; print(f'✅ PyTorch {torch.__version__}')"
python -c "import transformers; print(f'✅ Transformers {transformers.__version__}')"
python -c "import peft; print(f'✅ PEFT {peft.__version__}')"
python -c "import torch; print(f'✅ CUDA available: {torch.cuda.is_available()}')"

if errorlevel 1 (
    echo ❌ Verification failed. Check installation.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo ✅ Setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Keep this terminal open (venv is active)
echo 2. Generate data: python train.py --generate-data 5000
echo 3. Start training: python train.py --epochs 5
echo.
echo To reactivate venv in new terminal:
echo   venv\Scripts\activate.bat
echo.
echo For GPU acceleration (NVIDIA):
echo   1. Install CUDA: https://developer.nvidia.com/cuda-downloads
echo   2. Install cuDNN: https://developer.nvidia.com/cudnn
echo   3. Run: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
echo.
pause
