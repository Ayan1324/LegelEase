# LegalEase Google Cloud Deployment Script (PowerShell)
# This script deploys the entire LegalEase application to Google Cloud

param(
    [string]$ProjectId = "",
    [switch]$SkipPrerequisites = $false
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if gcloud is installed and authenticated
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    try {
        $gcloudVersion = gcloud version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "gcloud CLI not found"
        }
    }
    catch {
        Write-Error "gcloud CLI is not installed. Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    }
    
    try {
        $authList = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
        if (-not $authList) {
            throw "No active authentication"
        }
    }
    catch {
        Write-Error "No active gcloud authentication found. Please run: gcloud auth login"
        exit 1
    }
    
    if ($ProjectId) {
        gcloud config set project $ProjectId
    }
    
    $script:PROJECT_ID = gcloud config get-value project 2>$null
    if (-not $PROJECT_ID) {
        Write-Error "No project selected. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
    
    Write-Success "Prerequisites check passed. Project: $PROJECT_ID"
}

# Enable required APIs
function Enable-APIs {
    Write-Status "Enabling required Google Cloud APIs..."
    
    $apis = @(
        "cloudbuild.googleapis.com",
        "run.googleapis.com",
        "storage.googleapis.com",
        "aiplatform.googleapis.com",
        "vision.googleapis.com",
        "secretmanager.googleapis.com"
    )
    
    foreach ($api in $apis) {
        gcloud services enable $api
    }
    
    Write-Success "APIs enabled successfully"
}

# Create Cloud Storage bucket for frontend
function New-StorageBucket {
    Write-Status "Creating Cloud Storage bucket for frontend..."
    
    $BUCKET_NAME = "$PROJECT_ID-legalease-frontend"
    
    # Check if bucket exists
    $bucketExists = gsutil ls -b gs://$BUCKET_NAME 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "Bucket gs://$BUCKET_NAME already exists"
    } else {
        gsutil mb gs://$BUCKET_NAME
        Write-Success "Bucket created: gs://$BUCKET_NAME"
    }
    
    # Make bucket publicly readable
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    Write-Success "Bucket made publicly readable"
}

# Deploy backend using Cloud Build
function Deploy-Backend {
    Write-Status "Deploying backend to Cloud Run..."
    
    # Submit build
    gcloud builds submit --config cloudbuild.yaml .
    
    Write-Success "Backend deployed successfully"
}

# Build and deploy frontend
function Deploy-Frontend {
    Write-Status "Building and deploying frontend..."
    
    # Get backend URL
    $BACKEND_URL = gcloud run services describe legalease-backend --platform=managed --region=us-central1 --format="value(status.url)" 2>$null
    
    if (-not $BACKEND_URL) {
        Write-Error "Could not get backend URL. Please check if backend deployment was successful."
        exit 1
    }
    
    Write-Status "Backend URL: $BACKEND_URL"
    
    # Build frontend
    Push-Location frontend
    try {
        $env:VITE_API_URL = $BACKEND_URL
        npm run build
        
        # Deploy to Cloud Storage
        $BUCKET_NAME = "$PROJECT_ID-legalease-frontend"
        gsutil -m cp -r dist/* gs://$BUCKET_NAME/
        gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME/
        
        Write-Success "Frontend deployed successfully"
        Write-Success "Frontend URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
    }
    finally {
        Pop-Location
    }
}

# Create environment configuration
function New-EnvConfig {
    Write-Status "Creating environment configuration..."
    
    # Create .env file for local development
    $envContent = @"
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1

# Backend Configuration
ALLOWED_ORIGINS=*
MOCK_AI=true

# Frontend Configuration
VITE_API_URL=https://legalease-backend-$PROJECT_ID-uc.a.run.app
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Success "Environment configuration created"
}

# Main deployment function
function Start-Deployment {
    Write-Status "Starting LegalEase deployment to Google Cloud..."
    
    Test-Prerequisites
    Enable-APIs
    New-StorageBucket
    Deploy-Backend
    Deploy-Frontend
    New-EnvConfig
    
    Write-Success "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Status "Your LegalEase application is now live:"
    Write-Host "  Frontend: https://storage.googleapis.com/$PROJECT_ID-legalease-frontend/index.html"
    Write-Host "  Backend API: https://legalease-backend-$PROJECT_ID-uc.a.run.app"
    Write-Host ""
    Write-Status "To enable real AI features:"
    Write-Host "  1. Set up Google Cloud service account with Vertex AI access"
    Write-Host "  2. Update Cloud Run service with environment variables:"
    Write-Host "     - MOCK_AI=false"
    Write-Host "     - GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
    Write-Host "     - GOOGLE_CLOUD_LOCATION=us-central1"
    Write-Host "  3. Or use GEMINI_API_KEY for direct API access"
    Write-Host ""
    Write-Status "To update the deployment, simply run this script again."
}

# Run main function
Start-Deployment
