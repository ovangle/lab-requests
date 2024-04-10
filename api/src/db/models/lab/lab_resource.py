from __future__ import annotations
from abc import abstractmethod
from enum import Enum

from uuid import UUID
from typing import TYPE_CHECKING, Annotated, Any, ClassVar, TypeVar, cast
from sqlalchemy import ForeignKey, SQLColumnExpression, Select, select
from sqlalchemy.dialects import postgresql

from sqlalchemy.ext.asyncio import async_object_session
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession

from ..base import Base, DoesNotExist

from db.models.base.fields import uuid_pk

if TYPE_CHECKING:
    from ..lab import Lab
    from .lab_resource_container import LabResourceContainer, LabResourceConsumer


class LabResourceDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_container_index: tuple[LabResourceContainer | UUID, int] | None = None,
        for_consumer_index: tuple[LabResourceConsumer | UUID, int] | None = None,
    ):
        if for_id:
            return super().__init__(for_id=for_id)
        if for_container_index:
            container, index = for_container_index
            container_id = container if isinstance(container, UUID) else container.id
            msg = (
                f"Resource does not exist in container {container_id} at index {index}"
            )
            super().__init__(msg)
        if for_consumer_index:
            consumer, index = for_consumer_index
            consumer_id = consumer if isinstance(consumer, UUID) else consumer.id

            msg = f"Resource does not exist in consumer {consumer_id} at index {index}"

        assert False


class LabResourceType(Enum):
    EQUIPMENT_LEASE = "equipment_lease"
    SOFTWARE_LEASE = "software_lease"
    INPUT_MATERIAL = "input_material"
    OUTPUT_MATERIAL = "output_material"

    @property
    def py_type(self) -> type[LabResource]:
        return _lab_resource_py_type(self)


def _lab_resource_py_type(type: LabResourceType) -> type[LabResource]:
    from .resources import EquipmentLease, SoftwareLease, InputMaterial, OutputMaterial

    match type:
        case LabResourceType.EQUIPMENT_LEASE:
            return EquipmentLease
        case LabResourceType.SOFTWARE_LEASE:
            return SoftwareLease
        case LabResourceType.INPUT_MATERIAL:
            return InputMaterial
        case LabResourceType.OUTPUT_MATERIAL:
            return OutputMaterial
        case _:
            raise ValueError("Resource type has no associated python type")


lab_resource_type = Annotated[
    LabResourceType, mapped_column(postgresql.ENUM(LabResourceType))
]


class LabResource(Base):
    __tablename__ = "lab_resource"
    __mapper_args__ = {
        "polymorphic_identity": "lab_resource",
        "polymorphic_on": "type",
    }
    __lab_resource_type__: ClassVar[LabResourceType]

    @classmethod
    def __init_subclass__(cls):
        r_type = cls.__mapper_args__["polymorphic_identity"]
        if not isinstance(r_type, LabResourceType):
            raise TypeError(
                "LabResource subclass must have a LabResourceType polymorphic_identity"
            )
        setattr(cls, "__lab_resource_type__", r_type)

        return super().__init_subclass__()

    id: Mapped[uuid_pk]
    type: Mapped[lab_resource_type] = mapped_column(index=True)

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    container_id: Mapped[UUID]
    index: Mapped[int]

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        r = await db.get(cls.__lab_resource_type__.py_type, id)
        if r is None:
            raise LabResourceDoesNotExist(for_id=id)
        return r

    @classmethod
    async def get_for_consumer_index(
        cls, db: LocalSession, consumer: LabResourceConsumer | UUID, index: int
    ):
        from .lab_resource_container import select_mapped_consumer_container_id

        consumer_id = consumer if isinstance(consumer, UUID) else consumer.id
        resource_type = cls.__lab_resource_type__.py_type
        resource = await db.scalar(
            select(resource_type).where(
                resource_type.container_id.in_(
                    select_mapped_consumer_container_id(consumer_id).scalar_subquery()
                ),
                resource_type.index == index,
            )
        )
        if resource is None:
            raise LabResourceDoesNotExist(for_consumer_index=(consumer, index))
        return resource

    @classmethod
    async def get_for_container_index(
        cls,
        db: LocalSession,
        container: LabResourceContainer | UUID,
        index: int,
    ):
        container_id = container if isinstance(container, UUID) else container.id
        resource_type = cls.__lab_resource_type__.py_type
        resource = await db.scalar(
            select(resource_type).where(
                resource_type.container_id == container,
                resource_type.index == index,
            )
        )
        if resource is None:
            raise LabResourceDoesNotExist(for_container_index=(container, index))
        return resource

    def __init__(self, **kwargs):
        self.type = type(self).__lab_resource_type__
        super().__init__(**kwargs)


lab_resource_pk = Annotated[
    UUID, mapped_column(ForeignKey("lab_resource.id"), primary_key=True)
]


def select_resources(
    resource_type: LabResourceType,
    lab_id: UUID | None = None,
    consumer_id: UUID | None = None,
    container_id: UUID | None = None,
) -> Select[tuple[LabResource]]:
    model_type = resource_type.py_type

    clauses: list[SQLColumnExpression] = []
    if container_id:
        clauses.append(model_type.container_id == container_id)

    elif container_id:
        clauses.append(
            model_type.container_id.in_(
                select(LabResourceConsumer.container_id).where(
                    LabResourceConsumer.id == consumer_id
                )
            )
        )

    if lab_id:
        clauses.append(model_type.lab_id == lab_id)

    return select(model_type).where(*clauses)
