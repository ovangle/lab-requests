from __future__ import annotations

from typing import Any, cast
from uuid import UUID, uuid4
from sqlalchemy import ForeignKey, Insert, Update, delete, select, Select, update
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy.ext.asyncio import async_object_session
from sqlalchemy_utils.generic import generic_relationship

from db import LocalSession, local_object_session
from db.models.base.errors import DoesNotExist

from ..base import Base, fields
from ..base.fields import uuid_pk
from .lab_resource import (
    LabResourceAttrs,
    LabResourceDoesNotExist,
    LabResourceType,
    LabResource,
)
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
    consumer_type: Mapped[str] = mapped_column(postgresql.VARCHAR(255))
    consumer_id: Mapped[UUID] = mapped_column(postgresql.UUID)
    consumer = generic_relationship(consumer_type, consumer_id)

    def __init__(self, consumer: LabResourceConsumer, id: UUID | None = None):
        super().__init__(id=id, consumer=consumer)

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

    def _get_resources(self, resource_type: LabResourceType):
        session = local_object_session(self)
        return session.scalars(self.select_resources(resource_type))

    async def _get_resource_count(self, type: LabResourceType) -> int:
        session = local_object_session(self)
        raise NotImplementedError

    async def get_resource_for_id(
        self, resource_type: LabResourceType, id: UUID
    ) -> LabResource:
        db = local_object_session(self)
        r = await db.get(resource_type.py_type, id)
        if r is None:
            raise LabResourceDoesNotExist(for_id=id)
        return r

    async def get_resource_at_index(
        self, resource_type: LabResourceType, index: int
    ) -> LabResource:
        return await resource_type.py_type.get_for_container_index(
            local_object_session(self), self, index
        )

    @property
    async def equipment_leases(self) -> list[EquipmentLease]:
        return cast(
            list[EquipmentLease],
            list(await self._get_resources(LabResourceType.EQUIPMENT_LEASE)),
        )

    async def get_equipment_lease_for_id(self, id: UUID):
        return await self.get_resource_for_id(LabResourceType.EQUIPMENT_LEASE, id)

    def get_equipment_lease_count(self):
        return self._get_resource_count(LabResourceType.EQUIPMENT_LEASE)

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

    async def insert_resource_at(self, at_index: int, attrs: LabResourceAttrs):
        raise NotImplementedError

    async def _delete_resources(
        self, type: LabResourceType, start_index: int, count: int | None = None
    ):
        db = local_object_session(self)
        model = type.py_type

        clauses = [
            LabResource.container_id == self.id,
            LabResource.index >= start_index,
        ]
        if count:
            clauses.append(LabResource.index < start_index + count)
        to_delete = select(model).where(*clauses)
        await db.execute(to_delete)

        if count:
            update_indices = (
                update(LabResource)
                .where(
                    LabResource.container_id == self.id,
                    LabResource.index >= start_index + count,
                )
                .values(index=LabResource.index - count)
            )
            await db.execute(update_indices)

    async def _insert_resources(
        self, type: LabResourceType, at_index: int, items: list[LabResourceAttrs]
    ):
        db = local_object_session(self)
        model = type.py_type

        update_indices = (
            update(LabResource)
            .where(LabResource.container_id == self.id, LabResource.index >= at_index)
            .values(index=LabResource.index + len(items))
        )
        await db.execute(update_indices)
        await db.commit()

        for i, attrs in enumerate(items):
            attrs["container"] = self
            attrs["index"] = at_index + i
            db.add(model(**attrs))

        await db.commit()

    async def splice_resources(
        self,
        resource_type: LabResourceType,
        start_index: int,
        end_index: int | None,
        items: list[LabResourceAttrs],
    ):
        delete_count = end_index - start_index if end_index is not None else None
        await self._delete_resources(resource_type, start_index, delete_count)
        await self._insert_resources(resource_type, start_index, items)


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
            self.container = LabResourceContainer(self)

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
