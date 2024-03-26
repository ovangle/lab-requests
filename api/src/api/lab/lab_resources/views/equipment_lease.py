from typing import Any, Awaitable, Callable, TypeVar
from uuid import UUID
from fastapi import APIRouter, Depends
from api.lab.lab_resources.schemas.equipment_lease import (
    LabEquipmentLeaseIndex,
    LabEquipmentLeaseParams,
    LabEquipmentLeaseView,
)
from db import LocalSession, get_db
from db.models.base import Base
from db.models.lab.lab_resource_consumer import LabResourceConsumer

TConsumer = TypeVar("TConsumer", bound=LabResourceConsumer)


def register_equipment_lease_views(
    router: APIRouter,
    prefix: str,
    fetch_container: Callable[[LocalSession, UUID], Awaitable[TConsumer]],
):
    @router.get(f"{prefix}/{{container_id}}/equipment-leases/")
    async def index_equipment_leases(
        container_id: UUID, db=Depends(get_db)
    ) -> LabEquipmentLeaseIndex:
        container = await fetch_container(db, container_id)
        raise NotImplementedError

    @router.get(f"{prefix}/{{container_id}}/equipment-leases/{{id}}")
    async def get_equipment_lease(
        container_id: UUID, id: UUID | int
    ) -> LabEquipmentLeaseView:
        raise NotImplementedError

    @router.post(f"{prefix}/{{container_id}}/equipment-leases/add")
    async def add_equipment_lease(container_id: UUID, params: LabEquipmentLeaseParams):
        raise NotImplementedError

    @router.post(f"{prefix}/{{container_id}}/equipment-leases/{{id}}")
    async def replace_equipment_lease_at(
        container_id: UUID, id: UUID | int, params: LabEquipmentLeaseParams
    ) -> LabEquipmentLeaseView:
        raise NotImplementedError

    @router.delete(f"{prefix}/{{container_id}}/equipment-leases/{{id}}")
    async def delete_equipment(container_id: UUID, id: UUID) -> None:
        raise NotImplementedError
