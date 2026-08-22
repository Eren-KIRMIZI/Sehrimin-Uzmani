from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None = None
    name: str
    slug: str
    icon: str | None = None
    sort_order: int = 0


class AdImageIn(BaseModel):
    url: str = Field(max_length=500)
    thumbnail_url: str | None = None
    sort_order: int = 0
    is_cover: bool = False


class AdImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    thumbnail_url: str | None = None
    sort_order: int
    is_cover: bool


class AdAttributeIn(BaseModel):
    attribute_key: str = Field(max_length=100)
    attribute_value: str = Field(max_length=255)


class AdAttributeOut(AdAttributeIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AdCreate(BaseModel):
    category_id: int
    title_tr: str = Field(min_length=5, max_length=200)
    description_tr: str | None = None
    title_en: str | None = Field(default=None, max_length=200)
    description_en: str | None = None
    price: float | None = Field(default=None, ge=0)
    currency: str = "TRY"
    price_type: str = "FIXED"  # FIXED, NEGOTIABLE, FREE
    condition: str | None = None  # NEW, LIKE_NEW, GOOD, USED
    city_id: int
    district_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_negotiable: bool = False
    show_phone: bool = True
    phone: str | None = Field(default=None, max_length=20)
    images: list[AdImageIn] = []
    attributes: list[AdAttributeIn] = []


class AdUpdate(BaseModel):
    title_tr: str | None = Field(default=None, min_length=5, max_length=200)
    description_tr: str | None = None
    title_en: str | None = Field(default=None, max_length=200)
    description_en: str | None = None
    price: float | None = Field(default=None, ge=0)
    price_type: str | None = None
    condition: str | None = None
    city_id: int | None = None
    district_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_negotiable: bool | None = None
    show_phone: bool | None = None
    phone: str | None = None
    attributes: list[AdAttributeIn] | None = None


class SellerOut(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    avatar: str | None = None
    phone_verified: bool = False
    email_verified: bool = False
    provider_id: int | None = None
    business_name: str | None = None
    rating: float | None = None
    review_count: int | None = None
    active_ad_count: int = 0


class AdOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title_tr: str
    description_tr: str | None = None
    title_en: str | None = None
    description_en: str | None = None
    price: float | None = None
    currency: str
    price_type: str
    status: str
    condition: str | None = None
    is_negotiable: bool
    is_featured: bool
    view_count: int
    favorite_count: int
    contact_count: int
    published_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime | None = None
    images: list[AdImageOut] = []
    attributes: list[AdAttributeOut] = []


class AdDetailOut(AdOut):
    category: AdCategoryOut | None = None
    seller: SellerOut | None = None
    city_name: str | None = None
    district_name: str | None = None
    is_favorite: bool = False
    seller_phone: str | None = None


class AdListItem(BaseModel):
    id: int
    title_tr: str
    title_en: str | None = None
    price: float | None = None
    currency: str
    price_type: str
    status: str
    condition: str | None = None
    is_featured: bool
    view_count: int
    favorite_count: int
    cover_image: str | None = None
    image_count: int = 0
    city_name: str | None = None
    district_name: str | None = None
    category_name: str | None = None
    category_slug: str | None = None
    published_at: datetime | None = None
    created_at: datetime | None = None


class AdListResponse(BaseModel):
    items: list[AdListItem]
    total: int
    page: int
    limit: int
    has_next: bool


class MyAdItem(AdListItem):
    attributes: list[AdAttributeOut] = []


class AdReportCreate(BaseModel):
    reason: str = Field(max_length=100)
    description: str | None = None
