"""
Redis bağlantı yönetimi — production sertleştirmesi.

Özellikler:
- Timeout ve retry yapılandırması
- Periyodik health check
- SSL/TLS desteği (REDIS_SSL=true)
- Şifre desteği (REDIS_PASSWORD)
- Başlangıçta bağlantı testi ile erken hata tespiti
"""
import logging
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)


def _create_redis_client() -> redis.Redis:
    """
    Redis istemcisi oluşturur.
    Bağlantı hatası durumunda uyarı verir ama uygulamayı durdurmaz
    (Redis olmadan çalışan modüller için).
    """
    kwargs = dict(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True,
        # Bağlantı zaman aşımları
        socket_connect_timeout=5,
        socket_timeout=5,
        # Timeout sonrası otomatik yeniden dene
        retry_on_timeout=True,
        # 30 saniyede bir bağlantıyı kontrol et
        health_check_interval=30,
        # Bağlantı havuzu
        max_connections=20,
    )
    if settings.REDIS_PASSWORD:
        kwargs["password"] = settings.REDIS_PASSWORD
    if settings.REDIS_SSL:
        kwargs["ssl"] = True
        kwargs["ssl_cert_reqs"] = "required"

    return redis.Redis(**kwargs)


# Uygulama genelinde tek Redis istemcisi
redis_client: redis.Redis = _create_redis_client()


def get_redis() -> redis.Redis:
    """FastAPI dependency injection için Redis istemcisini döndürür."""
    return redis_client


def check_redis_health() -> bool:
    """
    Redis bağlantısını test eder.
    Health check endpoint'i tarafından çağrılır.
    Returns True if healthy, False otherwise.
    """
    try:
        redis_client.ping()
        return True
    except (redis.ConnectionError, redis.TimeoutError) as e:
        logger.warning("Redis saglik kontrolu basarisiz: %s", str(e))
        return False
    except Exception as e:
        logger.error("Redis saglik kontrolunda beklenmeyen hata: %s", str(e), exc_info=True)
        return False


def verify_redis_connection() -> None:
    """
    Uygulama startup'ında çağrılır.
    Redis'e bağlanılamıyorsa uyarı loglar (hata fırlatmaz —
    Redis olmadan da çalışabilmek için).
    """
    if check_redis_health():
        logger.info("Redis baglantisi basarili: %s:%s", settings.REDIS_HOST, settings.REDIS_PORT)
    else:
        logger.warning(
            "Redis'e baglanamadi (%s:%s). Cache ve rate-limiting devre disi olabilir.",
            settings.REDIS_HOST,
            settings.REDIS_PORT,
        )
