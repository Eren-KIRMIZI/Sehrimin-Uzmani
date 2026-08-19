import json
import re
import logging
import httpx
from typing import Optional
from app.ai.base import AIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterProvider(AIProvider):
    """OpenRouter API üzerinden LLM çağrısı yapan provider."""

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = settings.OPENROUTER_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sehriminuzmani.com",
            "X-Title": "Şehrimin Uzmanı",
        }

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
    ) -> dict:
        """JSON yanıt üretir ve parse eder. Hata durumunda boş dict döner."""
        full_system = (system_prompt or "") + "\n\nYanıtını SADECE geçerli JSON olarak ver. Hiçbir açıklama, kod bloğu (```json) veya ek metin ekleme. Sadece ham JSON."
        
        raw = await self.generate(
            prompt=prompt,
            system_prompt=full_system,
            temperature=temperature,
            max_tokens=1024,
        )

        # JSON temizle: ```json ... ``` bloklarını çıkar
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("OpenRouter JSON parse hatası. Ham yanıt: %s", raw[:200])
            return {}
