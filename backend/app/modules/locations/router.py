from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.locations.models import City, District, ProviderLocation
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/cities")
def list_cities(db: Session = Depends(get_db)):
    cities = db.query(City).filter(City.is_active == True).order_by(City.name).all()
    return [{"id": c.id, "name": c.name, "plate_code": c.plate_code} for c in cities]


@router.get("/cities/{city_id}/districts")
def list_districts(city_id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise NotFoundException("Şehir")

    districts = db.query(District).filter(District.city_id == city_id, District.is_active == True).order_by(District.name).all()
    return [{"id": d.id, "name": d.name} for d in districts]
