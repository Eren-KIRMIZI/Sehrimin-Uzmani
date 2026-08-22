from typing import Any

from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session, joinedload

from app.core.base.repository import BaseRepository
from app.modules.ads.enums import AdStatus
from app.modules.ads.models import Ad, AdAttribute, AdCategory, AdFavorite, AdImage


class AdRepository(BaseRepository[Ad, Any, Any]):
    def __init__(self):
        super().__init__(Ad)

    def get_with_relations(self, db: Session, ad_id: int) -> Ad | None:
        return (
            db.query(Ad)
            .options(
                joinedload(Ad.images),
                joinedload(Ad.attributes),
                joinedload(Ad.category),
                joinedload(Ad.city),
                joinedload(Ad.district),
            )
            .filter(Ad.id == ad_id)
            .first()
        )

    def search(
        self,
        db: Session,
        *,
        q: str | None = None,
        category_id: int | None = None,
        category_ids: list[int] | None = None,
        city_id: int | None = None,
        district_id: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        condition: str | None = None,
        user_id: int | None = None,
        status: str | None = AdStatus.ACTIVE.value,
        sort: str = "newest",
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Ad], int]:
        query = db.query(Ad).options(joinedload(Ad.images), joinedload(Ad.city))

        if status:
            query = query.filter(Ad.status == status)
        if q:
            like = f"%{q.lower()}%"
            query = query.filter(
                sql_func.lower(Ad.title_tr).like(like)
                | sql_func.lower(sql_func.coalesce(Ad.title_en, "")).like(like)
                | sql_func.lower(sql_func.coalesce(Ad.description_tr, "")).like(like)
                | sql_func.lower(sql_func.coalesce(Ad.description_en, "")).like(like)
            )
        if category_ids:
            query = query.filter(Ad.category_id.in_(category_ids))
        elif category_id:
            query = query.filter(Ad.category_id == category_id)
        if city_id:
            query = query.filter(Ad.city_id == city_id)
        if district_id:
            query = query.filter(Ad.district_id == district_id)
        if min_price is not None:
            query = query.filter(Ad.price >= min_price)
        if max_price is not None:
            query = query.filter(Ad.price <= max_price)
        if condition:
            query = query.filter(Ad.condition == condition)
        if user_id:
            query = query.filter(Ad.user_id == user_id)

        total = query.count()

        order_map = {
            "newest": Ad.published_at.desc().nullslast(),
            "oldest": Ad.published_at.asc().nullsfirst(),
            "price_asc": Ad.price.asc(),
            "price_desc": Ad.price.desc(),
        }
        query = query.order_by(
            Ad.is_featured.desc(), order_map.get(sort, order_map["newest"])
        )

        items = query.offset((max(page, 1) - 1) * limit).limit(min(limit, 50)).all()
        return items, total

    def get_category_tree(self, db: Session) -> list[AdCategory]:
        return (
            db.query(AdCategory)
            .filter(AdCategory.is_active.is_(True))
            .order_by(AdCategory.sort_order, AdCategory.id)
            .all()
        )

    def get_category_by_slug(self, db: Session, slug: str) -> AdCategory | None:
        return db.query(AdCategory).filter(AdCategory.slug == slug).first()

    def get_descendant_category_ids(self, db: Session, category_id: int) -> list[int]:
        """Kendi ID'si + tüm alt kategorilerin ID'leri."""
        ids = [category_id]
        children = (
            db.query(AdCategory.id).filter(AdCategory.parent_id == category_id).all()
        )
        for (child_id,) in children:
            ids.extend(self.get_descendant_category_ids(db, child_id))
        return ids

    def add_images(self, db: Session, ad: Ad, images: list[dict]) -> None:
        for i, img in enumerate(images):
            db.add(
                AdImage(
                    ad_id=ad.id,
                    url=img["url"],
                    thumbnail_url=img.get("thumbnail_url"),
                    sort_order=img.get("sort_order", i),
                    is_cover=img.get("is_cover", i == 0),
                )
            )

    def set_attributes(self, db: Session, ad_id: int, attributes: list[dict]) -> None:
        db.query(AdAttribute).filter(AdAttribute.ad_id == ad_id).delete()
        for attr in attributes:
            db.add(
                AdAttribute(
                    ad_id=ad_id,
                    attribute_key=attr["attribute_key"],
                    attribute_value=str(attr["attribute_value"]),
                )
            )

    def get_favorite(self, db: Session, user_id: int, ad_id: int) -> AdFavorite | None:
        return (
            db.query(AdFavorite)
            .filter(AdFavorite.user_id == user_id, AdFavorite.ad_id == ad_id)
            .first()
        )

    def count_active_ads(self, db: Session, user_id: int) -> int:
        return (
            db.query(sql_func.count(Ad.id))
            .filter(Ad.user_id == user_id, Ad.status == AdStatus.ACTIVE.value)
            .scalar()
            or 0
        )

    def similar_ads(self, db: Session, ad: Ad, limit: int = 8) -> list[Ad]:
        return (
            db.query(Ad)
            .options(joinedload(Ad.images))
            .filter(
                Ad.category_id == ad.category_id,
                Ad.status == AdStatus.ACTIVE.value,
                Ad.id != ad.id,
            )
            .order_by(Ad.published_at.desc())
            .limit(limit)
            .all()
        )
