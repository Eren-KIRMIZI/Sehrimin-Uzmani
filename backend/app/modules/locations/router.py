from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.modules.locations.models import City, District

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/cities")
def list_cities(db: Session = Depends(get_db)):
    from app.core.cache import ref_cache
    cache_key = "locations:cities"
    cached = ref_cache.get(cache_key)
    if cached is not None:
        return cached

    cities = db.query(City).filter(City.is_active).order_by(City.name).all()
    result = [{"id": c.id, "name": c.name, "plate_code": c.plate_code} for c in cities]
    ref_cache.set(cache_key, result)
    return result


@router.get("/cities/{city_id}/districts")
def list_districts(city_id: int, db: Session = Depends(get_db)):
    from app.core.cache import ref_cache
    cache_key = f"locations:districts:{city_id}"
    cached = ref_cache.get(cache_key)
    if cached is not None:
        return cached

    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise NotFoundException("Şehir")

    districts = (
        db.query(District)
        .filter(District.city_id == city_id, District.is_active)
        .order_by(District.name)
        .all()
    )
    result = [{"id": d.id, "name": d.name} for d in districts]
    ref_cache.set(cache_key, result)
    return result
