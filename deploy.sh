#!/bin/bash

# LegalEase Google Cloud Deployment Script
# This script deploys the entire LegalEase application to Google Cloud

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed and authenticated
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "No active gcloud authentication found. Please run: gcloud auth login"
        exit 1
    fi
    
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project selected. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    print_success "Prerequisites check passed. Project: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable aiplatform.googleapis.com
    gcloud services enable vision.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    
    print_success "APIs enabled successfully"
}

# Create Cloud Storage bucket for frontend
create_storage_bucket() {
    print_status "Creating Cloud Storage bucket for frontend..."
    
    BUCKET_NAME="${PROJECT_ID}-legalease-frontend"
    
    # Check if bucket exists
    if gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
        print_warning "Bucket gs://$BUCKET_NAME already exists"
    else
        gsutil mb gs://$BUCKET_NAME
        print_success "Bucket created: gs://$BUCKET_NAME"
    fi
    
    # Make bucket publicly readable
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    print_success "Bucket made publicly readable"
}

# Deploy backend using Cloud Build
deploy_backend() {
    print_status "Deploying backend to Cloud Run..."
    
    # Submit build
    gcloud builds submit --config cloudbuild.yaml .
    
    print_success "Backend deployed successfully"
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe legalease-backend --platform=managed --region=us-central1 --format="value(status.url)")
    
    if [ -z "$BACKEND_URL" ]; then
        print_error "Could not get backend URL. Please check if backend deployment was successful."
        exit 1
    fi
    
    print_status "Backend URL: $BACKEND_URL"
    
    # Build frontend
    cd frontend
    VITE_API_URL=$BACKEND_URL npm run build
    
    # Deploy to Cloud Storage
    BUCKET_NAME="${PROJECT_ID}-legalease-frontend"
    gsutil -m cp -r dist/* gs://$BUCKET_NAME/
    gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME/
    
    cd ..
    
    print_success "Frontend deployed successfully"
    print_success "Frontend URL: https://storage.googleapis.com/$BUCKET_NAME/index.html"
}

# Create environment configuration
create_env_config() {
    print_status "Creating environment configuration..."
    
    # Create .env file for local development
    cat > .env << EOF
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1

# Backend Configuration
ALLOWED_ORIGINS=*
MOCK_AI=true

# Frontend Configuration
VITE_API_URL=https://legalease-backend-$PROJECT_ID-uc.a.run.app
EOF
    
    print_success "Environment configuration created"
}

# Main deployment function
main() {
    print_status "Starting LegalEase deployment to Google Cloud..."
    
    check_prerequisites
    enable_apis
    create_storage_bucket
    deploy_backend
    deploy_frontend
    create_env_config
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your LegalEase application is now live:"
    echo "  Frontend: https://storage.googleapis.com/${PROJECT_ID}-legalease-frontend/index.html"
    echo "  Backend API: https://legalease-backend-${PROJECT_ID}-uc.a.run.app"
    echo ""
    print_status "To enable real AI features:"
    echo "  1. Set up Google Cloud service account with Vertex AI access"
    echo "  2. Update Cloud Run service with environment variables:"
    echo "     - MOCK_AI=false"
    echo "     - GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
    echo "     - GOOGLE_CLOUD_LOCATION=us-central1"
    echo "  3. Or use GEMINI_API_KEY for direct API access"
    echo ""
    print_status "To update the deployment, simply run this script again."
}

# Run main function
main "$@"
