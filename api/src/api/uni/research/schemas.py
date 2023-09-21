from __future__ import annotations

from typing import Any, Coroutine, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from api.base.schemas import ApiModel, ModelCreate, ModelPatch
from db import LocalSession

from . import models

class FundingModelBase(BaseModel):
    name: str 
    description: str = Field(max_length=128)
    requires_supervisor: bool = True

class FundingModel(FundingModelBase, ApiModel[models.FundingModel_]):
    id: UUID

    @classmethod
    async def from_model(cls, model: FundingModel | models.FundingModel_):
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            requires_supervisor=model.requires_supervisor,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        return await cls.from_model(await models.FundingModel_.get_for_id(db, id))
    
    @classmethod
    async def get_for_name(cls, db: LocalSession, name: str):
        return await cls.from_model(await models.FundingModel_.get_for_name(db, name))

    def to_model(self, db: LocalSession):
        return models.FundingModel_.get_for_id(db, self.id)

class FundingModelPatch(FundingModelBase, ModelPatch[FundingModel, models.FundingModel_]):
    __api_model__ = FundingModel

    async def do_update(self, db: LocalSession, model: models.FundingModel_) -> models.FundingModel_:
        if self.description != model.description:
            model.description = self.description
            db.add(model) 
        
        if self.requires_supervisor != model.requires_supervisor:
            model.requires_supervisor = self.requires_supervisor
            db.add(model)
        return model


class FundingModelCreate(FundingModelBase, ModelCreate[FundingModel, models.FundingModel_]):
    __api_model__ = FundingModel

    async def do_create(self, db: LocalSession) -> models.FundingModel_:
        to_create = models.FundingModel_(**self.model_dump())
        db.add(to_create)
        return to_create