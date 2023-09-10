

from typing import Any, Coroutine
from uuid import UUID
from pydantic import BaseModel, Field

from api.base.schemas import ApiModel, ModelCreate, ModelPatch
from api.lab.plan.funding.models import ExperimentalPlanFundingModel
from api.utils.db import LocalSession

from . import models

class ExperimentalPlanFundingModelBase(BaseModel):
    description: str = Field(max_length=128)
    requires_supervisor: bool    

class ExperimentalPlanFundingModel(ExperimentalPlanFundingModelBase, ApiModel[models.ExperimentalPlanFundingModel]):
    id: UUID

    @classmethod
    def from_model(cls, model: models.ExperimentalPlanFundingModel):
        return cls(
            id=model.id,
            description=model.description,
            requires_supervisor=model.requires_supervisor,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

class ExperimentalPlanFundingModelPatch(ExperimentalPlanFundingModelBase, ModelPatch[models.ExperimentalPlanFundingModel]):
    async def do_update(self, db: LocalSession, model: Any) -> models.ExperimentalPlanFundingModel:
        if self.description != model.description:
            model.description = self.description
            db.add(model) 
        
        if self.requires_supervisor != model.requires_supervisor:
            model.requires_supervisor = self.requires_supervisor
            db.add(model)
        return model

class ExperimentalPlanFundingModelCreate(ExperimentalPlanFundingModelPatch, ModelCreate[models.ExperimentalPlanFundingModel]):
    async def do_create(self, db: LocalSession) -> models.ExperimentalPlanFundingModel:
        funding_model = models.ExperimentalPlanFundingModel()
        db.add(funding_model)
        return await self.do_update(db, funding_model)

