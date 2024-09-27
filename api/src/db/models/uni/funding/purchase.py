from __future__ import annotations
from abc import abstractmethod
from datetime import datetime, timezone
from typing import TYPE_CHECKING, ClassVar, Self
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.base.errors import DoesNotExist, ModelException
from db.models.fields import uuid_pk
from db.models.user import User

from .purchase_status import PURCHASE_STATUS_TRANSITION, PurchaseStatus, PURCHASE_STATUS_ENUM, PurchaseStatusError, PurchaseStatusTransition
from .funding import Funding

if TYPE_CHECKING:
    from .budget import Budget

_purchase_order_types: dict[str, type[PurchaseOrder]] = {}

class PurchaseTypeError(TypeError):
    pass

class PurchaseOrder(Base):
    __abstract__ = True
    __purchase_order_type__: ClassVar[str]

    def __init_subclass__(cls, **kwargs):
        purchase_order_type = getattr(cls, '__purchase_order_type__', None)
        if purchase_order_type:

            if purchase_order_type in _purchase_order_types:
                raise TypeError('purchase types must be unque')

            if any(
                issubclass(v, cls)
                for v in _purchase_order_types.values()
            ):
                raise TypeError('purchase types cannot extend from each other')

            _purchase_order_types[purchase_order_type] = cls
        super().__init_subclass__(**kwargs)

    budget_id: Mapped[UUID] = mapped_column(ForeignKey("uni_budget.id"), default=None)

    @declared_attr
    def budget(cls) -> Mapped[Budget | None]:
        return relationship()


    @declared_attr
    def funding(cls) -> Mapped[Funding | None]:
        return relationship(
            secondary="uni_budget",
            viewonly=True
        )

    purchase_id: Mapped[UUID | None] = mapped_column(ForeignKey("uni_purchase.id"), nullable=True, default=None)

    @declared_attr
    def purchase(self) -> Mapped[Purchase | None]:
        return relationship(Purchase)

    created_by_id: Mapped[UUID] = mapped_column(ForeignKey('user.id'))
    estimated_cost: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)

    purchase_url: Mapped[str | None] = mapped_column(postgresql.VARCHAR(1024), default=None)
    purchase_instructions: Mapped[str] = mapped_column(postgresql.TEXT, default='')

    async def get_or_create_purchase(self) -> Purchase:
        budget: Budget | None = await self.awaitable_attrs.budget
        if budget:
            if not self.purchase_id:
                purchase = await budget.append_purchase(self)
                self.purchase_id = purchase.id
            else:
                purchase = await self.awaitable_attrs.purchase
            return purchase
        else:
            raise ModelException("Purchase has no budget")

async def get_purchase_order_for_type_and_id(db: LocalSession, type: str, id: UUID):
    try:
        py_type = _purchase_order_types[type]
        return await py_type.get_by_id(db, id)
    except KeyError:
        raise PurchaseTypeError('Purchase type unknown')

