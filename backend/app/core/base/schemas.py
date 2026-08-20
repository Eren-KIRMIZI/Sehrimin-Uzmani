from datetime import datetime

from pydantic import BaseModel as PydanticBaseModel
from pydantic import ConfigDict


class BaseSchema(PydanticBaseModel):
    """
    Pydantic için temel şema.
    from_attributes (eski orm_mode=True) ile SQLAlchemy modellerinden dönüşümü destekler.
    """
    model_config = ConfigDict(from_attributes=True)

class IDSchemaMixin(PydanticBaseModel):
    id: int

class TimestampSchemaMixin(PydanticBaseModel):
    created_at: datetime
    updated_at: datetime | None = None
