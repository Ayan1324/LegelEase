# LegalEase Frontend Deployment Script
# This script builds the frontend locally and deploys it to Cloud Storage

param(
    [string]$BackendUrl = "",
    [string]$ProjectId = ""
)

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Get project ID if not provided
if (-not $ProjectId) {
    $ProjectId = gcloud config get-value project 2>$null
    if (-not $ProjectId) {
        Write-Error "No project ID provided and no default project set. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
}

# Get backend URL if not provided
if (-not $BackendUrl) {
    $BackendUrl = gcloud run services describe legalease-backend --platform=managed --region=us-central1 --format="value(status.url)" 2>$null
    if (-not $BackendUrl) {
        Write-Error "Could not get backend URL. Please make sure the backend is deployed first."
        exit 1
    }
}

Write-Status "Project ID: $ProjectId"
Write-Status "Backend URL: $BackendUrl"

# Create storage bucket if it doesn't exist
$BUCKET_NAME = "$ProjectId-legalease-frontend"
Write-Status "Creating storage bucket: gs://$BUCKET_NAME"

$bucketExists = gsutil ls -b gs://$BUCKET_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    gsutil mb gs://$BUCKET_NAME
    Write-Success "Bucket created: gs://$BUCKET_NAME"
} else {
    Write-Status "Bucket already exists: gs://$BUCKET_NAME"
}

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
Write-Success "Bucket made publicly readable"

# Build frontend
Write-Status "Building frontend..."
Push-Location frontend
try {
    # Install dependencies
    Write-Status "Installing dependencies..."
    npm install
    
    # Build with backend URL
    Write-Status "Building with backend URL: $BackendUrl"
    $env:VITE_API_URL = $BackendUrl
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    Write-Success "Frontend built successfully"
    
    # Deploy to Cloud Storage
    Write-Status "Deploying to Cloud Storage..."
    gsutil -m cp -r dist/* gs://$BUCKET_NAME/
    gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME/
    
    Write-Success "Frontend deployed successfully!"
    Write-Success "Frontend URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
}
finally {
    Pop-Location
}

Write-Success "🎉 Frontend deployment completed!"
Write-Host ""
Write-Status "Your LegalEase application is now live:"
Write-Host "  Frontend: https://storage.googleapis.com/$BUCKET_NAME/index.html"
Write-Host "  Backend API: $BackendUrl"
