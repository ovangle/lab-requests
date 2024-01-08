from __future__ import annotations
from enum import Enum

from typing import TYPE_CHECKING, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, TypeAdapter
from pydantic.dataclasses import dataclass

from db import LocalSession
from db.models.uni import Campus

from ..base.schemas import ModelCreateRequest, ModelResponse, ModelUpdateRequest


class CampusResponse(ModelResponse[Campus]):
    id: UUID
    code: str
    name: str

    @classmethod
    async def from_model(cls, model: Campus, **kwargs):
        assert not kwargs
        return cls(
            id=model.id,
            code=model.code,
            name=model.name,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class CampusUpdateRequest(ModelUpdateRequest[Campus]):
    pass


class CampusCreateRequest(ModelCreateRequest[Campus]):
    pass