class Purchase(Base):
    __tablename__ = "uni_purchase"
    __table_args__ = (
        UniqueConstraint('purchase_order_type', 'purchase_order_id'),
    )

    id: Mapped[uuid_pk] = mapped_column()

    @classmethod
    async def get_for_budget_index(cls, db: LocalSession, budget: Budget | UUID, index: int) -> Purchase:
        result = await db.scalar(
            select(Purchase).where(
                Purchase.budget_id == model_id(budget),
                Purchase.index == index
            )
        )
        if result is None:
            raise DoesNotExist(cls, f'no research purchase for budget at {index}')
        return result

    purchase_order_type: Mapped[str] = mapped_column(postgresql.VARCHAR(64))
    purchase_order_id: Mapped[UUID] = mapped_column(postgresql.UUID)

    @property
    async def purchase_order(self) -> PurchaseOrder:
        db = local_object_session(self)
        return await get_purchase_order_for_type_and_id(db, self.purchase_order_type, self.purchase_order_id)

    funding: Mapped[Funding] = relationship(
        secondary='uni_budget',
        viewonly=True
    )

    budget_id: Mapped[UUID] = mapped_column(ForeignKey("uni_budget.id"), index=True)
    budget: Mapped[Budget] = relationship()
    index: Mapped[int] = mapped_column(postgresql.INTEGER, index=True)

    estimated_cost: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)
    actual_cost: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)

    status: Mapped[PurchaseStatus] = mapped_column(
        PURCHASE_STATUS_ENUM,
        default=PurchaseStatus.ORDERED
    )

    _order_mark: Mapped[PurchaseStatusTransition] = mapped_column(
        PURCHASE_STATUS_TRANSITION(PurchaseStatus.ORDERED)
    )
    @property
    def ordered_by_id(self):
        return self._order_mark["by_id"]

    @property
    def ordered_at(self):
        return self._order_mark["at"]

    def __init__(self, purchase_order: PurchaseOrder, budget: Budget, index: int, *, estimated_cost: float, **kwargs):
        self.purchase_order_type = purchase_order.__purchase_order_type__
        self.purchase_order_id = purchase_order.id

        self._order_mark = self.__mk_status_transition(
            PurchaseStatus.ORDERED,
            purchase_order.created_by_id,
            note=f'from {self.purchase_order_type} purchase order {self.purchase_order_id}'
        )

        self.budget_id = budget.id
        self.index = index
        self.estimated_cost = estimated_cost

        super().__init__()

    _ready_mark: Mapped[PurchaseStatusTransition | None] = mapped_column(
        PURCHASE_STATUS_TRANSITION(PurchaseStatus.READY),
        nullable=True,
        default=None
    )

    @property
    def ready_at(self):
        return self._ready_mark['at'] if self._ready_mark else None

    @property
    def is_ready(self):
        return self._ready_mark is not None

    async def mark_as_ready(self, marked_by: User, *, note: str) -> Self:
        if not self.is_ready:
            self._ready_mark = self.__mk_status_transition(
                PurchaseStatus.READY,
                marked_by,
                note
            )
        return await self.__save()

    receipt_description: Mapped[str] = mapped_column(postgresql.TEXT, default='')

    paid: Mapped[PurchaseStatusTransition | None] = mapped_column(
        PURCHASE_STATUS_TRANSITION(PurchaseStatus.PAID),
        nullable=True,
        default=None
    )

    @property
    def is_paid(self):
        return self.paid is not None

    @property
    def paid_by_id(self):
        return self.paid["by_id"] if self.paid else None

    @property
    def paid_at(self):
        return self.paid["at"] if self.paid else None

    @property
    def is_pending(self):
        return self.paid is not None

    async def pay(self, by: User, *, note: str, receipt_description: str = ''):
        if self.is_paid:
            raise PurchaseStatusError(self.status, PurchaseStatus.PAID, 'purchase already paid')
        if not self.is_ready:
            # If it's not ready but it's paid, pay it anyway
            self = await self.mark_as_ready(by, note='purchase paid')

        self.status = PurchaseStatus.PAID

        self.receipt_description = receipt_description
        self.paid = self.__mk_status_transition(PurchaseStatus.PAID, by, note=note)

        return await self.__save()


    review_mark: Mapped[PurchaseStatusTransition | None] = mapped_column(
        PURCHASE_STATUS_TRANSITION(PurchaseStatus.REVIEWED),
        nullable=True,
        default=None
    )

    @property
    def reviewed_by_id(self):
        return self.review_mark["by_id"] if self.review_mark else None

    @property
    def reviewed_at(self):
        return self.review_mark["at"] if self.review_mark else None

    @property
    def is_finalised(self):
        return self.review_mark is not None

    async def review(self, by: User, note: str) -> Self:
        if not self.status == PurchaseStatus.PAID:
            raise PurchaseStatusError(self.status, PurchaseStatus.REVIEWED, 'can only review a paid purchase')

        self.status = PurchaseStatus.REVIEWED
        self.review_mark = self.__mk_status_transition(
            PurchaseStatus.REVIEWED,
            by,
            note
        )
        return await self.__save()

    def __mk_status_transition(self, status: PurchaseStatus, by: User | UUID, note: str):
        return PurchaseStatusTransition(
            status=status,
            budget_id=self.budget_id,
            purchase_id=self.id,
            at=datetime.now(tz=timezone.utc),
            by_id=model_id(by),
            note=note
        )

    async def __save(self):
        db = local_object_session(self)
        db.add(self)
        await db.commit()
        return self


def query_purchases(
    budget: Budget | UUID | None = None
):
    where_clauses = []

    if budget:
        where_clauses.append(
            Purchase.budget_id == model_id(budget)
        )

    return select(Purchase).where(*where_clauses)