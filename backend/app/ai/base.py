from abc import ABC, abstractmethod


class AIProvider(ABC):
    """AI provider'ı için soyut temel sınıf.

    Farklı LLM backend'lerini (OpenRouter, OpenAI, Gemini, Ollama vb.)
    aynı arayüzle kullanmayı sağlar.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        """LLM'den metin üretir."""
        ...

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.1,
    ) -> dict:
        """LLM'den JSON yapısında yanıt üretir."""
        ...
