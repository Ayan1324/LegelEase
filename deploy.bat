@echo off
REM LegalEase Google Cloud Deployment Script (Windows CMD)
REM This script deploys the entire LegalEase application to Google Cloud

echo [INFO] Starting LegalEase deployment to Google Cloud...

REM Check if gcloud is installed
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] gcloud CLI is not installed. Please install it from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No active gcloud authentication found. Please run: gcloud auth login
    pause
    exit /b 1
)

REM Get project ID
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT_ID=%%i
if "%PROJECT_ID%"=="" (
    echo [ERROR] No project selected. Please run: gcloud config set project YOUR_PROJECT_ID
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed. Project: %PROJECT_ID%

REM Enable required APIs
echo [INFO] Enabling required Google Cloud APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable secretmanager.googleapis.com
echo [SUCCESS] APIs enabled successfully

REM Create Cloud Storage bucket for frontend
echo [INFO] Creating Cloud Storage bucket for frontend...
set BUCKET_NAME=%PROJECT_ID%-legalease-frontend
gsutil ls -b gs://%BUCKET_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    gsutil mb gs://%BUCKET_NAME%
    echo [SUCCESS] Bucket created: gs://%BUCKET_NAME%
) else (
    echo [WARNING] Bucket gs://%BUCKET_NAME% already exists
)

REM Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://%BUCKET_NAME%
echo [SUCCESS] Bucket made publicly readable

REM Deploy backend using Cloud Build
echo [INFO] Deploying backend to Cloud Run...
gcloud builds submit --config cloudbuild.yaml .
if %errorlevel% neq 0 (
    echo [ERROR] Backend deployment failed
    pause
    exit /b 1
)
echo [SUCCESS] Backend deployed successfully

REM Get backend URL
echo [INFO] Getting backend URL...
for /f "tokens=*" %%i in ('gcloud run services describe legalease-backend --platform=managed --region=us-central1 --format="value(status.url)" 2^>nul') do set BACKEND_URL=%%i
if "%BACKEND_URL%"=="" (
    echo [ERROR] Could not get backend URL. Please check if backend deployment was successful.
    pause
    exit /b 1
)
echo [INFO] Backend URL: %BACKEND_URL%

REM Build and deploy frontend
echo [INFO] Building and deploying frontend...
cd frontend
set VITE_API_URL=%BACKEND_URL%
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed
    cd ..
    pause
    exit /b 1
)

REM Deploy to Cloud Storage
gsutil -m cp -r dist/* gs://%BUCKET_NAME%/
gsutil web set -m index.html -e 404.html gs://%BUCKET_NAME%/
cd ..

echo [SUCCESS] Frontend deployed successfully
echo [SUCCESS] Frontend URL: https://storage.googleapis.com/%BUCKET_NAME%/index.html

REM Create environment configuration
echo [INFO] Creating environment configuration...
(
echo # Google Cloud Configuration
echo GOOGLE_CLOUD_PROJECT=%PROJECT_ID%
echo GOOGLE_CLOUD_LOCATION=us-central1
echo.
echo # Backend Configuration
echo ALLOWED_ORIGINS=*
echo MOCK_AI=true
echo.
echo # Frontend Configuration
echo VITE_API_URL=https://legalease-backend-%PROJECT_ID%-uc.a.run.app
) > .env

echo [SUCCESS] Environment configuration created

echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo.
echo [INFO] Your LegalEase application is now live:
echo   Frontend: https://storage.googleapis.com/%BUCKET_NAME%/index.html
echo   Backend API: https://legalease-backend-%PROJECT_ID%-uc.a.run.app
echo.
echo [INFO] To enable real AI features:
echo   1. Set up Google Cloud service account with Vertex AI access
echo   2. Update Cloud Run service with environment variables:
echo      - MOCK_AI=false
echo      - GOOGLE_CLOUD_PROJECT=%PROJECT_ID%
echo      - GOOGLE_CLOUD_LOCATION=us-central1
echo   3. Or use GEMINI_API_KEY for direct API access
echo.
echo [INFO] To update the deployment, simply run this script again.
echo.
pause
