import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.core.redis import redis_client
from app.modules.ads.enums import AdPriceType, AdStatus
from app.modules.ads.models import Ad, AdFavorite, AdReport
from app.modules.ads.repository import AdRepository
from app.modules.providers.models import ProviderProfile
from app.modules.users.models import User

logger = logging.getLogger(__name__)

MAX_IMAGES = 20
AD_DURATION_DAYS = 30
MAX_ACTIVE_ADS_PER_USER = 50
VIEW_DEDUP_SECONDS = 3600  # Aynı kullanıcı 1 saat içinde tekrar açarsa sayılmaz


class AdService:
    def __init__(self):
        self.repo = AdRepository()

    # ── Queries ──────────────────────────────────────────────────────────────
    def get_ad_or_404(self, db: Session, ad_id: int) -> Ad:
        ad = self.repo.get_with_relations(db, ad_id)
        if not ad or ad.status == AdStatus.DELETED.value:
            raise NotFoundException("İlan")
        return ad

    def record_view(self, db: Session, ad: Ad, user_id: int | None) -> None:
        """Görüntülenme sayacı — Redis ile tekilleştirilmiş."""
        identity = f"user:{user_id}" if user_id else "anon"
        key = f"ad:view:{ad.id}:{identity}"
        try:
            if redis_client.set(key, 1, ex=VIEW_DEDUP_SECONDS, nx=True):
                ad.view_count += 1
                db.commit()
        except Exception:
            # Redis erişilemezse sayaç yine de artsın
            ad.view_count += 1
            db.commit()

    def is_favorite(self, db: Session, user_id: int | None, ad_id: int) -> bool:
        if not user_id:
            return False
        return self.repo.get_favorite(db, user_id, ad_id) is not None

    # ── Mutations ────────────────────────────────────────────────────────────
    def validate_ad_data(self, price_type: str, price: float | None) -> None:
        if price_type == AdPriceType.FREE.value:
            return
        if price is None:
            raise BadRequestException("Ücretsiz ilan dışında fiyat zorunludur")

    def create_ad(self, db: Session, user: User, data) -> Ad:
        from app.modules.ads.models import AdCategory

        category = (
            db.query(AdCategory).filter(AdCategory.id == data.category_id).first()
        )
        if not category:
            raise NotFoundException("Kategori")

        active_count = self.repo.count_active_ads(db, user.id)
        if active_count >= MAX_ACTIVE_ADS_PER_USER:
            raise BadRequestException(
                f"Aynı anda en fazla {MAX_ACTIVE_ADS_PER_USER} aktif ilanınız olabilir"
            )

        self.validate_ad_data(data.price_type, data.price)

        if len(data.images) > MAX_IMAGES:
            raise BadRequestException(
                f"En fazla {MAX_IMAGES} fotoğraf ekleyebilirsiniz"
            )

        ad = Ad(
            user_id=user.id,
            category_id=data.category_id,
            title_tr=data.title_tr.strip(),
            description_tr=data.description_tr,
            title_en=data.title_en.strip() if data.title_en else None,
            description_en=data.description_en,
            price=data.price,
            currency=data.currency or "TRY",
            price_type=data.price_type,
            condition=data.condition,
            city_id=data.city_id,
            district_id=data.district_id,
            latitude=data.latitude,
            longitude=data.longitude,
            is_negotiable=data.is_negotiable,
            show_phone=data.show_phone,
            phone=data.phone or user.phone,
            status=AdStatus.DRAFT.value,
        )
        db.add(ad)
        db.flush()

        if data.images:
            self.repo.add_images(db, ad, [img.model_dump() for img in data.images])
        if data.attributes:
            self.repo.set_attributes(
                db, ad.id, [a.model_dump() for a in data.attributes]
            )
        db.commit()
        db.refresh(ad)
        return ad

    def update_ad(self, db: Session, ad: Ad, data, user: User) -> Ad:
        if ad.user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException("Bu ilanı düzenleme yetkiniz yok")
        if ad.status in (AdStatus.SOLD.value, AdStatus.DELETED.value):
            raise BadRequestException("Satılmış veya silinmiş ilan düzenlenemez")

        update_data = data.model_dump(exclude_unset=True, exclude={"attributes"})
        for field, value in update_data.items():
            setattr(ad, field, value)

        if data.attributes is not None:
            self.repo.set_attributes(
                db, ad.id, [a.model_dump() for a in data.attributes]
            )
        db.commit()
        db.refresh(ad)
        return ad

    def publish_ad(self, db: Session, ad: Ad, user: User) -> Ad:
        if ad.user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException("Bu ilanı yayınlama yetkiniz yok")
        if ad.status not in (AdStatus.DRAFT.value, AdStatus.PAUSED.value):
            raise BadRequestException(
                "Sadece taslak veya duraklatılmış ilanlar yayınlanabilir"
            )
        if not ad.images:
            raise BadRequestException("Yayınlamak için en az bir fotoğraf ekleyin")

        now = datetime.now(timezone.utc)
        ad.status = AdStatus.ACTIVE.value
        ad.published_at = now
        ad.expires_at = now + timedelta(days=AD_DURATION_DAYS)
        db.commit()
        db.refresh(ad)
        return ad

    def pause_ad(self, db: Session, ad: Ad, user: User) -> Ad:
        if ad.user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException()
        if ad.status != AdStatus.ACTIVE.value:
            raise BadRequestException("Sadece aktif ilanlar duraklatılabilir")
        ad.status = AdStatus.PAUSED.value
        db.commit()
        return ad

    def mark_sold(self, db: Session, ad: Ad, user: User) -> Ad:
        if ad.user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException()
        if ad.status not in (AdStatus.ACTIVE.value, AdStatus.PAUSED.value):
            raise BadRequestException("Geçersiz ilan durumu")
        ad.status = AdStatus.SOLD.value
        db.commit()
        return ad

    def delete_ad(self, db: Session, ad: Ad, user: User) -> None:
        if ad.user_id != user.id and user.role != "ADMIN":
            raise ForbiddenException()
        ad.status = AdStatus.DELETED.value
        db.commit()

    # ── Favorites ────────────────────────────────────────────────────────────
    def toggle_favorite(self, db: Session, user: User, ad: Ad) -> dict:
        fav = self.repo.get_favorite(db, user.id, ad.id)
        if fav:
            db.delete(fav)
            ad.favorite_count = max(0, (ad.favorite_count or 0) - 1)
            db.commit()
            return {"is_favorite": False, "message": "Favorilerden çıkarıldı"}

        db.add(AdFavorite(user_id=user.id, ad_id=ad.id))
        ad.favorite_count = (ad.favorite_count or 0) + 1
        db.commit()
        return {"is_favorite": True, "message": "Favorilere eklendi"}

    def list_user_favorites(self, db: Session, user_id: int) -> list[Ad]:
        return (
            db.query(Ad)
            .join(AdFavorite, AdFavorite.ad_id == Ad.id)
            .filter(AdFavorite.user_id == user_id, Ad.status == AdStatus.ACTIVE.value)
            .order_by(AdFavorite.created_at.desc())
            .all()
        )

    # ── Contact ──────────────────────────────────────────────────────────────
    def contact_seller(self, db: Session, buyer: User, ad: Ad) -> dict:
        if ad.user_id == buyer.id:
            raise BadRequestException("Kendi ilanınuzla iletişime geçemezsiniz")

        ad.contact_count += 1

        seller_provider = (
            db.query(ProviderProfile)
            .filter(ProviderProfile.user_id == ad.user_id)
            .first()
        )
        result: dict = {"contact_count": ad.contact_count}
        db.commit()

        if seller_provider:
            from app.modules.messaging.models import Conversation

            conv = (
                db.query(Conversation)
                .filter(
                    Conversation.customer_id == buyer.id,
                    Conversation.provider_id == seller_provider.id,
                )
                .first()
            )
            if not conv:
                conv = Conversation(
                    customer_id=buyer.id, provider_id=seller_provider.id
                )
                db.add(conv)
                db.commit()
                db.refresh(conv)
            result["conversation_id"] = conv.id
            return result

        result["conversation_id"] = None
        result["message"] = (
            "Satıcı uzman profili oluşturmamış. Satıcı telefon paylaşmışsa "
            "telefon üzerinden iletişime geçebilirsiniz."
        )
        return result

    # ── Reports ──────────────────────────────────────────────────────────────
    def report_ad(
        self, db: Session, user: User, ad: Ad, reason: str, description: str | None
    ) -> AdReport:
        report = AdReport(
            ad_id=ad.id,
            reporter_id=user.id,
            reason=reason,
            description=description,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report


def build_seller_info(db: Session, ad: Ad) -> dict:
    seller = db.query(User).filter(User.id == ad.user_id).first()
    if not seller:
        return None
    provider = (
        db.query(ProviderProfile).filter(ProviderProfile.user_id == seller.id).first()
    )
    active_count = AdRepository().count_active_ads(db, seller.id)
    return {
        "id": seller.id,
        "first_name": seller.first_name,
        "last_name": seller.last_name,
        "avatar": seller.avatar,
        "phone_verified": bool(seller.phone_verified),
        "email_verified": bool(seller.email_verified),
        "provider_id": provider.id if provider else None,
        "business_name": provider.business_name if provider else None,
        "rating": provider.rating if provider else None,
        "review_count": provider.review_count if provider else None,
        "active_ad_count": active_count,
    }
