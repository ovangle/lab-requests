from typing import Optional
from uuid import UUID
from pydantic import Field

from api.lab.equipment.schemas import EquipmentRequest
from ..common.schemas import ResourceBase, ResourceCostEstimate, ResourceType

class EquipmentLease(ResourceBase):
    __resource_type__ = ResourceType.EQUIPMENT

    equipment: UUID | EquipmentRequest | None

    # Have any required inductions been 
    # previously completed?
    equipment_training_completed: list[str] = Field(default_factory=list)

    # Is the lab tech required in order to 
    # assist in the usage of the machine?
    requires_assistance: bool

    # Instructions to prepare for experiment
    setup_instructions: str

    # The estimated cost of usage of this equipment
    # over the course of the research
    # including consumables
    usage_cost_estimate: ResourceCostEstimate | None = None
