from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: str | None = None
    image: str | None = None
    description: str | None = None
    sort_order: int = 0


class SubCategoryCreate(BaseModel):
    name: str
    slug: str
    icon: str | None = None
    description: str | None = None
    sort_order: int = 0


class ServiceCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    sort_order: int = 0


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: str | None
    image: str | None
    description: str | None
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class SubCategoryResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    icon: str | None
    description: str | None
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class ServiceResponse(BaseModel):
    id: int
    subcategory_id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True
