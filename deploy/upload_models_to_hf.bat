@echo off
REM ============================================================================
REM IntelliFit — Upload Model Weights to Hugging Face Hub
REM ============================================================================
REM Prerequisites:
REM   1. pip install huggingface_hub
REM   2. huggingface-cli login (paste your HF token)
REM   3. Update the REPO variables below with your HF username
REM ============================================================================

setlocal

REM ── Configuration (CHANGE THESE) ──────────────────────────────────────────
set HF_USER=youssefeemad
set WORKOUT_REPO=%HF_USER%/intellifit-workout-v3
set NUTRITION_REPO=%HF_USER%/intellifit-nutrition-v1
set NUTRITION_DATA_REPO=%HF_USER%/intellifit-nutrition-data

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

echo ========================================
echo   IntelliFit — Model Upload to HF Hub
echo ========================================
echo.

REM ── Step 1: Upload Workout LoRA Adapter ────────────────────────────────────
echo [1/3] Uploading Workout LoRA adapter to %WORKOUT_REPO%...
echo       Source: ml_models\Workout-Plan_Generating\models\workout-generator-v3
echo.

python -m huggingface_hub.commands.huggingface_cli upload %WORKOUT_REPO% ^
    "%PROJECT_ROOT%\ml_models\Workout-Plan_Generating\models\workout-generator-v3" ^
    --repo-type model

if %errorlevel% neq 0 (
    echo ERROR: Failed to upload workout model. Check your HF token and repo name.
    pause
    exit /b 1
)
echo       Done!
echo.

REM ── Step 2: Upload Nutrition QLoRA Adapter ─────────────────────────────────
echo [2/3] Uploading Nutrition QLoRA adapter to %NUTRITION_REPO%...
echo       Source: ml_models\Nutrition-Plan_Generating\checkpoint_to_resume (1)\checkpoint-2412
echo.

huggingface-cli upload %NUTRITION_REPO% ^
    "%PROJECT_ROOT%\ml_models\Nutrition-Plan_Generating\checkpoint_to_resume (1)\checkpoint-2412" ^
    --repo-type model --private

if %errorlevel% neq 0 (
    echo ERROR: Failed to upload nutrition model. Check your HF token and repo name.
    pause
    exit /b 1
)
echo       Done!
echo.

REM ── Step 3: Upload Nutrition Data Files ────────────────────────────────────
echo [3/3] Uploading nutrition data files to %NUTRITION_DATA_REPO%...

REM Create a temp directory with just the data files
set TEMP_DATA=%PROJECT_ROOT%\deploy\_temp_nutrition_data
mkdir "%TEMP_DATA%" 2>nul
copy "%PROJECT_ROOT%\ml_models\Nutrition-Plan_Generating\disease_rules.json" "%TEMP_DATA%\"
copy "%PROJECT_ROOT%\ml_models\Nutrition-Plan_Generating\allergen_taxonomy.json" "%TEMP_DATA%\"

REM Note: food_db_halal.json is ~46MB — may take a while to upload
copy "%PROJECT_ROOT%\ml_models\Nutrition-Plan_Generating\food_db_halal.json" "%TEMP_DATA%\"

huggingface-cli upload %NUTRITION_DATA_REPO% ^
    "%TEMP_DATA%" ^
    --repo-type dataset --private

if %errorlevel% neq 0 (
    echo ERROR: Failed to upload nutrition data. Check your HF token and repo name.
    rmdir /s /q "%TEMP_DATA%" 2>nul
    pause
    exit /b 1
)

rmdir /s /q "%TEMP_DATA%" 2>nul
echo       Done!
echo.

echo ========================================
echo   All uploads complete!
echo ========================================
echo.
echo   Workout Model:  https://huggingface.co/%WORKOUT_REPO%
echo   Nutrition Model: https://huggingface.co/%NUTRITION_REPO%
echo   Nutrition Data:  https://huggingface.co/datasets/%NUTRITION_DATA_REPO%
echo.
echo   Next steps:
echo     1. Create HF Spaces and upload the deploy/ folder contents
echo     2. Set Space Secrets (HF_TOKEN, MODEL_REPO, etc.)
echo     3. Deploy backend to Render
echo     4. Deploy frontend to Vercel
echo.
pause
