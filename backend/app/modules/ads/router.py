from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.core.security import get_current_user, require_role
from app.modules.ads import schemas as ad_schemas
from app.modules.ads.enums import AdStatus
from app.modules.ads.models import AdCategory, AdReport
from app.modules.ads.repository import AdRepository
from app.modules.ads.service import AdService, build_seller_info
from app.modules.users.models import User

router = APIRouter(prefix="/ads", tags=["Ads"])

service = AdService()
repo = AdRepository()


def _to_list_item(db: Session, ad) -> dict:
    city_name = ad.city.name if ad.city else None
    district_name = ad.district.name if ad.district else None
    return {
        "id": ad.id,
        "title": ad.title,
        "price": ad.price,
        "currency": ad.currency,
        "price_type": ad.price_type,
        "status": ad.status,
        "condition": ad.condition,
        "is_featured": bool(ad.is_featured),
        "view_count": ad.view_count or 0,
        "favorite_count": ad.favorite_count or 0,
        "cover_image": ad.cover_image,
        "image_count": len(ad.images),
        "city_name": city_name,
        "district_name": district_name,
        "category_name": ad.category.name if ad.category else None,
        "category_slug": ad.category.slug if ad.category else None,
        "published_at": ad.published_at,
        "created_at": ad.created_at,
    }


