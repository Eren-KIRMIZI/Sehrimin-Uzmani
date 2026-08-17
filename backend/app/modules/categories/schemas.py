from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0


class SubCategoryCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: int = 0


class ServiceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    sort_order: int = 0


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str]
    image: Optional[str]
    description: Optional[str]
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class SubCategoryResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    icon: Optional[str]
    description: Optional[str]
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class ServiceResponse(BaseModel):
    id: int
    subcategory_id: int
    name: str
    slug: str
    description: Optional[str]
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True
