from abc import abstractmethod
from datetime import datetime, timezone, tzinfo
from typing import Any, Awaitable, ClassVar, Generic, Self, TypeVar
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.base.fields import uuid_pk

from ...user import User
from ...research.funding import ResearchFunding

from .errors import (
    ProvisionAlreadyFinalised,
    UnapprovedProvision,
    UnpurchasedProvision,
)
from .provisionable import Provisionable
from .provision_status import (
    ProvisionStatusMetadata,
    provision_status,
    ProvisionStatus,
    provision_status_metadata_property,
)

TProvisionable = TypeVar("TProvisionable", bound=Provisionable)


class LabProvision(Base, Generic[TProvisionable]):
    __tablename__ = "lab_provision"
    __provision_type__: ClassVar[str]

    def __init_subclass__(cls, **kw: Any) -> None:
        if not hasattr(cls, "__provision_type__"):
            raise TypeError("LabProvision subclass must declare a __provision_type__")

        if not hasattr(cls, "__mapper_args__"):
            setattr(cls, "__mapper_args__", {})

        cls.__mapper_args__.update(
            polymorphic_on="type", polymorphic_identity=cls.__provision_type__
        )

        return super().__init_subclass__(**kw)

    id: Mapped[uuid_pk]

    # Represents the named type of the provision.
    type: Mapped[str] = mapped_column(psql.VARCHAR(64))
    status: Mapped[provision_status]

    # The target of the provision. Can be any Provisionable

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab = relationship()

    # The funding source which will be used to purchase the provision
    funding_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("research_funding.id"), default=None
    )
    funding: Mapped[ResearchFunding] = relationship()

    estimated_cost: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
    purchase_cost: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)

    _provision_status_metadadatas: Mapped[dict] = mapped_column(
        psql.JSONB, server_default="{}"
    )

    requested_status_metadata = provision_status_metadata_property(
        "_provision_status_metadatas", ProvisionStatus.REQUESTED
    )
    approved_status_metadata = provision_status_metadata_property(
        "_provision_status_metadatas",
        ProvisionStatus.APPROVED,
    )

    @property
    @abstractmethod
    def target_id(self) -> UUID:
        ...

    @property
    @abstractmethod
    def target(self) -> Awaitable[TProvisionable]:
        ...

    @property
    def is_approved(self):
        return self.approved_status_metadata is not None

    purchased_status_metadata = provision_status_metadata_property(
        "_provision_status_metadatas", ProvisionStatus.PURCHASED
    )

    @property
    def is_purchased(self):
        return self.purchased_status_metadata is not None

    completed_status_metadata = provision_status_metadata_property(
        "_provision_status_metadatas", ProvisionStatus.COMPLETED
    )

    @property
    def is_completed(self):
        return self.installed_status_metadata is not None

    cancelled_status_metadata = provision_status_metadata_property(
        "_provision_status_metadatas", ProvisionStatus.CANCELLED
    )

    @property
    def is_cancelled(self):
        return self.cancelled_status_metadata is not None

    @property
    def is_finalised(self):
        return self.is_completed or self.is_cancelled

    @property
    def is_pending(self):
        return not self.is_finalised

    def __init__(self, *, reason: str, requested_by: User | UUID, **kwargs):
        self.id = uuid4()
        self.status = ProvisionStatus.REQUESTED
        self.type = type(self).__provision_type__

        self.requested_status_metadata = self.__mk_status_metadata(
            ProvisionStatus.REQUESTED,
            by=requested_by,
            note=reason,
        )

        return super().__init__(**kwargs)

    @abstractmethod
    def mark_as_approved(self, **kwargs) -> Awaitable[Self]:
        ...

    async def approve(
        self, *, by: User | UUID, note: str, using: LocalSession | None = None, **kwargs
    ):
        self = await self.mark_as_approved(**kwargs)
        self.approved_status_metadata = self.__mk_status_metadata(
            ProvisionStatus.PURCHASED,
            by=by,
            note=note,
        )
        using = using or local_object_session(self)
        using.add(self)
        await using.commit()
        return self

    async def purchase(
        self,
        *,
        cost: float,
        by: User | UUID,
        note: str,
        using: LocalSession | None = None
    ):
        if self.is_finalised:
            raise ProvisionAlreadyFinalised(self, "approve")
        if not self.is_approved:
            raise UnapprovedProvision(self, "purchase")

        using = using or local_object_session(self)

        funding: ResearchFunding = await self.awaitable_attrs.funding
        # Todo: Apply costs to funding.

        self.purchase_cost = cost

        self.purchased_status_metadata = self.__mk_status_metadata(
            ProvisionStatus.PURCHASED, by=by, note=note
        )
        using.add(self)
        await using.commit()
        return self

    async def complete(
        self, *, by: User | UUID, note: str, using: LocalSession | None = None, **kwargs
    ):
        if self.is_finalised:
            raise ProvisionAlreadyFinalised(self, "complete")

        if not self.is_approved:
            raise UnapprovedProvision(self, "complete")

        if self.funding_id and not self.is_purchased:
            raise UnpurchasedProvision(self, "complete")

        using = using or local_object_session(self)

        target: TProvisionable = await self.awaitable_attrs.target
        target = await target.complete_provision(
            self, by=by, note=note, using=using, **kwargs
        )
        self.installed_status_metadata = self.__mk_status_metadata(
            ProvisionStatus.COMPLETED,
            by=by,
            note=note,
        )

        using.add(self)
        await using.commit()

        return self

    async def cancel(
        self,
        cancelled_by: User | UUID,
        cancelled_note: str,
        using: LocalSession | None = None,
    ):
        if self.is_finalised:
            raise ProvisionAlreadyFinalised(self, "cancelled")

        using = using or local_object_session(self)

        if self.is_purchased:
            funding = await self.awaitable_attrs.funding
            await funding.cancel_purchase(self.purchase, using=using)

        self.cancelled_status_metadata = self.__mk_status_metadata(
            status=ProvisionStatus.COMPLETED,
            by=cancelled_by,
            note=cancelled_note,
        )
        return self

    def __mk_status_metadata(self, status: ProvisionStatus, by: User | UUID, note: str):
        return ProvisionStatusMetadata(
            provision_id=self.id,
            status=status,
            at=datetime.now(tz=timezone.utc),
            by_id=model_id(by),
            note=note,
        )