# ── Public ───────────────────────────────────────────────────────────────────
@router.get("", response_model=ad_schemas.AdListResponse)
def list_ads(
    q: str | None = None,
    category: str | None = Query(default=None, description="Kategori slug"),
    city_id: int | None = None,
    district_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    condition: str | None = None,
    sort: str = "newest",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    category_ids = None
    if category:
        cat = repo.get_category_by_slug(db, category)
        if not cat:
            raise NotFoundException("Kategori")
        category_ids = repo.get_descendant_category_ids(db, cat.id)

    items, total = repo.search(
        db,
        q=q,
        category_ids=category_ids,
        city_id=city_id,
        district_id=district_id,
        min_price=min_price,
        max_price=max_price,
        condition=condition,
        sort=sort,
        page=page,
        limit=limit,
    )
    return {
        "items": [_to_list_item(db, ad) for ad in items],
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
    }


@router.get("/categories", response_model=list[ad_schemas.AdCategoryOut])
def list_ad_categories(db: Session = Depends(get_db)):
    return repo.get_category_tree(db)


@router.get("/my/listings")
def my_ads(
    status: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = repo.search(
        db,
        user_id=current_user.id,
        status=status,
        sort="newest",
        page=1,
        limit=50,
    )
    return {
        "items": [_to_list_item(db, ad) for ad in items],
        "total": total,
        "page": 1,
        "limit": 50,
        "has_next": False,
    }


@router.get("/my/favorites", response_model=list[ad_schemas.AdListItem])
def my_favorite_ads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ads = service.list_user_favorites(db, current_user.id)
    return [ad_schemas.AdListItem(**_to_list_item(db, ad)) for ad in ads]


@router.get("/{ad_id}", response_model=ad_schemas.AdDetailOut)
def get_ad(
    ad_id: int,
    current_user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    service.record_view(db, ad, current_user.id if current_user else None)

    data = ad_schemas.AdOut.model_validate(ad).model_dump()
    data["category"] = (
        ad_schemas.AdCategoryOut.model_validate(ad.category).model_dump()
        if ad.category
        else None
    )
    data["seller"] = build_seller_info(db, ad)
    data["city_name"] = ad.city.name if ad.city else None
    data["district_name"] = ad.district.name if ad.district else None
    data["is_favorite"] = service.is_favorite(
        db, current_user.id if current_user else None, ad.id
    )
    if ad.show_phone and ad.phone:
        data["seller_phone"] = ad.phone
    return data


@router.get("/{ad_id}/similar", response_model=list[ad_schemas.AdListItem])
def similar_ads(ad_id: int, db: Session = Depends(get_db)):
    ad = service.get_ad_or_404(db, ad_id)
    ads = repo.similar_ads(db, ad)
    return [ad_schemas.AdListItem(**_to_list_item(db, a)) for a in ads]


# ── Kullanıcı ────────────────────────────────────────────────────────────────
@router.post("", response_model=ad_schemas.AdDetailOut, status_code=201)
def create_ad(
    data: ad_schemas.AdCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.create_ad(db, current_user, data)
    return _detail_response(db, ad, current_user)


def _detail_response(db: Session, ad, current_user):
    data = ad_schemas.AdOut.model_validate(ad).model_dump()
    data["category"] = (
        ad_schemas.AdCategoryOut.model_validate(ad.category).model_dump()
        if ad.category
        else None
    )
    data["seller"] = build_seller_info(db, ad)
    data["city_name"] = ad.city.name if ad.city else None
    data["district_name"] = ad.district.name if ad.district else None
    data["is_favorite"] = False
    return data


@router.patch("/{ad_id}", response_model=ad_schemas.AdDetailOut)
def update_ad(
    ad_id: int,
    data: ad_schemas.AdUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    ad = service.update_ad(db, ad, data, current_user)
    return _detail_response(db, ad, current_user)


@router.delete("/{ad_id}")
def delete_ad(
    ad_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    service.delete_ad(db, ad, current_user)
    return {"message": "İlan silindi"}


@router.post("/{ad_id}/publish")
def publish_ad(
    ad_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    ad = service.publish_ad(db, ad, current_user)
    return {"message": "İlan yayınlandı", "status": ad.status, "expires_at": ad.expires_at}


@router.post("/{ad_id}/pause")
def pause_ad(
    ad_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    ad = service.pause_ad(db, ad, current_user)
    return {"message": "İlan duraklatıldı", "status": ad.status}


@router.post("/{ad_id}/sold")
def mark_sold(
    ad_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    ad = service.mark_sold(db, ad, current_user)
    return {"message": "İlan satıldı olarak işaretlendi", "status": ad.status}


# ── Fotoğraflar ──────────────────────────────────────────────────────────────
@router.post("/{ad_id}/images", status_code=201)
def add_images(
    ad_id: int,
    images: list[ad_schemas.AdImageIn],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    if ad.user_id != current_user.id and current_user.role != "ADMIN":
        raise ForbiddenException()
    if len(ad.images) + len(images) > 20:
        from app.core.exceptions import BadRequestException

        raise BadRequestException("En fazla 20 fotoğraf ekleyebilirsiniz")
    repo.add_images(db, ad, [img.model_dump() for img in images])
    db.commit()
    return {"message": "Fotoğraflar eklendi", "image_count": len(ad.images)}


@router.delete("/{ad_id}/images/{image_id}")
def delete_image(
    ad_id: int,
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.modules.ads.models import AdImage

    ad = service.get_ad_or_404(db, ad_id)
    if ad.user_id != current_user.id and current_user.role != "ADMIN":
        raise ForbiddenException()

    image = db.query(AdImage).filter(
        AdImage.id == image_id, AdImage.ad_id == ad_id
    ).first()
    if not image:
        raise NotFoundException("Fotoğraf")
    db.delete(image)
    db.commit()
    return {"message": "Fotoğraf silindi"}


# ── Favori ───────────────────────────────────────────────────────────────────
@router.post("/{ad_id}/favorite")
def toggle_favorite(
    ad_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    return service.toggle_favorite(db, current_user, ad)


# ── İletişim ─────────────────────────────────────────────────────────────────
@router.post("/{ad_id}/contact")
def contact_seller(
    ad_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    return service.contact_seller(db, current_user, ad)


# ── Raporlama ────────────────────────────────────────────────────────────────
@router.post("/{ad_id}/report", status_code=201)
def report_ad(
    ad_id: int,
    data: ad_schemas.AdReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ad = service.get_ad_or_404(db, ad_id)
    report = service.report_ad(db, current_user, ad, data.reason, data.description)
    return {"message": "Rapor alındı, ekibimiz en kısa sürede inceleyecek", "report_id": report.id}


# ── Admin moderasyon ─────────────────────────────────────────────────────────
admin_router = APIRouter(prefix="/admin/ads", tags=["Admin", "Ads"])


@admin_router.get("")
def admin_list_ads(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    items, total = repo.search(
        db, q=q, status=status, sort="newest", page=page, limit=limit
    )
    return {
        "items": [_to_list_item(db, ad) for ad in items],
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
    }


@admin_router.get("/reports")
def admin_list_reports(
    status: str = "OPEN",
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(AdReport)
        .filter(AdReport.status == status)
        .order_by(AdReport.created_at.desc())
        .all()
    )
    result = []
    for r in reports:
        result.append(
            {
                "id": r.id,
                "ad_id": r.ad_id,
                "reason": r.reason,
                "description": r.description,
                "status": r.status,
                "created_at": r.created_at,
                "reporter_id": r.reporter_id,
            }
        )
    return result


@admin_router.patch("/reports/{report_id}")
def admin_resolve_report(
    report_id: int,
    action: str,  # RESOLVED | DISMISSED
    reject_ad: bool = False,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    report = db.query(AdReport).filter(AdReport.id == report_id).first()
    if not report:
        raise NotFoundException("Rapor")

    report.status = action
    if reject_ad:
        ad = db.query(Ad).filter(Ad.id == report.ad_id).first()
        if ad:
            ad.status = AdStatus.REJECTED.value
    db.commit()
    return {"message": "Rapor güncellendi", "status": report.status}


@admin_router.post("/{ad_id}/reject")
def admin_reject_ad(
    ad_id: int,
    reason: str = "",
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    if not ad:
        raise NotFoundException("İlan")
    ad.status = AdStatus.REJECTED.value
    db.commit()
    return {"message": "İlan reddedildi", "status": ad.status}
