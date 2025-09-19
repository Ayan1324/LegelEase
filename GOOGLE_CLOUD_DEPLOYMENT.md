# LegalEase Google Cloud Deployment Guide

This guide will help you deploy the entire LegalEase application to Google Cloud Platform using Cloud Run for the backend and Cloud Storage for the frontend.

## 🚀 Quick Deployment

### Prerequisites

1. **Google Cloud Account**: Sign up at [Google Cloud Console](https://console.cloud.google.com/)
2. **Google Cloud CLI**: Install from [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. **Node.js 18+**: For frontend building
4. **Docker**: For containerization (optional, Cloud Build handles this)

### One-Command Deployment

#### For Windows (PowerShell):
```powershell
.\deploy.ps1
```

#### For Linux/macOS (Bash):
```bash
./deploy.sh
```

### Manual Step-by-Step Deployment

#### 1. Set up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create legalease-ai --name="LegalEase AI"

# Set the project
gcloud config set project legalease-ai

# Enable billing (required for Cloud Run and other services)
# Go to: https://console.cloud.google.com/billing
```

#### 2. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### 3. Deploy Backend to Cloud Run

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml .

# Or manually:
# Build Docker image
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/legalease-backend ./backend

# Deploy to Cloud Run
gcloud run deploy legalease-backend \
  --image gcr.io/$(gcloud config get-value project)/legalease-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars ALLOWED_ORIGINS="*" \
  --set-env-vars MOCK_AI=true \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project) \
  --set-env-vars GOOGLE_CLOUD_LOCATION=us-central1
```

#### 4. Deploy Frontend to Cloud Storage

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe legalease-backend --platform=managed --region=us-central1 --format="value(status.url)")

# Create storage bucket
gsutil mb gs://$(gcloud config get-value project)-legalease-frontend

# Build frontend
cd frontend
VITE_API_URL=$BACKEND_URL npm run build

# Deploy to Cloud Storage
gsutil -m cp -r dist/* gs://$(gcloud config get-value project)-legalease-frontend/
gsutil web set -m index.html -e 404.html gs://$(gcloud config get-value project)-legalease-frontend/
gsutil iam ch allUsers:objectViewer gs://$(gcloud config get-value project)-legalease-frontend

cd ..
```

## 🔧 Configuration

### Environment Variables

The deployment uses the following environment variables:

#### Backend (Cloud Run):
- `ALLOWED_ORIGINS`: CORS origins (default: "*")
- `MOCK_AI`: Use mock AI responses (default: "true")
- `GOOGLE_CLOUD_PROJECT`: Your GCP project ID
- `GOOGLE_CLOUD_LOCATION`: GCP region (default: "us-central1")

#### Frontend (Build-time):
- `VITE_API_URL`: Backend API URL (automatically set)

### Enabling Real AI Features

To use real AI instead of mock responses:

1. **Option 1: Using Gemini API Key**
   ```bash
   gcloud run services update legalease-backend \
     --region=us-central1 \
     --set-env-vars MOCK_AI=false \
     --set-env-vars GEMINI_API_KEY=your_gemini_api_key
   ```

2. **Option 2: Using Vertex AI with Service Account**
   ```bash
   # Create service account
   gcloud iam service-accounts create legalease-ai-sa \
     --display-name="LegalEase AI Service Account"
   
   # Grant necessary permissions
   gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
     --member="serviceAccount:legalease-ai-sa@$(gcloud config get-value project).iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   # Create and download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=legalease-ai-sa@$(gcloud config get-value project).iam.gserviceaccount.com
   
   # Update Cloud Run service
   gcloud run services update legalease-backend \
     --region=us-central1 \
     --set-env-vars MOCK_AI=false \
     --set-env-vars GOOGLE_APPLICATION_CREDENTIALS=/app/key.json
   ```

### Enabling OCR Features

For image processing with OCR:

```bash
gcloud run services update legalease-backend \
  --region=us-central1 \
  --set-env-vars USE_CLOUD_OCR=true \
  --set-env-vars USE_GEMINI_OCR=true
```

## 📊 Monitoring and Logs

### View Logs
```bash
# Backend logs
gcloud logs read --service=legalease-backend --limit=50

# Cloud Build logs
gcloud builds log --stream
```

### Monitor Performance
- Go to [Cloud Run Console](https://console.cloud.google.com/run)
- Go to [Cloud Storage Console](https://console.cloud.google.com/storage)
- Go to [Cloud Build Console](https://console.cloud.google.com/cloud-build)

## 🔄 Updating the Deployment

To update your deployment:

1. **Code Changes**: Simply push to your repository and run the deployment script again
2. **Environment Variables**: Use `gcloud run services update` command
3. **Scaling**: Adjust in Cloud Run console or via CLI

```bash
# Update environment variables
gcloud run services update legalease-backend \
  --region=us-central1 \
  --set-env-vars NEW_VAR=value

# Scale the service
gcloud run services update legalease-backend \
  --region=us-central1 \
  --max-instances=20 \
  --memory=4Gi
```

## 💰 Cost Optimization

### Free Tier Usage
- **Cloud Run**: 2 million requests/month free
- **Cloud Storage**: 5GB free storage
- **Cloud Build**: 120 build-minutes/month free

### Cost-Saving Tips
1. Use `MOCK_AI=true` for development/testing
2. Set `max-instances` to limit scaling
3. Use `min-instances=0` to scale to zero when not in use
4. Monitor usage in Google Cloud Console

## 🛠 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check build logs
   gcloud builds log --stream
   
   # Test locally
   docker build -t test-backend ./backend
   ```

2. **CORS Issues**
   ```bash
   # Update CORS settings
   gcloud run services update legalease-backend \
     --region=us-central1 \
     --set-env-vars ALLOWED_ORIGINS="https://your-frontend-url.com"
   ```

3. **Frontend Not Loading**
   ```bash
   # Check bucket permissions
   gsutil iam get gs://$(gcloud config get-value project)-legalease-frontend
   
   # Re-deploy frontend
   gsutil -m cp -r frontend/dist/* gs://$(gcloud config get-value project)-legalease-frontend/
   ```

4. **AI Features Not Working**
   - Check if `MOCK_AI=false` is set
   - Verify API keys or service account permissions
   - Check Cloud Run logs for errors

### Getting Help

1. Check [Google Cloud Documentation](https://cloud.google.com/docs)
2. Review [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
3. Check application logs in Cloud Console

## 🔐 Security Considerations

1. **API Keys**: Store sensitive keys in Secret Manager
2. **CORS**: Restrict `ALLOWED_ORIGINS` to your domain
3. **Authentication**: Consider adding authentication for production
4. **HTTPS**: All traffic is automatically HTTPS

## 📈 Scaling

The deployment is configured for automatic scaling:
- **Min instances**: 0 (scales to zero when not used)
- **Max instances**: 10 (adjust based on needs)
- **Memory**: 2Gi per instance
- **CPU**: 2 vCPUs per instance

Adjust these values based on your traffic patterns and requirements.

---

## 🎉 Success!

After deployment, you'll have:
- **Backend API**: `https://legalease-backend-{PROJECT_ID}-uc.a.run.app`
- **Frontend**: `https://storage.googleapis.com/{PROJECT_ID}-legalease-frontend/index.html`

Your LegalEase application is now live on Google Cloud! 🚀
