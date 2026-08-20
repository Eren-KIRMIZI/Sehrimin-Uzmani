from sqlalchemy import Boolean, Column, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.core.base.models import BaseModel


class City(BaseModel):
    __tablename__ = "cities"

    name = Column(String(100), nullable=False)
    plate_code = Column(String(10), unique=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)

    districts = relationship("District", back_populates="city", cascade="all, delete-orphan")


class District(BaseModel):
    __tablename__ = "districts"

    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)

    city = relationship("City", back_populates="districts")
    neighborhoods = relationship("Neighborhood", back_populates="district", cascade="all, delete-orphan")
    provider_locations = relationship("ProviderLocation", back_populates="district")


class Neighborhood(BaseModel):
    __tablename__ = "neighborhoods"

    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)

    district = relationship("District", back_populates="neighborhoods")


class ProviderLocation(BaseModel):
    __tablename__ = "provider_locations"
    __table_args__ = (
        Index("ix_provider_location_city_district", "city_id", "district_id"),
    )

    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True, index=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_primary = Column(Boolean, default=False)

    provider = relationship("ProviderProfile", back_populates="locations")
    city = relationship("City")
    district = relationship("District", back_populates="provider_locations")


class ProviderServiceArea(BaseModel):
    """Uzmanların hizmet verdikleri bölgeleri (mahalle bazında veya çap olarak) tanımlar"""
    __tablename__ = "provider_service_areas"

    provider_id = Column(Integer, ForeignKey("provider_profiles.id"), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True, index=True)
    neighborhood_id = Column(Integer, ForeignKey("neighborhoods.id"), nullable=True, index=True)
    max_distance_km = Column(Float, nullable=True) # Eğer lokasyon/çap bazlı çalışacaksa

    provider = relationship("ProviderProfile", back_populates="service_areas")
    city = relationship("City")
    district = relationship("District")
    neighborhood = relationship("Neighborhood")
