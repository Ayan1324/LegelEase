from __future__ import annotations

import os
import io
import uuid
import re
from typing import List, Dict, Any

import pdfplumber
from docx import Document
from PIL import Image
import pytesseract
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from vertex_helper import VertexClient
from utils import split_into_clauses, simple_retrieve_context


class SummarizeRequest(BaseModel):
    doc_id: str
    language: str = "en"  # User's preferred language


class ClausesRequest(BaseModel):
    doc_id: str
    language: str = "en"  # User's preferred language


class QARequest(BaseModel):
    doc_id: str
    question: str
    language: str = "en"  # User's preferred language


app = FastAPI(title="LegalEase AI", version="0.1.0")


_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
if _origins_env.strip() == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    allowed_origins = [origin.strip() for origin in _origins_env.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# In-memory document store for prototype
DOC_STORE: Dict[str, str] = {}

vertex_client = VertexClient()

# Check if Tesseract is available for image processing
try:
    pytesseract.get_tesseract_version()
    TESSERACT_AVAILABLE = True
except Exception:
    TESSERACT_AVAILABLE = False
    print("Warning: Tesseract OCR not found. Image processing will not work. Install Tesseract from: https://github.com/tesseract-ocr/tesseract")


def detect_language(text: str) -> str:
    """Simple language detection based on character patterns."""
    # Count different character types
    latin_chars = len(re.findall(r'[a-zA-Z]', text))
    cyrillic_chars = len(re.findall(r'[а-яА-Я]', text))
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    japanese_chars = len(re.findall(r'[\u3040-\u309f\u30a0-\u30ff]', text))
    
    total_chars = len(re.findall(r'[a-zA-Zа-яА-Я\u0600-\u06FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]', text))
    
    if total_chars == 0:
        return "unknown"
    
    # Determine dominant script
    if cyrillic_chars > latin_chars * 0.3:
        return "russian"
    elif arabic_chars > latin_chars * 0.3:
        return "arabic"
    elif chinese_chars > latin_chars * 0.3:
        return "chinese"
    elif japanese_chars > latin_chars * 0.3:
        return "japanese"
    else:
        return "english"


def get_language_prompts(language: str) -> Dict[str, str]:
    """Get language-specific prompts for AI responses."""
    prompts = {
        "en": {
            "summarize": "Analyze this legal document and provide a clear, easy-to-understand summary in English.",
            "clauses": "Analyze this legal clause and provide an explanation in English. Mark 🟢 Safe / 🟡 Caution / 🔴 Risky and explain why.",
            "qa": "Given this legal document excerpt, answer the question clearly in English. If unsure, say 'Consult a lawyer.'"
        },
        "hi": {
            "summarize": "इस कानूनी दस्तावेज़ का विश्लेषण करें और हिंदी में एक स्पष्ट, समझने में आसान सारांश प्रदान करें।",
            "clauses": "इस कानूनी धारा का विश्लेषण करें और हिंदी में व्याख्या प्रदान करें। 🟢 सुरक्षित / 🟡 सावधानी / 🔴 जोखिम भरा चिह्नित करें और क्यों समझाएं।",
            "qa": "इस कानूनी दस्तावेज़ अंश को देखते हुए, प्रश्न का स्पष्ट उत्तर हिंदी में दें। यदि अनिश्चित हैं, तो 'वकील से सलाह लें' कहें।"
        },
        "mr": {
            "summarize": "या कायदेशीर दस्तावेजाचे विश्लेषण करा आणि मराठीत स्पष्ट, समजण्यास सोपे सारांश द्या.",
            "clauses": "या कायदेशीर कलमाचे विश्लेषण करा आणि मराठीत स्पष्टीकरण द्या. 🟢 सुरक्षित / 🟡 सावधानता / 🔴 धोकादायक चिन्हांकित करा आणि का हे स्पष्ट करा.",
            "qa": "या कायदेशीर दस्तावेज अंशाच्या आधारे, प्रश्नाचे स्पष्ट उत्तर मराठीत द्या. अनिश्चित असल्यास 'वकीलांचा सल्ला घ्या' असे सांगा."
        }
    }
    return prompts.get(language, prompts["en"])


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from various file formats."""
    file_extension = filename.lower().split('.')[-1]
    
    if file_extension == 'pdf':
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                pages_text: List[str] = []
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    pages_text.append(text)
                return "\n\n".join(pages_text).strip()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {exc}")
    
    elif file_extension in ['doc', 'docx']:
        try:
            doc = Document(io.BytesIO(file_content))
            paragraphs = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    paragraphs.append(paragraph.text.strip())
            return "\n\n".join(paragraphs)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to parse DOC/DOCX: {exc}")
    
    elif file_extension in ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif']:
        if not TESSERACT_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail="Tesseract OCR is not installed. Please install Tesseract OCR to process image files. Visit: https://github.com/tesseract-ocr/tesseract"
            )
        try:
            image = Image.open(io.BytesIO(file_content))
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            # Use OCR to extract text
            text = pytesseract.image_to_string(image)
            return text.strip()
        except Exception as exc:
            # Check if it's a Tesseract not found error
            if "tesseract" in str(exc).lower() or "executable" in str(exc).lower():
                raise HTTPException(
                    status_code=500, 
                    detail="Tesseract OCR is not installed or not found. Please install Tesseract OCR to process image files. Visit: https://github.com/tesseract-ocr/tesseract"
                )
            else:
                raise HTTPException(status_code=500, detail=f"Failed to extract text from image: {exc}")
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {file_extension}")


@app.get("/")
def root() -> Dict[str, str]:
    return {"status": "ok", "service": "LegalEase AI"}


@app.get("/ai_status")
def ai_status() -> Dict[str, str]:
    """Diagnostics endpoint to verify AI configuration."""
    return {
        "mock": str(vertex_client.mock).lower(),
        "project": vertex_client.project or "",
        "location": vertex_client.location or "",
        "default_model": getattr(vertex_client, "default_model", ""),
    }


@app.get("/upload_status")
def upload_status() -> Dict[str, Any]:
    """Check status of file format support."""
    return {
        "pdf_support": True,
        "doc_docx_support": True,
        "image_support": TESSERACT_AVAILABLE,
        "tesseract_available": TESSERACT_AVAILABLE,
        "supported_formats": {
            "pdf": True,
            "doc": True,
            "docx": True,
            "images": TESSERACT_AVAILABLE
        }
    }


@app.post("/upload")
async def upload(file: UploadFile = File(...)) -> Dict[str, Any]:
    # Check if file format is supported
    supported_extensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif']
    file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    
    if file_extension not in supported_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Supported formats: {', '.join(supported_extensions)}"
        )

    content = await file.read()
    full_text = extract_text_from_file(content, file.filename)

    if not full_text:
        raise HTTPException(status_code=400, detail="No extractable text found in the document")

    # Detect language
    detected_language = detect_language(full_text)
    
    doc_id = str(uuid.uuid4())
    DOC_STORE[doc_id] = full_text
    return {
        "doc_id": doc_id, 
        "text_length": len(full_text), 
        "file_type": file_extension,
        "detected_language": detected_language
    }


@app.post("/summarize")
async def summarize(req: SummarizeRequest) -> Dict[str, Any]:
    text = DOC_STORE.get(req.doc_id)
    if not text:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get language-specific prompt
    prompts = get_language_prompts(req.language)
    prompt = f"{prompts['summarize']}\n\n{text}"
    
    result = await vertex_client.generate_text(prompt)

    return {"summary": result}


@app.post("/clauses")
async def clauses(req: ClausesRequest) -> Dict[str, Any]:
    text = DOC_STORE.get(req.doc_id)
    if not text:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get language-specific prompt
    prompts = get_language_prompts(req.language)
    
    chunks = split_into_clauses(text)
    explanations = []
    for clause in chunks:
        prompt = f"{prompts['clauses']}\n\nClause:\n{clause}"
        result = await vertex_client.generate_text(prompt)
        explanations.append({"clause": clause, "analysis": result})

    return {"clauses": explanations}


@app.post("/qa")
async def qa(req: QARequest) -> Dict[str, Any]:
    text = DOC_STORE.get(req.doc_id)
    if not text:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get language-specific prompt
    prompts = get_language_prompts(req.language)
    
    context = simple_retrieve_context(text, req.question)
    
    prompt = f"{prompts['qa']}\n\nExcerpt:\n{context}\n\nQuestion: {req.question}\nAnswer:"
    result = await vertex_client.generate_text(prompt)
    return {"answer": result, "context": context}


