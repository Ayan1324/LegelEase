## Hackathon: One-click-ish Deploy (Free Tiers)

This guide assumes your repo is on GitHub.

### 1) Backend (Render – free web service)
1. Go to `https://render.com` → New → Web Service → Connect your GitHub repo.
2. Root directory: `/backend`. Choose Docker as runtime (auto-detects `backend/Dockerfile`).
3. Environment Variables:
   - `ALLOWED_ORIGINS=*` (or your frontend URL after you have it)
   - `MOCK_AI=true` (safe demo mode; no external AI costs)
   - Render sets `PORT` automatically; our Dockerfile respects it.
4. Create Web Service → wait for deploy → copy the public URL, e.g. `https://legalease-backend.onrender.com`.

Optional (real AI): set `MOCK_AI=false` and add `GEMINI_API_KEY` (keep it only on backend). You can later enable OCR via `USE_CLOUD_OCR=true` (needs Google Vision) or `USE_GEMINI_OCR=true`.

### 2) Frontend (Vercel – free)
1. Go to Vercel → New Project → Import your repo → set project root to `/frontend`.
2. Framework Preset: Vite. Build Command: `vite build`. Output Directory: `dist`.
3. Set Environment Variables:
   - `VITE_API_URL` = your Render backend URL (from step 1).
4. Deploy and get the public frontend URL. Use this URL for your submission.

Smoke Test
- Open the frontend URL in Incognito → upload a PDF/DOCX → run Summarize/Clauses/QA.
- If CORS blocks: set `ALLOWED_ORIGINS` on Render to your exact frontend URL (comma-separated if multiple).

## 🚀 Deployment

### Google Cloud Platform (Recommended)

The easiest way to deploy the entire application to Google Cloud:

#### Quick Deployment
```bash
# Windows (PowerShell)
.\deploy.ps1

# Windows (CMD)
deploy.bat

# Linux/macOS
./deploy.sh
```

#### Manual Deployment
See [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md) for detailed instructions.

**What gets deployed:**
- **Backend**: FastAPI app on Cloud Run (auto-scaling, serverless)
- **Frontend**: React app on Cloud Storage (static hosting)
- **AI Integration**: Google Vertex AI or Gemini API
- **OCR**: Google Cloud Vision API for image processing

### Alternative Deployments

#### Backend: Google Cloud Run

Prereqs:
- gcloud CLI installed and authenticated
- A Google Cloud project selected and billing enabled

Build and deploy:
1) From the repo root:
```
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/legalease-backend ./backend
```
2) Deploy to Cloud Run (Public, port 8080):
```
gcloud run deploy legalease-backend \
  --image gcr.io/$(gcloud config get-value project)/legalease-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars ALLOWED_ORIGINS="*" \
  --set-env-vars MOCK_AI=true
```

#### Frontend: Vercel

1) In the Vercel dashboard, import the `frontend/` directory as a project.
2) Framework preset: Vite. Build command: `vite build`. Output dir: `dist`.
3) Set Environment Variables (Production):
   - `VITE_API_URL` = Cloud Run URL from above (e.g., `https://legalease-backend-...a.run.app`)
4) Deploy.

If you prefer CLI:
```
cd frontend
vercel --prod
```
and set `VITE_API_URL` in the Vercel project settings.

### Free-tier alternative

Backend on Render (free web service):
1) Push this repo to GitHub.
2) Create a new Web Service on Render, connect the repo, root set to `/backend`.
3) Runtime: Docker. It will auto-detect `backend/Dockerfile`.
4) Environment:
   - Add `PORT=10000` (Render sets it, but keeping default is fine)
   - `ALLOWED_ORIGINS=*` for hackathon or your frontend URL
   - `MOCK_AI=true` to avoid AI costs
5) After deploy, copy the public URL (e.g., `https://legalease-backend.onrender.com`).

Frontend on Vercel or Netlify (free):
1) Set env `VITE_API_URL` to the Render URL.
2) Build/deploy.

### Local run (for reference)

