import time
from datetime import datetime, timedelta, timezone
from enum import Enum
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, status


class TestPermissions:
    def test_check_admin_passes(self):
        from app.core.permissions import check_admin
        from app.modules.users.models import User

        user = MagicMock(spec=User)
        user.role = "ADMIN"
        check_admin(user)

    def test_check_admin_raises_for_user(self):
        from app.core.permissions import check_admin
        from app.modules.users.models import User

        user = MagicMock(spec=User)
        user.role = "USER"
        with pytest.raises(HTTPException) as exc_info:
            check_admin(user)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN

    def test_check_admin_raises_for_provider(self):
        from app.core.permissions import check_admin
        from app.modules.users.models import User

        user = MagicMock(spec=User)
        user.role = "PROVIDER"
        with pytest.raises(HTTPException) as exc_info:
            check_admin(user)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN

    def test_check_ownership_passes(self):
        from app.core.permissions import check_ownership

        check_ownership(1, 1)

    def test_check_ownership_raises(self):
        from app.core.permissions import check_ownership

        with pytest.raises(HTTPException) as exc_info:
            check_ownership(1, 2)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


class TestUtils:
    def test_generate_uuid(self):
        from app.shared.utils import generate_uuid

        result = generate_uuid()
        assert isinstance(result, str)
        assert len(result) == 36
        assert result.count("-") == 4

    def test_generate_uuid_unique(self):
        from app.shared.utils import generate_uuid

        assert generate_uuid() != generate_uuid()

    def test_slugify_simple(self):
        from app.shared.utils import slugify

        assert slugify("Hello World") == "hello-world"

    def test_slugify_special_chars(self):
        from app.shared.utils import slugify

        assert slugify("Hello, World!") == "hello-world"

    def test_slugify_multiple_spaces(self):
        from app.shared.utils import slugify

        assert slugify("  Hello   World  ") == "hello-world"

    def test_slugify_turkish(self):
        from app.shared.utils import slugify

        result = slugify("İstanbul İzmir Ankara")
        assert result == "istanbul-izmir-ankara"

    def test_slugify_empty(self):
        from app.shared.utils import slugify

        assert slugify("") == ""

    def test_haversine_same_point(self):
        from app.shared.utils import haversine

        assert haversine(41.0082, 28.9784, 41.0082, 28.9784) == 0.0

    def test_haversine_known_distance(self):
        from app.shared.utils import haversine

        distance = haversine(41.0082, 28.9784, 39.9334, 32.8597)
        assert 300 < distance < 500

    def test_haversine_istanbul_ankara(self):
        from app.shared.utils import haversine

        distance = haversine(41.0082, 28.9784, 39.9334, 32.8597)
        assert distance > 0

    def test_format_price(self):
        from app.shared.utils import format_price
        import re

        result = format_price(1000)
        assert result.startswith("₺")
        assert int(re.sub(r"[^\d]", "", result)) == 1000

        result0 = format_price(0)
        assert "₺" in result0 and "0" in result0

        result_large = format_price(1234567)
        assert int(re.sub(r"[^\d]", "", result_large)) == 1234567

    def test_format_price_decimal(self):
        from app.shared.utils import format_price
        import re

        result = format_price(1234.56)
        assert result.startswith("₺")
        assert int(re.sub(r"[^\d]", "", result)) == 1235

    def test_now_utc(self):
        from app.shared.utils import now_utc

        result = now_utc()
        assert isinstance(result, datetime)

    def test_now_utc_recent(self):
        from app.shared.utils import now_utc

        result = now_utc()
        assert (datetime.utcnow() - result).total_seconds() < 5


class _FakeRedis:
    """Redis'i taklit eden deterministik test dubloru (TTL dahil)."""

    def __init__(self):
        self._store = {}

    def setex(self, key, ttl, value):
        self._store[key] = (value, time.time() + ttl)

    def get(self, key):
        item = self._store.get(key)
        if item is None:
            return None
        value, expires_at = item
        if time.time() >= expires_at:
            del self._store[key]
            return None
        return value

    def delete(self, *keys):
        for key in keys:
            self._store.pop(key, None)

    def scan(self, cursor=0, match=None, count=100):
        import fnmatch

        pattern = match or "*"
        matching = [k for k in self._store if fnmatch.fnmatch(k, pattern)]
        return 0, matching

    def scan_iter(self, match=None):
        import fnmatch

        pattern = match or "*"
        for key in list(self._store):
            if fnmatch.fnmatch(key, pattern):
                yield key


@pytest.fixture
def fake_redis():
    import app.core.redis as redis_module

    fake = _FakeRedis()
    original = redis_module.redis_client
    redis_module.redis_client = fake
    yield fake
    redis_module.redis_client = original


class TestCache:
    def test_set_and_get(self, fake_redis):
        from app.core.cache import ReferenceCache

        cache = ReferenceCache(ttl_seconds=300)
        cache.set("key1", [1, 2, 3])
        assert cache.get("key1") == [1, 2, 3]

    def test_get_missing_key(self, fake_redis):
        from app.core.cache import ReferenceCache

        cache = ReferenceCache()
        assert cache.get("nonexistent") is None

    def test_ttl_expiry(self, fake_redis):
        from app.core.cache import ReferenceCache

        cache = ReferenceCache(ttl_seconds=0)
        cache.set("key1", [1, 2, 3])
        time.sleep(0.01)
        assert cache.get("key1") is None

    def test_invalidate_specific_key(self, fake_redis):
        from app.core.cache import ReferenceCache

        cache = ReferenceCache()
        cache.set("key1", [1])
        cache.set("key2", [2])
        cache.invalidate("key1")
        assert cache.get("key1") is None
        assert cache.get("key2") == [2]

    def test_invalidate_all(self, fake_redis):
        from app.core.cache import ReferenceCache

        cache = ReferenceCache()
        cache.set("key1", [1])
        cache.set("key2", [2])
        cache.invalidate()
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_invalidate_nonexistent_key(self, fake_redis):
        from app.core.cache import ReferenceCache

        cache = ReferenceCache()
        cache.invalidate("nonexistent")


