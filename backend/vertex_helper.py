from __future__ import annotations

import os
import asyncio
from typing import Optional

from google.cloud import aiplatform
from vertexai import init as vertexai_init
from vertexai.generative_models import GenerativeModel
import google.generativeai as genai


class VertexClient:
    def __init__(self) -> None:
        self.project = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.mock = os.getenv("MOCK_AI", "true").lower() == "true"
        self.default_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.rate_limit_fallback = os.getenv("GEMINI_RATE_LIMIT_FALLBACK_MODEL", "gemini-1.5-flash")
        self._initialized = False

    def _ensure_init(self) -> None:
        if self._initialized or self.mock:
            return
        if not self.project:
            # fallback to mock if not configured
            self.mock = True
            return
        # Initialize Vertex AI for GenerativeModel (Gemini)
        vertexai_init(project=self.project, location=self.location)
        self._initialized = True

    async def generate_text(self, prompt: str, model: Optional[str] = None) -> str:
        # Basic async wrapper to allow await in FastAPI routes
        if self.mock:
            return self._mock_response(prompt)

        model_name = model or self.default_model

        def _call_vertex() -> str:
            try:
                # Prefer API key path if provided
                if self.api_key:
                    genai.configure(api_key=self.api_key)
                    try:
                        resp = genai.GenerativeModel(model_name).generate_content(prompt)
                        text = getattr(resp, "text", None)
                        if text:
                            return text
                        return str(resp)
                    except Exception as api_err:
                        # On rate limit, try fallback model if configured
                        if self.rate_limit_fallback and "rate" in str(api_err).lower():
                            resp = genai.GenerativeModel(self.rate_limit_fallback).generate_content(prompt)
                            return getattr(resp, "text", str(resp))
                        raise

                # Otherwise use Vertex AI python SDK (service account path)
                self._ensure_init()
                gen_model = GenerativeModel(model_name)
                resp = gen_model.generate_content(prompt)
                return getattr(resp, "text", str(resp))
            except Exception as exc:  # noqa: BLE001
                # Fail safe to mock for prototype
                return f"[Mock due to error: {exc}]\n" + self._mock_response(prompt)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_vertex)

    def _mock_response(self, prompt: str) -> str:
        if "Summarize this legal document" in prompt:
            return (
                "One-liner: This document outlines the agreement between parties for services rendered.\n"
                "- Parties agree on scope, payment, and timelines.\n"
                "- Liability is limited; confidentiality applies.\n"
                "- Termination and dispute resolution are specified."
            )
        if "Explain this clause" in prompt:
            return "🟡 Caution — Key obligations apply; ensure timelines and liability are acceptable."
        if "Given this excerpt" in prompt:
            return "The clause sets expectations and limits liability. Consult a lawyer for specifics."
        return "Prototype response."