Backend:
```
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Frontend:
```
cd frontend
npm i
npm run dev
```

Set `VITE_API_URL` in a `.env` file inside `frontend/` to point to your backend:
```
VITE_API_URL=http://localhost:8000
```

# LegalEase AI

**Analyze Legal Documents In Seconds, Not Hours**

A modern AI-powered legal document analysis platform that instantly summarizes, highlights key clauses, and provides real-time insights through intelligent chat. Upload any legal document and get comprehensive analysis in multiple languages.

## ✨ Features

### 📄 Multi-Format Document Support
- **PDF Documents** - Full text extraction with pdfplumber
- **Word Documents** - DOC/DOCX support with python-docx
- **Image Files** – OCR text extraction with **Google Cloud Vision** (JPG, PNG, TIFF, etc.)


### 🤖 AI-Powered Analysis
- **Smart Summaries** - Clear, easy-to-understand document summaries
- **Clause Analysis** - Detailed explanations with risk indicators (🟢 Safe / 🟡 Caution / 🔴 Risky)
- **Interactive Chat** - Ask questions about your document and get instant AI responses
- **Language Detection** - Automatically detects document language for better analysis

### 🌍 Multilingual Support
- **Interface Languages**: English, Hindi, मराठी (Marathi)
- **AI Responses**: Generate summaries, clauses, and chat responses in your preferred language
- **Document Processing**: Works with documents in any language
- **Unicode Support**: Proper rendering for Devanagari and other scripts

### 🎨 Modern UI/UX
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark/Light Theme** - Toggle between themes
- **Smooth Animations** - Framer Motion powered transitions
- **Professional Typography** - Optimized for readability and accessibility
- **PDF Preview** - View uploaded documents before analysis
- **Export Options** - Download summaries as PDF

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Lucide React** for beautiful icons
- **Sonner** for toast notifications
- **jsPDF** for PDF generation
- **Context API** for state management

### Backend
- **FastAPI** for high-performance API
- **Uvicorn** as ASGI server
- **Google Cloud Vertex AI** for AI capabilities
- **pdfplumber** for PDF text extraction
- **python-docx** for Word document processing
- **Pillow + Google Cloud Vision** for image OCR
- **Pydantic** for data validation

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.10+**
- **Google Cloud Project** with Vertex AI API enabled (optional for mock mode)
- **Google Cloud Vision OCR** for image processing (optional)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd LegalEase-Gemini-DocuSense
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows CMD:
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Optional: Set up Google Cloud credentials
# $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. Access the Application
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Optional: Custom API URL
VITE_API_URL=http://localhost:8000
```

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

## 📖 Usage

### 1. Upload Document
- Click "Choose Document" or drag and drop
- Supported formats: PDF, DOC, DOCX, JPG, PNG, TIFF, BMP, GIF
- Document is processed and text is extracted automatically

### 2. Generate Summary
- Click "Generate Summary" to get an AI-powered summary
- Summary includes key points and insights
- Available in your selected interface language

### 3. Analyze Clauses
- Click "Analyze Clauses" to get detailed clause explanations
- Each clause is marked with risk indicators
- Get plain-English explanations of complex legal terms

### 4. Chat with AI
- Ask specific questions about your document
- Get instant, contextual answers
- Perfect for understanding specific sections or terms

### 5. Language Selection
- Use the language selector in the top-right
- Choose from English, Hindi, or Marathi
- All AI responses will be generated in your selected language

## 🌐 API Endpoints

### Document Upload
```http
POST /upload
Content-Type: multipart/form-data

file: [document file]
```

### Generate Summary
```http
POST /summarize
Content-Type: application/json

{
  "doc_id": "document-id",
  "language": "en|hi|mr"
}
```

### Analyze Clauses
```http
POST /clauses
Content-Type: application/json

{
  "doc_id": "document-id",
  "language": "en|hi|mr"
}
```

### Chat with Document
```http
POST /qa
Content-Type: application/json

{
  "doc_id": "document-id",
  "question": "Your question here",
  "language": "en|hi|mr"
}
```

## 🔒 Security & Privacy

- **Local Processing**: Text extraction happens locally on your server
- **No Data Storage**: Documents are processed in-memory and not permanently stored
- **Secure API**: All endpoints use proper validation and error handling
- **CORS Protection**: Configured for secure cross-origin requests

## 🚧 Development Notes

### Mock Mode
If Google Cloud credentials are not configured, the backend automatically switches to mock mode, allowing you to demo the UI with sample responses.

### In-Memory Storage
This is a prototype using in-memory document storage. For production, implement proper database storage.

### Error Handling
The application includes comprehensive error handling for:
- Unsupported file formats
- OCR processing failures
- AI service unavailability
- Network connectivity issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and prototyping purposes. Please ensure compliance with Google Cloud AI Platform terms of service when using Vertex AI.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

---

**⚠️ Legal Disclaimer**: This tool is for educational purposes only and does not constitute legal advice. Always consult with qualified legal professionals for important legal matters.


