from __future__ import annotations

from typing import Optional
from uuid import UUID
from fastapi import HTTPException
from pydantic import Field

from api.lab.equipment.schemas import EquipmentRequest
from ..common.schemas import ResourceBase, ResourceCostEstimate, ResourceParams, ResourceType

class EquipmentLease(ResourceBase):
    __resource_type__ = ResourceType.EQUIPMENT

    equipment: UUID | EquipmentRequest

    # Have any required inductions been 
    # previously completed?
    equipment_training_completed: set[str]

    # Is the lab tech required in order to 
    # assist in the usage of the machine?
    requires_assistance: bool

    # Instructions to prepare for experiment
    setup_instructions: str

    # The estimated cost of usage of this equipment
    # over the course of the research
    # including consumables
    usage_cost_estimate: ResourceCostEstimate | None = None

    def __init__(self, container_id: UUID, index: int, params: EquipmentLeaseParams):
        super().__init__(container_id, index, params)
        self.equipment = params.equipment
        self.equipment_training_completed = set(params.equipment_training_completed)
        self.requires_assistance = params.requires_assistance
        self.usage_cost_estimate = params.usage_cost_estimate

    def apply(self, params: ResourceParams[EquipmentLease]):
        params = EquipmentLeaseParams(**params.model_dump())

        match params.equipment:
            case UUID():
                if params.equipment != self.equipment:
                    raise HTTPException(409, 'cannot update equipment')
            case EquipmentRequest():
                if isinstance(params.equipment, UUID):
                    self.equipment = params.equipment
                elif params.equipment != self.equipment:
                    raise HTTPException(409, 'cannot update equipment')

        self.equipment_training_completed = set(params.equipment_training_completed)
        self.requires_assistance = params.requires_assistance
        self.usage_cost_estimate = params.usage_cost_estimate
        return super().apply(params)


class EquipmentLeaseParams(ResourceParams[EquipmentLease]):
    equipment: UUID | EquipmentRequest
    equipment_training_completed: set[str] = Field(default_factory=set)
    requires_assistance: bool = False
    setup_instructions: str = ''

    usage_cost_estimate: ResourceCostEstimate | None = None
