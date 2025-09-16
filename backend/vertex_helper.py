from __future__ import annotations

import os
import asyncio
import time
import random
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
        # Retry controls
        try:
            self.max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
        except Exception:
            self.max_retries = 3
        try:
            self.retry_base_delay = float(os.getenv("GEMINI_RETRY_BASE_DELAY", "1.0"))
        except Exception:
            self.retry_base_delay = 1.0
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
                    attempts = 0
                    used_fallback_once = False
                    while True:
                        attempts += 1
                        try:
                            resp = genai.GenerativeModel(model_name).generate_content(prompt)
                            text = getattr(resp, "text", None)
                            return text if text else str(resp)
                        except Exception as api_err:
                            err_msg = str(api_err)
                            is_rl = _looks_like_rate_limit(err_msg)
                            if is_rl and self.rate_limit_fallback and not used_fallback_once and self.rate_limit_fallback != model_name:
                                try:
                                    used_fallback_once = True
                                    resp = genai.GenerativeModel(self.rate_limit_fallback).generate_content(prompt)
                                    text = getattr(resp, "text", None)
                                    return text if text else str(resp)
                                except Exception as fallback_err:
                                    # If fallback also hits rate limit, continue to retry loop
                                    err_msg = str(fallback_err)
                                    is_rl = _looks_like_rate_limit(err_msg)
                                    # fallthrough to retry logic
                            # Retry with backoff if it looks like rate limit/quota
                            if is_rl and attempts <= self.max_retries:
                                _sleep_with_jitter(self.retry_base_delay, attempts)
                                continue
                            # Non-rate-limit or exhausted retries: raise to outer handler
                            raise

                # Otherwise use Vertex AI python SDK (service account path)
                self._ensure_init()
                attempts = 0
                used_fallback_once = False
                while True:
                    attempts += 1
                    try:
                        gen_model = GenerativeModel(model_name)
                        resp = gen_model.generate_content(prompt)
                        return getattr(resp, "text", str(resp))
                    except Exception as exc_inner:
                        err_msg = str(exc_inner)
                        is_rl = _looks_like_rate_limit(err_msg)
                        if is_rl and self.rate_limit_fallback and not used_fallback_once and self.rate_limit_fallback != model_name:
                            try:
                                used_fallback_once = True
                                gen_model = GenerativeModel(self.rate_limit_fallback)
                                resp = gen_model.generate_content(prompt)
                                return getattr(resp, "text", str(resp))
                            except Exception as fallback_err:
                                err_msg = str(fallback_err)
                                is_rl = _looks_like_rate_limit(err_msg)
                                # fallthrough to retry logic
                        if is_rl and attempts <= self.max_retries:
                            _sleep_with_jitter(self.retry_base_delay, attempts)
                            continue
                        raise
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


# Helpers
def _looks_like_rate_limit(message: str) -> bool:
    lower = message.lower()
    return (
        "429" in lower
        or "rate limit" in lower
        or "quota" in lower
        or "exceeded" in lower
        or "resourceexhausted" in lower
    )


def _sleep_with_jitter(base_delay: float, attempt_number: int) -> None:
    # Exponential backoff with jitter: base * 2^(n-1) plus random 0-200ms
    delay = base_delay * (2 ** max(0, attempt_number - 1))
    time.sleep(delay + random.uniform(0, 0.2))