class TestStateMachine:
    def test_initial_state(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"

        sm = BaseStateMachine(States.A)
        assert sm.current_state == States.A

    def test_can_transition(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"

        sm = BaseStateMachine(States.A)
        sm.transitions = {States.A: [States.B]}
        assert sm.can_transition_to(States.B) is True

    def test_cannot_transition(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"
            C = "C"

        sm = BaseStateMachine(States.A)
        sm.transitions = {States.A: [States.B]}
        assert sm.can_transition_to(States.C) is False

    def test_transition_to(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"

        sm = BaseStateMachine(States.A)
        sm.transitions = {States.A: [States.B]}
        sm.transition_to(States.B)
        assert sm.current_state == States.B

    def test_invalid_transition_raises(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"

        sm = BaseStateMachine(States.A)
        sm.transitions = {States.A: []}
        with pytest.raises(ValueError):
            sm.transition_to(States.B)

    def test_transition_callback(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"

        callback = MagicMock()
        sm = BaseStateMachine(States.A)
        sm.transitions = {States.A: [States.B]}
        sm.transition_to(States.B, on_transition=callback)
        callback.assert_called_once_with(States.A, States.B)

    def test_transition_callback_with_kwargs(self):
        from app.core.base.state_machine import BaseStateMachine

        class States(Enum):
            A = "A"
            B = "B"

        callback = MagicMock()
        sm = BaseStateMachine(States.A)
        sm.transitions = {States.A: [States.B]}
        sm.transition_to(States.B, on_transition=callback, reason="test")
        callback.assert_called_once_with(States.A, States.B, reason="test")


class TestExceptions:
    def test_app_exception(self):
        from app.core.exceptions import AppException

        exc = AppException(status_code=418, detail="I'm a teapot")
        assert exc.status_code == 418
        assert exc.detail == "I'm a teapot"

    def test_not_found_exception(self):
        from app.core.exceptions import NotFoundException

        exc = NotFoundException()
        assert exc.status_code == 404
        assert "bulunamad" in exc.detail.lower()

    def test_not_found_exception_custom_resource(self):
        from app.core.exceptions import NotFoundException

        exc = NotFoundException("Kullanici")
        assert exc.status_code == 404
        assert "Kullanici" in exc.detail

    def test_unauthorized_exception(self):
        from app.core.exceptions import UnauthorizedException

        exc = UnauthorizedException()
        assert exc.status_code == 401

    def test_unauthorized_exception_custom(self):
        from app.core.exceptions import UnauthorizedException

        exc = UnauthorizedException("Custom message")
        assert exc.detail == "Custom message"

    def test_forbidden_exception(self):
        from app.core.exceptions import ForbiddenException

        exc = ForbiddenException()
        assert exc.status_code == 403

    def test_bad_request_exception(self):
        from app.core.exceptions import BadRequestException

        exc = BadRequestException()
        assert exc.status_code == 400

    def test_conflict_exception(self):
        from app.core.exceptions import ConflictException

        exc = ConflictException()
        assert exc.status_code == 409

    def test_validation_exception(self):
        from app.core.exceptions import ValidationException

        exc = ValidationException()
        assert exc.status_code == 422


class TestConfig:
    def test_cors_origins_list(self):
        from app.core.config import Settings

        s = Settings(
            CORS_ORIGINS='["http://localhost:5173"]',
            SECRET_KEY="test-secret-key-for-ci-minimum-32-chars!!",
        )
        assert s.cors_origins_list == ["http://localhost:5173"]

    def test_is_production(self):
        from app.core.config import Settings

        s_prod = Settings(
            ENVIRONMENT="production",
            SECRET_KEY="test-secret-key-for-ci-minimum-32-chars!!",
            OPENROUTER_API_KEY="test-key",
            DATABASE_URL="postgresql://user:pass@localhost/db",
        )
        assert s_prod.is_production is True

        s_dev = Settings(
            ENVIRONMENT="development",
            SECRET_KEY="test-secret-key-for-ci-minimum-32-chars!!",
        )
        assert s_dev.is_production is False

    def test_validate_security_short_key(self):
        from app.core.config import Settings

        s = Settings(SECRET_KEY="short")
        with pytest.raises(ValueError, match="SECRET_KEY"):
            s.validate_security()

    def test_validate_security_passes(self):
        from app.core.config import Settings

        s = Settings(
            SECRET_KEY="test-secret-key-for-ci-minimum-32-chars!!",
            DEBUG=False,
        )
        s.validate_security()

    def test_validate_production_passes(self):
        from app.core.config import Settings

        s = Settings(
            ENVIRONMENT="development",
            SECRET_KEY="test-secret-key-for-ci-minimum-32-chars!!",
        )
        s.validate_production()

    def test_validate_production_with_errors(self):
        from app.core.config import Settings

        s = Settings(
            ENVIRONMENT="production",
            DEBUG=True,
            SECRET_KEY="short",
            OPENROUTER_API_KEY="",
            DATABASE_URL="postgresql://user:sehrim2026!@localhost/db",
        )
        with pytest.raises(ValueError, match="guvenlik kontrolleri basarisiz"):
            s.validate_production()


class TestRateLimiter:
    def test_allows_requests_under_limit(self):
        from app.core.rate_limiter import RateLimiter

        rl = RateLimiter()
        rl.check("test_key", max_requests=5, window_seconds=60)
        rl.check("test_key", max_requests=5, window_seconds=60)
        rl.check("test_key", max_requests=5, window_seconds=60)

    def test_blocks_requests_over_limit(self):
        from app.core.rate_limiter import RateLimiter

        rl = RateLimiter()
        for _ in range(5):
            rl.check("test_key", max_requests=5, window_seconds=60)
        with pytest.raises(HTTPException) as exc_info:
            rl.check("test_key", max_requests=5, window_seconds=60)
        assert exc_info.value.status_code == 429

    def test_different_keys_independent(self):
        from app.core.rate_limiter import RateLimiter

        rl = RateLimiter()
        for _ in range(5):
            rl.check("key1", max_requests=5, window_seconds=60)
        rl.check("key2", max_requests=5, window_seconds=60)

    def test_window_expiry(self):
        from app.core.rate_limiter import _InMemoryFallback

        fb = _InMemoryFallback()
        # Pencere disindaki (eski) kayitlar limite dahil edilmez
        fb._requests["test"] = [time.time() - 1000]
        assert fb.check("test", max_requests=5, window_seconds=100) is False


class TestBaseSchema:
    def test_base_schema_from_attributes(self):
        from app.core.base.schemas import BaseSchema

        assert BaseSchema.model_config.get("from_attributes") is True

    def test_id_schema_mixin(self):
        from app.core.base.schemas import IDSchemaMixin

        s = IDSchemaMixin(id=1)
        assert s.id == 1

    def test_timestamp_schema_mixin(self):
        from app.core.base.schemas import TimestampSchemaMixin

        now = datetime.utcnow()
        s = TimestampSchemaMixin(created_at=now, updated_at=now)
        assert s.created_at == now
        assert s.updated_at == now


class TestAppointmentsSchemas:
    def test_appointment_create(self):
        from app.modules.appointments.schemas import AppointmentCreate

        now = datetime.utcnow()
        ac = AppointmentCreate(request_id=1, start_at=now)
        assert ac.request_id == 1
        assert ac.quote_id is None
        assert ac.end_at is None

    def test_appointment_create_full(self):
        from app.modules.appointments.schemas import AppointmentCreate

        now = datetime.utcnow()
        ac = AppointmentCreate(
            request_id=1,
            quote_id=2,
            start_at=now,
            end_at=now + timedelta(hours=1),
            location="Istanbul",
            notes="Test",
        )
        assert ac.location == "Istanbul"

    def test_appointment_update_all_none(self):
        from app.modules.appointments.schemas import AppointmentUpdate

        au = AppointmentUpdate()
        assert au.start_at is None
        assert au.status is None

    def test_appointment_update_partial(self):
        from app.modules.appointments.schemas import AppointmentUpdate

        au = AppointmentUpdate(status="CONFIRMED", location="Ankara")
        assert au.status == "CONFIRMED"
        assert au.location == "Ankara"


class TestQuotesSchemas:
    def test_quote_create(self):
        from app.modules.quotes.schemas import QuoteCreate

        qc = QuoteCreate(price=500.0)
        assert qc.price == 500.0
        assert qc.description is None

    def test_quote_create_full(self):
        from app.modules.quotes.schemas import QuoteCreate

        now = datetime.utcnow()
        qc = QuoteCreate(
            price=1000.0,
            estimated_duration="2 saat",
            description="Test aciklama",
            materials="Malzeme 1",
            available_date=now,
            warranty_info="1 yil",
        )
        assert qc.materials == "Malzeme 1"

    def test_quote_response(self):
        from app.modules.quotes.schemas import QuoteResponse

        now = datetime.utcnow()
        qr = QuoteResponse(
            id=1,
            request_id=1,
            provider_id=1,
            price=500.0,
            estimated_duration=None,
            description=None,
            materials=None,
            available_date=None,
            warranty_info=None,
            status="PENDING",
            created_at=now,
        )
        assert qr.id == 1
        assert qr.warranty_info is None


class TestReviewsSchemas:
    def test_review_create(self):
        from app.modules.reviews.schemas import ReviewCreate

        rc = ReviewCreate(request_id=1, provider_id=1, rating=4.5)
        assert rc.rating == 4.5
        assert rc.comment is None

    def test_review_create_full(self):
        from app.modules.reviews.schemas import ReviewCreate

        rc = ReviewCreate(
            request_id=1,
            provider_id=1,
            rating=5.0,
            communication_rating=4.0,
            quality_rating=5.0,
            price_rating=3.5,
            punctuality_rating=4.5,
            comment="Harika bir hizmet!",
        )
        assert rc.communication_rating == 4.0
        assert rc.comment == "Harika bir hizmet!"

    def test_review_response(self):
        from app.modules.reviews.schemas import ReviewResponse

        now = datetime.utcnow()
        rr = ReviewResponse(
            id=1,
            request_id=1,
            customer_id=1,
            provider_id=1,
            rating=4.5,
            communication_rating=None,
            quality_rating=None,
            price_rating=None,
            punctuality_rating=None,
            comment=None,
            status="ACTIVE",
            created_at=now,
        )
        assert rr.id == 1
        assert rr.quality_rating is None


class TestAuthSchemas:
    def test_register_request_valid(self):
        from app.modules.auth.schemas import RegisterRequest

        r = RegisterRequest(
            email="test@test.com",
            password="Strong1Pass",
            first_name="Test",
            last_name="User",
        )
        assert r.role == "USER"

    def test_register_request_password_too_short(self):
        from app.modules.auth.schemas import RegisterRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@test.com",
                password="Ab1",
                first_name="Test",
                last_name="User",
            )

    def test_register_request_no_uppercase(self):
        from app.modules.auth.schemas import RegisterRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@test.com",
                password="lowercase1",
                first_name="Test",
                last_name="User",
            )

    def test_register_request_no_digit(self):
        from app.modules.auth.schemas import RegisterRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@test.com",
                password="NoDigitPass",
                first_name="Test",
                last_name="User",
            )

    def test_register_request_invalid_role(self):
        from app.modules.auth.schemas import RegisterRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            RegisterRequest(
                email="test@test.com",
                password="Strong1Pass",
                first_name="Test",
                last_name="User",
                role="ADMIN",
            )

    def test_login_request(self):
        from app.modules.auth.schemas import LoginRequest

        lr = LoginRequest(email="test@test.com", password="pass")
        assert lr.email == "test@test.com"

    def test_token_response(self):
        from app.modules.auth.schemas import TokenResponse

        tr = TokenResponse(access_token="abc", refresh_token="xyz")
        assert tr.token_type == "bearer"

    def test_refresh_request(self):
        from app.modules.auth.schemas import RefreshRequest

        rr = RefreshRequest(refresh_token="abc")
        assert rr.refresh_token == "abc"

    def test_forgot_password_request(self):
        from app.modules.auth.schemas import ForgotPasswordRequest

        fp = ForgotPasswordRequest(email="test@test.com")
        assert fp.email == "test@test.com"

    def test_reset_password_request(self):
        from app.modules.auth.schemas import ResetPasswordRequest

        rp = ResetPasswordRequest(token="abc", new_password="NewPass1")
        assert rp.token == "abc"

    def test_change_password_request(self):
        from app.modules.auth.schemas import ChangePasswordRequest

        cp = ChangePasswordRequest(current_password="old", new_password="NewPass1")
        assert cp.current_password == "old"


class TestRequestSchemas:
    def test_service_request_create(self):
        from app.modules.requests.schemas import ServiceRequestCreate

        src = ServiceRequestCreate(title="Tesisatci", city_id=1)
        assert src.title == "Tesisatci"
        assert src.urgency == "NORMAL"

    def test_service_request_update(self):
        from app.modules.requests.schemas import ServiceRequestUpdate

        sru = ServiceRequestUpdate(title="Guncel baslik")
        assert sru.title == "Guncel baslik"
        assert sru.description is None

    def test_service_request_response(self):
        from app.modules.requests.schemas import ServiceRequestResponse

        now = datetime.utcnow()
        srr = ServiceRequestResponse(
            id=1,
            customer_id=1,
            title="Test",
            description=None,
            budget_min=None,
            budget_max=None,
            city_id=1,
            district_id=None,
            preferred_date=None,
            preferred_time=None,
            urgency="NORMAL",
            status="PUBLISHED",
            created_at=now,
        )
        assert srr.id == 1


class TestPricingSchemas:
    def test_price_estimate_request(self):
        from app.modules.pricing.schemas import PriceEstimateRequest

        per = PriceEstimateRequest(service_id=1)
        assert per.service_id == 1
        assert per.category_id is None

    def test_price_estimate_response(self):
        from app.modules.pricing.schemas import PriceEstimateResponse

        per = PriceEstimateResponse(
            min_price=100,
            max_price=500,
            avg_price=300,
            median_price=250,
            sample_size=10,
            confidence=0.85,
        )
        assert per.currency == "TRY"

    def test_quote_comparison_response(self):
        from app.modules.pricing.schemas import QuoteComparisonResponse

        qcr = QuoteComparisonResponse(
            quote_id=1,
            quote_price=400,
            market_avg=300,
            market_min=100,
            market_max=500,
            deviation_percent=33.3,
            comparison_text="Yuksek",
            rating="pahali",
        )
        assert qcr.rating == "pahali"


class TestPagination:
    def test_pagination_params_defaults(self):
        from app.shared.pagination import PaginationParams

        pp = PaginationParams()
        assert pp.page == 1
        assert pp.limit == 20
        assert pp.offset == 0

    def test_pagination_params_custom(self):
        from app.shared.pagination import PaginationParams

        pp = PaginationParams(page=3, limit=10)
        assert pp.page == 3
        assert pp.limit == 10
        assert pp.offset == 20

    def test_pagination_params_min_page(self):
        from app.shared.pagination import PaginationParams

        pp = PaginationParams(page=-1)
        assert pp.page == 1

    def test_pagination_params_max_limit(self):
        from app.shared.pagination import PaginationParams

        pp = PaginationParams(limit=100)
        assert pp.limit == 50

    def test_pagination_params_min_limit(self):
        from app.shared.pagination import PaginationParams

        pp = PaginationParams(limit=-5)
        assert pp.limit == 1

    def test_paginated_response_create(self):
        from app.shared.pagination import PaginatedResponse

        pr = PaginatedResponse.create(items=[1, 2, 3], total=10, page=1, limit=3)
        assert pr.items == [1, 2, 3]
        assert pr.total == 10
        assert pr.pages == 4

    def test_paginated_response_zero_limit(self):
        from app.shared.pagination import PaginatedResponse

        pr = PaginatedResponse.create(items=[], total=0, page=1, limit=0)
        assert pr.pages == 0


class TestEnums:
    def test_user_role_values(self):
        from app.shared.enums import UserRole

        assert UserRole.USER.value == "USER"
        assert UserRole.PROVIDER.value == "PROVIDER"
        assert UserRole.ADMIN.value == "ADMIN"
        assert UserRole.MODERATOR.value == "MODERATOR"

    def test_verification_status(self):
        from app.shared.enums import VerificationStatus

        assert VerificationStatus.NONE.value == "NONE"
        assert VerificationStatus.PROFESSIONAL.value == "PROFESSIONAL"

    def test_request_status(self):
        from app.shared.enums import RequestStatus

        assert RequestStatus.DRAFT.value == "DRAFT"
        assert RequestStatus.COMPLETED.value == "COMPLETED"
        assert RequestStatus.CANCELLED.value == "CANCELLED"

    def test_quote_status(self):
        from app.shared.enums import QuoteStatus

        assert QuoteStatus.PENDING.value == "PENDING"
        assert QuoteStatus.ACCEPTED.value == "ACCEPTED"
        assert QuoteStatus.EXPIRED.value == "EXPIRED"

    def test_appointment_status(self):
        from app.shared.enums import AppointmentStatus

        assert AppointmentStatus.PENDING.value == "PENDING"
        assert AppointmentStatus.NO_SHOW.value == "NO_SHOW"

    def test_review_status(self):
        from app.shared.enums import ReviewStatus

        assert ReviewStatus.ACTIVE.value == "ACTIVE"
        assert ReviewStatus.HIDDEN.value == "HIDDEN"

    def test_notification_type(self):
        from app.shared.enums import NotificationType

        assert NotificationType.NEW_QUOTE.value == "NEW_QUOTE"
        assert NotificationType.SYSTEM.value == "SYSTEM"

    def test_message_type(self):
        from app.shared.enums import MessageType

        assert MessageType.TEXT.value == "TEXT"
        assert MessageType.FILE.value == "FILE"

    def test_payment_status(self):
        from app.shared.enums import PaymentStatus

        assert PaymentStatus.PENDING.value == "PENDING"
        assert PaymentStatus.REFUNDED.value == "REFUNDED"

    def test_dispute_status(self):
        from app.shared.enums import DisputeStatus

        assert DisputeStatus.OPEN.value == "OPEN"
        assert DisputeStatus.RESOLVED.value == "RESOLVED"

    def test_urgency_level(self):
        from app.shared.enums import UrgencyLevel

        assert UrgencyLevel.LOW.value == "LOW"
        assert UrgencyLevel.URGENT.value == "URGENT"

    def test_pricing_type(self):
        from app.shared.enums import PricingType

        assert PricingType.FIXED.value == "FIXED"
        assert PricingType.NEGOTIABLE.value == "NEGOTIABLE"

    def test_day_of_week(self):
        from app.shared.enums import DayOfWeek

        assert DayOfWeek.MONDAY.value == "MONDAY"
        assert DayOfWeek.SUNDAY.value == "SUNDAY"


class TestSecurity:
    def test_hash_password(self):
        from app.core.security import hash_password, verify_password

        hashed = hash_password("TestPassword1")
        assert verify_password("TestPassword1", hashed)

    def test_verify_wrong_password(self):
        from app.core.security import hash_password, verify_password

        hashed = hash_password("TestPassword1")
        assert not verify_password("WrongPassword", hashed)

    def test_create_access_token(self):
        from app.core.security import create_access_token, decode_token

        token = create_access_token({"sub": "1"})
        payload = decode_token(token)
        assert payload["sub"] == "1"
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        from app.core.security import create_refresh_token, decode_token

        token = create_refresh_token({"sub": "1"})
        payload = decode_token(token)
        assert payload["sub"] == "1"
        assert payload["type"] == "refresh"

    def test_decode_invalid_token(self):
        from app.core.security import decode_token

        with pytest.raises(HTTPException) as exc_info:
            decode_token("invalid-token")
        assert exc_info.value.status_code == 401


class TestFraudDetection:
    def _get_db_mock(self, user=None, disputes=0, reviews=0, provider=None):
        db = MagicMock()
        query_mock = MagicMock()

        if user:
            user_query = MagicMock()
            user_query.filter.return_value.first.return_value = user
        else:
            user_query = MagicMock()
            user_query.filter.return_value.first.return_value = None

        def side_effect(model, *args, **kwargs):
            m = MagicMock()
            if getattr(model, "__name__", str(model)) == "User":
                return user_query
            return query_mock

        db.query.side_effect = side_effect
        return db

    def test_user_not_found(self):
        from app.modules.admin.fraud import calculate_risk_score

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        result = calculate_risk_score(999, db)
        assert "error" in result

    def test_safe_user(self):
        from app.modules.admin.fraud import calculate_risk_score

        user = MagicMock()
        user.id = 1
        user.created_at = datetime.now(timezone.utc) - timedelta(days=100)
        user.is_active = True

        db = MagicMock()

        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_name = getattr(model, "__name__", str(model))

            if model_name == "User":
                q.filter.return_value.first.return_value = user
            elif model_name == "Dispute":
                q.filter.return_value.scalar.return_value = 0
            elif model_name == "ProviderProfile":
                q.filter.return_value.first.return_value = None
            elif model_name == "Review":
                q.filter.return_value.first.return_value = (None, 0)
            elif model_name == "Quote":
                q.filter.return_value.scalar.return_value = 0
            else:
                q.filter.return_value.scalar.return_value = 0
                q.filter.return_value.first.return_value = None
            return q

        db.query.side_effect = query_side_effect
        result = calculate_risk_score(1, db)
        assert result["risk_level"] == "SAFE"
        assert result["risk_score"] == 0

    def test_critical_risk_user(self):
        from app.modules.admin.fraud import calculate_risk_score

        user = MagicMock()
        user.id = 1
        user.created_at = datetime.now(timezone.utc) - timedelta(days=2)
        user.is_active = False

        db = MagicMock()

        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_str = str(model).lower()
            model_name = getattr(model, "__name__", "")
            if not model_name:
                if "dispute" in model_str:
                    model_name = "Dispute"
                elif "review" in model_str:
                    model_name = "Review"
                elif "quote" in model_str:
                    model_name = "Quote"
                elif "providerprofile" in model_str or "provider_profile" in model_str:
                    model_name = "ProviderProfile"
                elif "user" in model_str:
                    model_name = "User"

            if model_name == "User":
                q.filter.return_value.first.return_value = user
            elif model_name == "Dispute":
                q.filter.return_value.scalar.return_value = 10
            elif model_name == "ProviderProfile":
                provider = MagicMock()
                provider.id = 1
                provider.performance = None
                q.filter.return_value.first.return_value = provider
            elif model_name == "Quote":
                q.filter.return_value.scalar.return_value = 10
            elif model_name == "Review":
                if args:
                    q.filter.return_value.first.return_value = (2.0, 15)
                else:
                    q.filter.return_value.scalar.return_value = 15
            else:
                q.filter.return_value.scalar.return_value = 0
                if args:
                    q.filter.return_value.first.return_value = (2.0, 15)
                else:
                    q.filter.return_value.first.return_value = None
            return q

        db.query.side_effect = query_side_effect
        result = calculate_risk_score(1, db)
        assert result["risk_score"] >= 81
        assert result["risk_level"] == "CRITICAL"


class TestBadgeCalculation:
    @staticmethod
    def _make_side_effect(review_data, dispute_scalar=0, sub_first=None):
        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_str = str(model).lower()
            model_name = getattr(model, "__name__", "")
            if not model_name:
                if "dispute" in model_str:
                    model_name = "Dispute"
                elif "review" in model_str:
                    model_name = "Review"
                elif (
                    "providersubscription" in model_str
                    or "provider_subscription" in model_str
                ):
                    model_name = "ProviderSubscription"

            if model_name == "Review":
                if args:
                    q.filter.return_value.first.return_value = review_data
                else:
                    q.filter.return_value.scalar.return_value = (
                        review_data[1] if review_data else 0
                    )
            elif model_name == "Dispute":
                q.filter.return_value.scalar.return_value = dispute_scalar
            elif model_name == "ProviderSubscription":
                q.filter.return_value.first.return_value = sub_first
            else:
                q.filter.return_value.scalar.return_value = 0
            return q

        return query_side_effect

    def test_empty_provider_no_badges(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 120
        provider.experience_years = 1
        provider.completed_jobs = 0

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(0, 0))
        result = calculate_badges(provider, db)
        assert len(result) == 0

    def test_verified_provider_gets_badge(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "IDENTITY"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 3

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 5))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "verified_pro" in badge_ids

    def test_top_rated_provider(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 15

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.9, 20))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "top_rated" in badge_ids
        assert "active" in badge_ids

    def test_experienced_provider(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 7
        provider.completed_jobs = 20

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 10))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "experienced" in badge_ids

    def test_job_100_badge(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 100

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 5))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "job_100" in badge_ids

    def test_job_50_badge(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 55

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 5))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "job_50" in badge_ids

    def test_trusted_no_disputes(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 10

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 5))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "trusted" in badge_ids

    def test_fast_responder(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 20
        provider.experience_years = 1
        provider.completed_jobs = 3

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 5))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "fast_responder" in badge_ids

    def test_premium_subscriber(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 3

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(
            review_data=(4.0, 5),
            sub_first=MagicMock(),
        )
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "premium" in badge_ids

    def test_popular_provider(self):
        from app.modules.providers.badges import calculate_badges

        provider = MagicMock()
        provider.id = 1
        provider.user_id = 1
        provider.verification_status = "NONE"
        provider.response_time_minutes = 60
        provider.experience_years = 1
        provider.completed_jobs = 3

        db = MagicMock()
        db.query.side_effect = self._make_side_effect(review_data=(4.0, 20))
        result = calculate_badges(provider, db)
        badge_ids = [b["id"] for b in result]
        assert "popular" in badge_ids
        assert "active" in badge_ids


class TestAdminRouterExtended:
    def _auth(self, token):
        return {"Authorization": f"Bearer {token}"}

    def _setup_admin(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        admin = User(
            email="ext_admin@example.com",
            password_hash=hash_password("Admin1234"),
            first_name="ExtAdmin",
            last_name="User",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return create_access_token(
            {"sub": str(admin.id), "role": "ADMIN", "type": "access"}
        )

    def test_admin_dashboard_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/dashboard", headers=self._auth(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "total_providers" in data

    def test_admin_list_users_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/users", headers=self._auth(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data

    def test_admin_list_users_with_role_filter(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/users?role=USER", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_users_with_search(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/users?search=test", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_update_user(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password

        user = User(
            email="update@test.com",
            password_hash=hash_password("Test1234"),
            first_name="Test",
            last_name="User",
            role="USER",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = self._setup_admin(client, db)
        resp = client.patch(
            f"/api/v1/admin/users/{user.id}?is_active=false",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_update_user_not_found(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.patch(
            "/api/v1/admin/users/99999?is_active=false",
            headers=self._auth(token),
        )
        assert resp.status_code == 404

    def test_admin_list_providers_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/providers", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_providers_with_search(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/admin/providers?search=test", headers=self._auth(token)
        )
        assert resp.status_code == 200

    def test_admin_list_providers_with_verification(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/admin/providers?verification_status=IDENTITY",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_list_requests_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/requests", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_requests_with_status(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/admin/requests?status=PUBLISHED",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_list_reviews_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/reviews", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_audit_logs_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/audit-logs", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_payouts_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/payouts", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_payouts_with_status(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/admin/payouts?status=pending",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_list_disputes_empty(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get("/api/v1/admin/disputes", headers=self._auth(token))
        assert resp.status_code == 200

    def test_admin_list_disputes_with_status(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/admin/disputes?status=OPEN",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_fraud_risk_user_not_found(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/admin/users/99999/fraud-risk",
            headers=self._auth(token),
        )
        assert resp.status_code == 200
        assert "error" in resp.json()

    def test_admin_fraud_risk_existing_user(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password

        user = User(
            email="fraud@test.com",
            password_hash=hash_password("Test1234"),
            first_name="Fraud",
            last_name="Test",
            role="USER",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = self._setup_admin(client, db)
        resp = client.get(
            f"/api/v1/admin/users/{user.id}/fraud-risk",
            headers=self._auth(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "risk_score" in data
        assert "risk_level" in data


class TestCategoryRoutes:
    def _auth(self, token):
        return {"Authorization": f"Bearer {token}"}

    def _setup_admin(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        admin = User(
            email="cat_admin@example.com",
            password_hash=hash_password("Admin1234"),
            first_name="CatAdmin",
            last_name="User",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return create_access_token(
            {"sub": str(admin.id), "role": "ADMIN", "type": "access"}
        )

    def test_list_categories_empty(self, client, db):
        resp = client.get("/api/v1/categories")
        assert resp.status_code == 200

    def test_get_category_not_found(self, client, db):
        resp = client.get("/api/v1/categories/nonexistent")
        assert resp.status_code == 404

    def test_get_category_services_not_found(self, client, db):
        resp = client.get("/api/v1/categories/nonexistent/services")
        assert resp.status_code == 404

    def test_admin_create_category(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.post(
            "/api/v1/categories/admin",
            json={
                "name": "Test Category",
                "slug": "test-cat",
                "is_active": True,
                "sort_order": 1,
            },
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_create_subcategory(self, client, db):
        from app.modules.categories.models import Category

        cat = Category(name="Parent", slug="parent", is_active=True, sort_order=1)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        token = self._setup_admin(client, db)
        resp = client.post(
            f"/api/v1/categories/admin/{cat.id}/subcategories",
            json={"name": "Sub", "slug": "sub", "is_active": True, "sort_order": 1},
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_create_subcategory_not_found(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.post(
            "/api/v1/categories/admin/99999/subcategories",
            json={"name": "Sub", "slug": "sub", "is_active": True, "sort_order": 1},
            headers=self._auth(token),
        )
        assert resp.status_code == 404

    def test_admin_create_service(self, client, db):
        from app.modules.categories.models import Category, SubCategory

        cat = Category(name="Parent2", slug="parent2", is_active=True, sort_order=2)
        db.add(cat)
        db.commit()
        db.refresh(cat)

        sub = SubCategory(
            name="Sub2", slug="sub2", is_active=True, sort_order=1, category_id=cat.id
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

        token = self._setup_admin(client, db)
        resp = client.post(
            f"/api/v1/categories/admin/subcategories/{sub.id}/services",
            json={
                "name": "Service1",
                "slug": "service1",
                "is_active": True,
                "sort_order": 1,
            },
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_create_service_not_found(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.post(
            "/api/v1/categories/admin/subcategories/99999/services",
            json={"name": "S", "slug": "s", "is_active": True, "sort_order": 1},
            headers=self._auth(token),
        )
        assert resp.status_code == 404


class TestLocationRoutes:
    def test_list_cities_empty(self, client, db):
        resp = client.get("/api/v1/locations/cities")
        assert resp.status_code == 200

    def test_list_districts_not_found(self, client, db):
        resp = client.get("/api/v1/locations/cities/99999/districts")
        assert resp.status_code == 404

    def test_list_districts(self, client, db):
        from app.modules.locations.models import City

        city = City(name="TestCity", plate_code="06", is_active=True)
        db.add(city)
        db.commit()
        db.refresh(city)

        resp = client.get(f"/api/v1/locations/cities/{city.id}/districts")
        assert resp.status_code == 200


class TestSubscriptionRoutes:
    def _auth(self, token):
        return {"Authorization": f"Bearer {token}"}

    def _setup_admin(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        admin = User(
            email="sub_admin@example.com",
            password_hash=hash_password("Admin1234"),
            first_name="SubAdmin",
            last_name="User",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return create_access_token(
            {"sub": str(admin.id), "role": "ADMIN", "type": "access"}
        )

    def test_list_plans_empty(self, client, db):
        resp = client.get("/api/v1/subscriptions/plans")
        assert resp.status_code == 200

    def test_admin_create_plan(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.post(
            "/api/v1/subscriptions/plans",
            params={
                "name": "Test Plan",
                "slug": "test-plan",
                "price_monthly": 99.99,
            },
            headers=self._auth(token),
        )
        assert resp.status_code in [200, 403]

    def test_admin_create_duplicate_plan(self, client, db):
        token = self._setup_admin(client, db)
        client.post(
            "/api/v1/subscriptions/plans",
            params={
                "name": "Test Plan Dup",
                "slug": "dup-plan",
                "price_monthly": 99.99,
            },
            headers=self._auth(token),
        )
        resp = client.post(
            "/api/v1/subscriptions/plans",
            params={
                "name": "Test Plan Dup 2",
                "slug": "dup-plan",
                "price_monthly": 99.99,
            },
            headers=self._auth(token),
        )
        assert resp.status_code in [400, 403]

    def test_admin_update_plan(self, client, db):
        from app.modules.subscriptions.models import SubscriptionPlan

        plan = SubscriptionPlan(
            name="Updatable",
            slug="updatable",
            price_monthly=50.0,
            is_active=True,
            sort_order=1,
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        token = self._setup_admin(client, db)
        resp = client.put(
            f"/api/v1/subscriptions/plans/{plan.id}",
            params={"name": "Updated Plan", "price_monthly": 75.0},
            headers=self._auth(token),
        )
        assert resp.status_code in [200, 403]

    def test_admin_update_plan_not_found(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.put(
            "/api/v1/subscriptions/plans/99999",
            params={"name": "X"},
            headers=self._auth(token),
        )
        assert resp.status_code in [404, 403]

    def test_admin_add_plan_feature(self, client, db):
        from app.modules.subscriptions.models import SubscriptionPlan

        plan = SubscriptionPlan(
            name="With Feature",
            slug="with-feature",
            price_monthly=50.0,
            is_active=True,
            sort_order=2,
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        token = self._setup_admin(client, db)
        resp = client.post(
            f"/api/v1/subscriptions/plans/{plan.id}/features",
            params={"feature_name": "Test Feature", "is_included": True},
            headers=self._auth(token),
        )
        assert resp.status_code in [200, 403]

    def test_admin_add_plan_feature_not_found(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.post(
            "/api/v1/subscriptions/plans/99999/features",
            params={"feature_name": "F"},
            headers=self._auth(token),
        )
        assert resp.status_code in [404, 403]

    def test_subscribe_no_active_plan(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        user = User(
            email="subscriber@test.com",
            password_hash=hash_password("Test1234"),
            first_name="Sub",
            last_name="User",
            role="PROVIDER",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": str(user.id)})

        from app.modules.subscriptions.models import SubscriptionPlan

        plan = SubscriptionPlan(
            name="Sub Plan",
            slug="sub-plan",
            price_monthly=99.0,
            commission_discount=10.0,
            is_active=True,
            sort_order=1,
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        resp = client.post(
            f"/api/v1/subscriptions/subscribe?plan_id={plan.id}&interval=monthly",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_my_subscription_none(self, client, db):
        from app.modules.users.models import User
        from app.core.security import hash_password, create_access_token

        user = User(
            email="mysub@test.com",
            password_hash=hash_password("Test1234"),
            first_name="My",
            last_name="Sub",
            role="PROVIDER",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        resp = client.get(
            "/api/v1/subscriptions/my",
            headers=self._auth(token),
        )
        assert resp.status_code == 200

    def test_admin_list_subscriptions(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/subscriptions/admin/all",
            headers=self._auth(token),
        )
        assert resp.status_code in [200, 403]

    def test_admin_list_subscriptions_with_status(self, client, db):
        token = self._setup_admin(client, db)
        resp = client.get(
            "/api/v1/subscriptions/admin/all?status=active",
            headers=self._auth(token),
        )
        assert resp.status_code in [200, 403]


class TestQuotesRouter:
    def test_list_quotes_unauthenticated(self, client, db):
        resp = client.get("/api/v1/quotes/my")
        assert resp.status_code in [401, 403, 404]


class TestAppointmentsRouter:
    def test_list_appointments_unauthenticated(self, client, db):
        resp = client.get("/api/v1/appointments/my")
        assert resp.status_code in [401, 403, 404, 422]


class TestNotificationsRouter:
    def test_list_notifications_unauthenticated(self, client, db):
        resp = client.get("/api/v1/notifications/my")
        assert resp.status_code in [401, 403, 404]


class TestProviderRoutes:
    def test_list_providers_public(self, client, db):
        resp = client.get("/api/v1/providers")
        assert resp.status_code in [200, 404]

    def test_get_provider_not_found(self, client, db):
        resp = client.get("/api/v1/providers/99999")
        assert resp.status_code == 404


class TestSearchRoutes:
    def test_search_empty(self, client, db):
        resp = client.get("/api/v1/search")
        assert resp.status_code in [200, 404, 422]

    def test_autocomplete_short(self, client, db):
        resp = client.get("/api/v1/search/autocomplete?q=ab")
        assert resp.status_code == 200


class TestPricingRoutes:
    def test_estimate_requires_params(self, client, db):
        resp = client.get("/api/v1/pricing/estimate")
        assert resp.status_code in [400, 422]

    def test_estimate_with_category(self, client, db):
        resp = client.get("/api/v1/pricing/estimate?category_id=1")
        assert resp.status_code == 200


class TestBaseRepository:
    def test_get_returns_none(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        result = repo.get(db, 99999)
        assert result is None

    def test_get_multi_empty(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        result = repo.get_multi(db)
        assert len(result) == 0

    def test_create_and_get(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "repo@test.com",
            "password_hash": "hashed",
            "first_name": "Repo",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = repo.create(db, obj_in=schema)
        assert obj.id is not None

        found = repo.get(db, obj.id)
        assert found is not None
        assert found.email == "repo@test.com"

    def test_update_with_dict(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "update2@test.com",
            "password_hash": "hashed",
            "first_name": "Upd",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = repo.create(db, obj_in=schema)

        updated = repo.update(db, db_obj=obj, obj_in={"first_name": "Changed"})
        assert updated.first_name == "Changed"

    def test_update_with_pydantic(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "upd3@test.com",
            "password_hash": "hashed",
            "first_name": "Upd3",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = repo.create(db, obj_in=schema)

        update_schema = MagicMock()
        update_schema.model_dump.return_value = {"first_name": "Pydantic"}
        updated = repo.update(db, db_obj=obj, obj_in=update_schema)
        assert updated.first_name == "Pydantic"

    def test_remove(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "remove@test.com",
            "password_hash": "hashed",
            "first_name": "Rem",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = repo.create(db, obj_in=schema)
        removed = repo.remove(db, id=obj.id)
        assert removed is not None

    def test_remove_nonexistent(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        result = repo.remove(db, id=99999)
        assert result is None

    def test_get_multi_with_skip_limit(self, db):
        from app.modules.users.models import User

        from app.core.base.repository import BaseRepository

        repo = BaseRepository(User)
        for i in range(5):
            schema = MagicMock()
            schema.model_dump.return_value = {
                "email": f"multi{i}@test.com",
                "password_hash": "hashed",
                "first_name": "Multi",
                "last_name": f"User{i}",
                "role": "USER",
                "is_active": True,
            }
            repo.create(db, obj_in=schema)

        all_items = repo.get_multi(db, skip=0, limit=100)
        assert len(all_items) == 5

        page = repo.get_multi(db, skip=0, limit=2)
        assert len(page) == 2

        page2 = repo.get_multi(db, skip=2, limit=2)
        assert len(page2) == 2


class TestBaseService:
    def test_get_returns_none(self, db):
        from app.modules.users.models import User
        from app.core.base.repository import BaseRepository
        from app.core.base.service import BaseService

        repo = BaseRepository(User)
        service = BaseService(repo)
        result = service.get(db, 99999)
        assert result is None

    def test_get_multi_empty(self, db):
        from app.modules.users.models import User
        from app.core.base.repository import BaseRepository
        from app.core.base.service import BaseService

        repo = BaseRepository(User)
        service = BaseService(repo)
        result = service.get_multi(db)
        assert len(result) == 0

    def test_create_and_get(self, db):
        from app.modules.users.models import User
        from app.core.base.repository import BaseRepository
        from app.core.base.service import BaseService

        repo = BaseRepository(User)
        service = BaseService(repo)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "svc@test.com",
            "password_hash": "hashed",
            "first_name": "Svc",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = service.create(db, obj_in=schema)
        assert obj.id is not None

    def test_update(self, db):
        from app.modules.users.models import User
        from app.core.base.repository import BaseRepository
        from app.core.base.service import BaseService

        repo = BaseRepository(User)
        service = BaseService(repo)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "svcupd@test.com",
            "password_hash": "hashed",
            "first_name": "SvcUpd",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = service.create(db, obj_in=schema)
        updated = service.update(db, db_obj=obj, obj_in={"first_name": "Updated"})
        assert updated.first_name == "Updated"

    def test_remove(self, db):
        from app.modules.users.models import User
        from app.core.base.repository import BaseRepository
        from app.core.base.service import BaseService

        repo = BaseRepository(User)
        service = BaseService(repo)
        schema = MagicMock()
        schema.model_dump.return_value = {
            "email": "svcrem@test.com",
            "password_hash": "hashed",
            "first_name": "SvcRem",
            "last_name": "Test",
            "role": "USER",
            "is_active": True,
        }
        obj = service.create(db, obj_in=schema)
        removed = service.remove(db, id=obj.id)
        assert removed is not None


class TestDatabaseModels:
    def test_platform_setting_model(self):
        from app.modules.admin.settings_model import PlatformSetting

        assert PlatformSetting.__tablename__ == "platform_settings"

    def test_system_setting_model(self):
        from app.shared.models import SystemSetting

        assert SystemSetting.__tablename__ == "system_settings"

    def test_audit_log_model(self):
        from app.modules.admin.audit_model import AuditLog

        assert AuditLog.__tablename__ == "audit_logs"


class TestReputation:
    def test_rating_score(self):
        from app.modules.providers.reputation import _rating_score

        assert _rating_score(0) == 0.0
        assert _rating_score(5.0) == 40.0
        assert _rating_score(3.0) == 24.0

    def test_completion_score(self):
        from app.modules.providers.reputation import _completion_score

        assert _completion_score(0) == 0.0
        assert _completion_score(-1) == 0.0
        assert _completion_score(200) > 20.0
        assert _completion_score(1) > 0.0

    def test_verification_score(self):
        from app.modules.providers.reputation import _verification_score

        assert _verification_score("NONE") == 0
        assert _verification_score("BASIC") == 5
        assert _verification_score("IDENTITY") == 8
        assert _verification_score("PROFESSIONAL") == 12
        assert _verification_score("BUSINESS") == 15
        assert _verification_score("UNKNOWN") == 0
        assert _verification_score("professional") == 12

    def test_response_score(self):
        from app.modules.providers.reputation import _response_score

        assert _response_score(0) == 5.0
        assert _response_score(-1) == 5.0
        assert _response_score(10) == 10.0
        assert _response_score(20) == 8.0
        assert _response_score(45) == 6.0
        assert _response_score(90) == 4.0
        assert _response_score(180) == 2.0
        assert _response_score(300) == 0.0

    def test_repeat_customer_score_no_reviews(self):
        from app.modules.providers.reputation import _repeat_customer_score

        db = MagicMock()
        q = MagicMock()
        q.filter.return_value.scalar.return_value = 0
        db.query.return_value = q

        result = _repeat_customer_score(1, db)
        assert result == 5.0

    def test_calculate_reputation_empty(self):
        from app.modules.providers.reputation import calculate_reputation_score

        provider = MagicMock()
        provider.id = 1
        provider.completed_jobs = 0
        provider.response_time_minutes = 0
        provider.verification_status = "NONE"

        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_str = str(model).lower()
            if "review" in model_str:
                if args:
                    q.filter.return_value.first.return_value = (0, 0)
                else:
                    q.filter.return_value.all.return_value = []
                    q.filter.return_value.scalar.return_value = 0
            return q

        db = MagicMock()
        db.query.side_effect = query_side_effect

        result = calculate_reputation_score(provider, db)
        assert "score" in result
        assert "label" in result
        assert "breakdown" in result
        assert "metrics" in result
        assert result["score"] >= 0
        assert result["label"] in ["Mükemmel", "Çok İyi", "İyi", "Orta", "Gelişiyor"]

    def test_calculate_reputation_high_rated(self):
        from app.modules.providers.reputation import calculate_reputation_score

        provider = MagicMock()
        provider.id = 1
        provider.completed_jobs = 50
        provider.response_time_minutes = 10
        provider.verification_status = "PROFESSIONAL"

        mock_reviews = [MagicMock(rating=4.8) for _ in range(15)]

        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_str = str(model).lower()
            if "review" in model_str:
                if args:
                    q.filter.return_value.first.return_value = (4.8, 15)
                else:
                    q.filter.return_value.all.return_value = mock_reviews
                    q.filter.return_value.scalar.return_value = 15
            return q

        db = MagicMock()
        db.query.side_effect = query_side_effect

        result = calculate_reputation_score(provider, db)
        assert result["score"] > 60
        assert result["metrics"]["avg_rating"] == 4.8


class TestProviderAnalytics:
    def test_analytics_empty(self):
        from app.modules.providers.analytics import get_provider_analytics

        db = MagicMock()

        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_str = str(model).lower()
            if "review" in model_str:
                if args:
                    q.filter.return_value.first.return_value = (0, 0)
                else:
                    q.filter.return_value.scalar.return_value = 0
            elif "quote" in model_str:
                q.filter.return_value.scalar.return_value = 0
            elif "servicerequest" in model_str or "service_request" in model_str:
                q.filter.return_value.scalar.return_value = 0
            elif "providerearning" in model_str or "provider_earning" in model_str:
                q.filter.return_value.scalar.return_value = 0
            else:
                q.filter.return_value.scalar.return_value = 0
            return q

        db.query.side_effect = query_side_effect

        result = get_provider_analytics(1, 1, db)
        assert result["period_days"] == 30
        assert result["quotes_sent"] == 0
        assert result["jobs_won"] == 0
        assert result["conversion_rate"] == 0
        assert len(result["daily_breakdown"]) == 7
        assert isinstance(result["ai_insights"], list)

    def test_analytics_with_data(self):
        from app.modules.providers.analytics import get_provider_analytics

        db = MagicMock()

        call_count = [0]

        def query_side_effect(model, *args, **kwargs):
            q = MagicMock()
            model_str = str(model).lower()
            call_count[0] += 1

            if "review" in model_str:
                if args:
                    q.filter.return_value.first.return_value = (4.5, 10)
                else:
                    q.filter.return_value.scalar.return_value = 5
            elif "quote" in model_str:
                q.filter.return_value.scalar.return_value = 5
            elif "servicerequest" in model_str or "service_request" in model_str:
                q.filter.return_value.scalar.return_value = 3
            elif "providerearning" in model_str or "provider_earning" in model_str:
                q.filter.return_value.scalar.return_value = 1500.0
            else:
                q.filter.return_value.scalar.return_value = 0
            return q

        db.query.side_effect = query_side_effect

        result = get_provider_analytics(1, 1, db)
        assert result["period_days"] == 30
        assert result["quotes_sent"] == 5
        assert isinstance(result["total_earnings_30d"], float)
        assert len(result["daily_breakdown"]) == 7
