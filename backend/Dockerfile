FROM python:3.11-slim

# Install system deps for Pillow, Tesseract optional, and pdfplumber
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libjpeg62-turbo-dev \
       zlib1g-dev \
       libtiff6 \
       libpng16-16 \
       poppler-utils \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

# Default CORS to allow Cloud Run preview/testing; override via env
ENV ALLOWED_ORIGINS="*"

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
