from typing import Generic, TypeVar, Optional, List, Any
from sqlalchemy.orm import Session
from app.core.base.repository import BaseRepository
from app.core.base.schemas import BaseSchema
from app.core.database import Base

RepositoryType = TypeVar("RepositoryType", bound=BaseRepository)
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseSchema)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseSchema)

class BaseService(Generic[RepositoryType, ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, repository: RepositoryType):
        self.repository = repository
        
    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        return self.repository.get(db=db, id=id)
        
    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return self.repository.get_multi(db=db, skip=skip, limit=limit)
        
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        obj = self.repository.create(db=db, obj_in=obj_in)
        db.commit()
        db.refresh(obj)
        return obj
        
    def update(self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType | dict) -> ModelType:
        obj = self.repository.update(db=db, db_obj=db_obj, obj_in=obj_in)
        db.commit()
        db.refresh(obj)
        return obj
        
    def remove(self, db: Session, *, id: int) -> ModelType:
        obj = self.repository.remove(db=db, id=id)
        db.commit()
        return obj
