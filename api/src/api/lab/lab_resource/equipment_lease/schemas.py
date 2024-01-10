from __future__ import annotations
from datetime import datetime

from typing import Optional
from uuid import UUID, uuid4
from fastapi import HTTPException
from pydantic import Field

from ...lab_equipment.schemas import LabEquipmentCreateRequest
from ..common.schemas import (
    ResourceBase,
    ResourceCostEstimate,
    ResourceParams,
    ResourceType,
)


class EquipmentLease(ResourceBase):
    __resource_type__ = ResourceType.EQUIPMENT

    equipment: UUID | LabEquipmentCreateRequest

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

    @classmethod
    def create(
        cls,
        container: UUID,
        index: int,
        params: ResourceParams,
    ):
        if not isinstance(params, EquipmentLeaseParams):
            raise TypeError("Expected EquipmentLeaseParams")

        return cls(
            container_id=container,
            id=params.id or uuid4(),
            index=index,
            equipment=params.equipment,
            requires_assistance=params.requires_assistance,
            usage_cost_estimate=params.usage_cost_estimate,
            setup_instructions=params.setup_instructions,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

    def apply(self, params: ResourceParams):
        params = EquipmentLeaseParams(**params.model_dump())

        match params.equipment:
            case UUID():
                if params.equipment != self.equipment:
                    raise HTTPException(409, "cannot update equipment")
            case LabEquipmentCreateRequest():
                if isinstance(params.equipment, UUID):
                    self.equipment = params.equipment
                elif params.equipment != self.equipment:
                    raise HTTPException(409, "cannot update equipment")

        self.equipment_training_completed = set(params.equipment_training_completed)
        self.requires_assistance = params.requires_assistance
        self.usage_cost_estimate = params.usage_cost_estimate
        return super().apply(params)


class EquipmentLeaseParams(ResourceParams):
    equipment: UUID | LabEquipmentCreateRequest
    requires_assistance: bool = False
    setup_instructions: str = ""

    usage_cost_estimate: ResourceCostEstimate | None = None
