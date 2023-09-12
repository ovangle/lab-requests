

from typing import Any, Coroutine, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from api.base.schemas import ApiModel, ModelCreate, ModelPatch
from api.utils.db import LocalSession

from . import models

class FundingModelBase(BaseModel):
    description: str = Field(max_length=128)
    requires_supervisor: bool = True

class FundingModel(ApiModel[models.FundingModel], FundingModelBase):
    id: UUID

    @classmethod
    async def from_model(cls, model: models.FundingModel):
        return cls(
            id=model.id,
            description=model.description,
            requires_supervisor=model.requires_supervisor,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

class FundingModelPatch(FundingModelBase, ModelPatch[FundingModel]):
    __api_model__ = FundingModel

    async def do_update(self, db: LocalSession, model: models.FundingModel) -> models.FundingModel:
        if self.description != model.description:
            model.description = self.description
            db.add(model) 
        
        if self.requires_supervisor != model.requires_supervisor:
            model.requires_supervisor = self.requires_supervisor
            db.add(model)
        return model


class FundingModelCreate(FundingModelBase, ModelCreate[FundingModel]):
    __api_model__ = FundingModel

    async def do_create(self, db: LocalSession) -> FundingModel:
        to_create = models.FundingModel()
        db.add(to_create)
        patch = FundingModelPatch(**self.model_dump())
        return await patch.do_update(db, to_create)