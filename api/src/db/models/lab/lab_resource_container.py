from __future__ import annotations

from typing import Any, cast
from uuid import UUID, uuid4
from sqlalchemy import ForeignKey, Insert, Update, select, Select
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy.ext.asyncio import async_object_session

from db import LocalSession
from db.models.base.errors import DoesNotExist

from ..base import Base, fields
from ..base.fields import uuid_pk
from .lab_resource import LabResourceDoesNotExist, LabResourceType, LabResource
from .resources import EquipmentLease, SoftwareLease, InputMaterial, OutputMaterial


class LabResourceContainerDoesNotExist(DoesNotExist):
    def __init__(
        self,
        for_id: UUID | None = None,
        for_consumer: LabResourceConsumer | UUID | None = None,
    ):
        if for_id:
            return super().__init__(for_id=for_id)

        if for_consumer:
            for_consumer_id = (
                for_consumer if isinstance(for_consumer, UUID) else for_consumer.id
            )
            msg = f"No container exists for consumer with id {for_consumer_id}"
            return super().__init__(msg)

        assert False


class LabResourceContainer(Base):
    __tablename__ = "lab_resource_container"

    id: Mapped[uuid_pk]
    resources: Mapped[list[LabResource]] = relationship()

    def select_resources(
        self, resource_type: LabResourceType
    ) -> Select[tuple[LabResource]]:
        return select(resource_type.py_type).where(
            LabResource.container_id == self.id, LabResource.type == resource_type
        )

    async def create_resource(
        self, resource_type: LabResourceType, at_index: int, **attrs: dict[str, Any]
    ) -> Insert:
        raise NotImplementedError

    def update_resource(self, resource: LabResource, **attrs: dict[str, Any]) -> Update:
        raise NotImplementedError

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
        r = await db.get(resource_type.py_type, id)
        if r is None:
            raise LabResourceDoesNotExist(for_id=id)
        return r

    async def get_resource_at_index(
        self, resource_type: LabResourceType, index: int
    ) -> LabResource:
        return await resource_type.py_type.get_for_container_index(
            self.__get_session(), self, index
        )

    @property
    async def equipment_leases(self) -> list[EquipmentLease]:
        return cast(
            list[EquipmentLease],
            list(await self._get_resources(LabResourceType.EQUIPMENT_LEASE)),
        )

    async def get_equipment_lease_for_id(self, id: UUID):
        return await self.get_resource_for_id(LabResourceType.EQUIPMENT_LEASE, id)

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


def select_mapped_consumer_container_id(consumer_id: UUID) -> Select[tuple[UUID]]:
    return select(LabResourceConsumer.container_id).where(
        LabResourceConsumer.id == consumer_id
    )


async def get_mapped_consumer_container_id(db: LocalSession, consumer_id: UUID) -> UUID:
    container_id = await db.scalar(select_mapped_consumer_container_id(consumer_id))
    if container_id is None:
        raise LabResourceContainerDoesNotExist(for_consumer=consumer_id)
    return container_id


class LabResourceConsumer(Base):
    __abstract__ = True
    # Every consumer has an associated resource container
    id: Mapped[uuid_pk]
    container_id: Mapped[UUID]
    container: Mapped[LabResourceContainer]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.container_id:
            container = LabResourceContainer(id=uuid4())
            self.container = container

    def create_resource(
        self, resource_type: LabResourceType, at_index: int, **attrs: dict[str, Any]
    ) -> Insert:
        raise NotImplementedError

    def update_resource(self, resource: LabResource, **attrs: dict[str, Any]) -> Update:
        raise NotImplementedError

    def __get_session(self):
        session = async_object_session(self)
        if not isinstance(session, LocalSession):
            raise RuntimeError("Instance detached from session")
        return session

    async def _get_resources(self, resource_type: LabResourceType):
        session = self.__get_session()
        container: LabResourceContainer = await self.awaitable_attrs.container
        return await session.scalars(container.select_resources(resource_type))

    async def get_resource_at_index(
        self, resource_type: LabResourceType, index: int
    ) -> LabResource:
        container: LabResourceContainer = await self.awaitable_attrs.container
        return await container.get_resource_at_index(resource_type, index)

    @property
    async def equipment_leases(self) -> list[EquipmentLease]:
        return cast(
            list[EquipmentLease],
            list(await self._get_resources(LabResourceType.SOFTWARE_LEASE)),
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
