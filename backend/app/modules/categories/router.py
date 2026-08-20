from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.core.security import require_role
from app.modules.categories.models import Category, Service, SubCategory
from app.modules.categories.schemas import (
    CategoryCreate,
    ServiceCreate,
    SubCategoryCreate,
)
from app.modules.users.models import User

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    categories = (
        db.query(Category)
        .filter(Category.is_active)
        .order_by(Category.sort_order)
        .all()
    )
    result = []
    for cat in categories:
        subcats = (
            db.query(SubCategory)
            .filter(SubCategory.category_id == cat.id, SubCategory.is_active)
            .order_by(SubCategory.sort_order)
            .all()
        )
        result.append(
            {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "icon": cat.icon,
                "image": cat.image,
                "description": cat.description,
                "subcategories": [
                    {
                        "id": sc.id,
                        "name": sc.name,
                        "slug": sc.slug,
                        "icon": sc.icon,
                        "services": [
                            {"id": s.id, "name": s.name, "slug": s.slug}
                            for s in db.query(Service)
                            .filter(Service.subcategory_id == sc.id, Service.is_active)
                            .order_by(Service.sort_order)
                            .all()
                        ],
                    }
                    for sc in subcats
                ],
            }
        )
    return result


@router.get("/{slug}")
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug, Category.is_active).first()
    if not cat:
        raise NotFoundException("Kategori")

    subcats = (
        db.query(SubCategory)
        .filter(SubCategory.category_id == cat.id, SubCategory.is_active)
        .order_by(SubCategory.sort_order)
        .all()
    )
    return {
        "id": cat.id,
        "name": cat.name,
        "slug": cat.slug,
        "icon": cat.icon,
        "image": cat.image,
        "description": cat.description,
        "subcategories": [
            {
                "id": sc.id,
                "name": sc.name,
                "slug": sc.slug,
                "icon": sc.icon,
                "services": [
                    {"id": s.id, "name": s.name, "slug": s.slug}
                    for s in db.query(Service)
                    .filter(Service.subcategory_id == sc.id, Service.is_active)
                    .all()
                ],
            }
            for sc in subcats
        ],
    }


@router.get("/{slug}/services")
def get_category_services(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        raise NotFoundException("Kategori")

    subcat_ids = [
        sc.id
        for sc in db.query(SubCategory).filter(SubCategory.category_id == cat.id).all()
    ]
    services = (
        db.query(Service)
        .filter(Service.subcategory_id.in_(subcat_ids), Service.is_active)
        .all()
    )
    return [
        {"id": s.id, "name": s.name, "slug": s.slug, "subcategory_id": s.subcategory_id}
        for s in services
    ]


@router.post("/admin")
def admin_create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"message": "Kategori oluşturuldu", "category": cat}


@router.post("/admin/{category_id}/subcategories")
def admin_create_subcategory(
    category_id: int,
    data: SubCategoryCreate,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise NotFoundException("Kategori")

    subcat = SubCategory(category_id=category_id, **data.model_dump())
    db.add(subcat)
    db.commit()
    db.refresh(subcat)
    return {"message": "Alt kategori oluşturuldu", "subcategory": subcat}


@router.post("/admin/subcategories/{subcategory_id}/services")
def admin_create_service(
    subcategory_id: int,
    data: ServiceCreate,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    subcat = db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()
    if not subcat:
        raise NotFoundException("Alt kategori")

    service = Service(subcategory_id=subcategory_id, **data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return {"message": "Hizmet oluşturuldu", "service": service}
