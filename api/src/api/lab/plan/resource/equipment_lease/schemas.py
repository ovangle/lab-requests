from typing import Optional
from uuid import UUID
from api.base.schemas import api_dataclass
from pydantic import Field

from api.src.api.lab.equipment.schemas import EquipmentPatch
from ..common.types import ResourceType
from ..common.schemas import Resource, ResourceCostEstimate

from api.lab.types import LabType

@api_dataclass()
class EquipmentLease(Resource):
    equipment_id: UUID | None

    # A request to add new equipment.
    equipment_request: EquipmentPatch | None

    # Have any required inductions been 
    # previously completed?
    is_training_completed: bool

    # Is the lab tech required in order to 
    # assist in the usage of the machine?
    require_assistance: bool

    # Instructions to prepare for experiment
    setupInstructions: str

    # The estimated cost of usage of this equipment
    # over the course of the research
    # including consumables
    usage_cost_estimate: ResourceCostEstimate | None

    def __post_init__(self):
        if self.equipment_id and self.equipment_request:
            raise ValueError('Cannot have both equipment id and new equipment')
