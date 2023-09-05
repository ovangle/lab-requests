
from uuid import UUID
from api.base.schemas import api_dataclass

from ..types import LabType

@api_dataclass()
class EquipmentPatch:
    name: str
    description: str

    available_in_lab_types: list[LabType]

@api_dataclass()
class Equipment(EquipmentPatch):
    id: UUID

