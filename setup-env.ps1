# LegalEase Environment Setup Script
# This script helps configure environment variables for Google Cloud deployment

param(
    [string]$ProjectId = "",
    [string]$GeminiApiKey = "",
    [switch]$EnableRealAI = $false,
    [switch]$EnableOCR = $false
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

# Get project ID
if (-not $ProjectId) {
    $ProjectId = gcloud config get-value project 2>$null
    if (-not $ProjectId) {
        Write-Error "No project ID provided and no default project set. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
}

Write-Status "Setting up environment for project: $ProjectId"

# Create .env file for local development
$envContent = @"
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$ProjectId
GOOGLE_CLOUD_LOCATION=us-central1

# Backend Configuration
ALLOWED_ORIGINS=*
MOCK_AI=$(-not $EnableRealAI)

# Frontend Configuration
VITE_API_URL=https://legalease-backend-$ProjectId-uc.a.run.app
"@

# Add AI configuration if real AI is enabled
if ($EnableRealAI) {
    if ($GeminiApiKey) {
        $envContent += "`n# AI Configuration`nGEMINI_API_KEY=$GeminiApiKey"
    } else {
        $envContent += "`n# AI Configuration`n# GEMINI_API_KEY=your_gemini_api_key_here"
    }
}

# Add OCR configuration if enabled
if ($EnableOCR) {
    $envContent += "`n# OCR Configuration`nUSE_CLOUD_OCR=true`nUSE_GEMINI_OCR=true"
}

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Success "Created .env file for local development"

# Create Cloud Run environment variables
$cloudRunEnvVars = @(
    "ALLOWED_ORIGINS=*",
    "GOOGLE_CLOUD_PROJECT=$ProjectId",
    "GOOGLE_CLOUD_LOCATION=us-central1"
)

if ($EnableRealAI) {
    $cloudRunEnvVars += "MOCK_AI=false"
    if ($GeminiApiKey) {
        $cloudRunEnvVars += "GEMINI_API_KEY=$GeminiApiKey"
    }
} else {
    $cloudRunEnvVars += "MOCK_AI=true"
}

if ($EnableOCR) {
    $cloudRunEnvVars += "USE_CLOUD_OCR=true"
    $cloudRunEnvVars += "USE_GEMINI_OCR=true"
}

Write-Status "Cloud Run environment variables:"
foreach ($envVar in $cloudRunEnvVars) {
    Write-Host "  $envVar"
}

Write-Status "To update Cloud Run service with these variables, run:"
Write-Host "gcloud run services update legalease-backend --region=us-central1 --set-env-vars=`"$($cloudRunEnvVars -join ',' -replace '=', '=')`""

Write-Success "Environment setup completed!"
Write-Host ""
Write-Status "Next steps:"
Write-Host "1. Run the deployment script: .\deploy.ps1"
Write-Host "2. Or manually deploy using the commands in GOOGLE_CLOUD_DEPLOYMENT.md"
if ($EnableRealAI -and -not $GeminiApiKey) {
    Write-Host "3. Add your Gemini API key to the Cloud Run service after deployment"
}
