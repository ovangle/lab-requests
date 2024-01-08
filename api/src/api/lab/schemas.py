from __future__ import annotations
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel

from db import LocalSession
from db.models.uni import Discipline
from db.models.lab import Lab

from ..base.schemas import ModelResponse

if TYPE_CHECKING:
    from api.uni.schemas import CampusResponse


class LabResponse(ModelResponse[Lab]):
    id: UUID
    type: Discipline
    campus: CampusResponse

    @classmethod
    async def from_model(cls, lab: Lab, **kwargs):
        from api.uni.schemas import CampusResponse

        campus = await CampusResponse.from_model(await lab.awaitable_attrs.campus)
        return cls(
            id=lab.id,
            type=lab.discipline,
            campus=campus,
            created_at=lab.created_at,
            updated_at=lab.updated_at,
        )
