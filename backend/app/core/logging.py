import logging
import sys

from app.core.config import settings


def setup_logging():
    """
    Production ortamı için JSON formatında yapılandırılmış loglama.
    Development ortamında okunabilir düz text formatı kullanılır.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    if settings.is_production:
        _setup_json_logging(log_level)
    else:
        _setup_text_logging(log_level)

    # SQLAlchemy çok fazla log üretir — sadece DEBUG modda açık
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    # APScheduler scheduler log seviyesi
    logging.getLogger("apscheduler").setLevel(logging.WARNING)

    for module in ["app.modules.auth", "app.modules.providers", "app.modules.commissions"]:
        logging.getLogger(module).setLevel(log_level)

    logging.getLogger(__name__).info(
        "Logging baslatildi",
        extra={"environment": settings.ENVIRONMENT, "level": logging.getLevelName(log_level)},
    )


def _setup_json_logging(log_level: int):
    """Production: makine tarafından okunabilir JSON format."""
    try:
        from pythonjsonlogger import jsonlogger

        formatter = jsonlogger.JsonFormatter(
            fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
            rename_fields={"asctime": "time", "levelname": "level", "name": "module"},
        )
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)

        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)
        root_logger.handlers.clear()
        root_logger.addHandler(handler)
    except ImportError:
        # python-json-logger kurulu değilse text formatına düş
        _setup_text_logging(log_level)
        logging.warning("python-json-logger bulunamadi, text format kullaniliyor")


def _setup_text_logging(log_level: int):
    """Development: okunabilir renkli format."""
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
