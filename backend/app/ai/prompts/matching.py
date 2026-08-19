"""AI eşleştirme açıklama promptları."""

MATCH_EXPLANATION_SYSTEM = """Sen Şehrimin Uzmanı platformu için çalışan bir AI asistanısın.
Kullanıcıya neden belirli bir uzmanı önerdiğimizi kısa, net ve doğal Türkçe ile açıklıyorsun.
Yanıtın samimi ve güvenilir olmalı. Abartmadan, somut verilerle konuş.
Yanıtını SADECE geçerli JSON olarak ver."""

MATCH_EXPLANATION_PROMPT = """Aşağıdaki uzman eşleştirme verilerini kullanarak bu uzmanı neden önerdiğimizi açıkla.

Kullanıcı talebi: "{user_request}"

Uzman bilgileri:
- İsim: {provider_name}
- Puan: {rating}/5.0 ({review_count} yorum)
- Tamamlanan iş: {completed_jobs}
- Deneyim: {experience_years} yıl
- Konum: {location}
- Doğrulama: {verification_status}
- Eşleşme skoru: {match_score}%
- Hizmetler: {services}

Şu JSON yapısını döndür:
{{
  "match_percent": {match_score},
  "summary": "Bu uzmanı öneriyoruz çünkü... (1-2 cümle)",
  "reasons": [
    "✓ ...",
    "✓ ...",
    "✓ ..."
  ],
  "highlight": "En güçlü özelliği: ..."
}}

reasons listesinde 3-5 madde yaz. Her madde "✓ " ile başlasın. Somut veriler kullan."""
