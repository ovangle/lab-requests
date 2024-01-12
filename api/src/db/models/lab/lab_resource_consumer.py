from __future__ import annotations

from abc import abstractmethod
from typing import cast
from uuid import UUID
from sqlalchemy import select, Select
from sqlalchemy.ext.asyncio import async_object_session

from db import LocalSession

from ..base import Base
from .lab_resource import LabResourceDoesNotExist, LabResourceType, LabResource
from .resources import EquipmentLease, SoftwareLease, InputMaterial, OutputMaterial


class LabResourceConsumer(Base):
    __abstract__ = True

    @abstractmethod
    def select_resources(
        self, resource_type: LabResourceType
    ) -> Select[tuple[LabResource]]:
        ...

    def __get_session(self):
        session = async_object_session(self)
        if not isinstance(session, LocalSession):
            raise RuntimeError("Instance detached from session")
        return session

    def _get_resources(self, resource_type: LabResourceType):
        session = self.__get_session()
        return session.scalars(self.select_resources(resource_type))

    async def get_resource_for_id(
        self, resource_type: LabResourceType, id: UUID
    ) -> LabResource:
        db = self.__get_session()
        resources = self.select_resources(resource_type)
        r = await db.scalar(
            self.select_resources(resource_type).where(LabResource.id == id)
        )
        if not r:
            raise LabResourceDoesNotExist(for_id=id)
        return r

    @property
    async def equipment_leases(self) -> list[EquipmentLease]:
        return cast(
            list[EquipmentLease],
            list(await self._get_resources(LabResourceType.EQUIPMENT_LEASE)),
        )

    @property
    async def software_leases(self) -> list[SoftwareLease]:
        return cast(
            list[SoftwareLease],
            list(await self._get_resources(LabResourceType.SOFTWARE_LEASE)),
        )

    @property
    async def input_materials(self) -> list[InputMaterial]:
        return cast(
            list[InputMaterial],
            list(await self._get_resources(LabResourceType.INPUT_MATERIAL)),
        )

    @property
    async def output_materials(self) -> list[OutputMaterial]:
        return cast(
            list[OutputMaterial],
            list(await self._get_resources(LabResourceType.OUTPUT_MATERIAL)),
        )
