from __future__ import annotations

from abc import abstractmethod
from typing import Any, Awaitable, Callable, Generic, Self, TypeVar, override
from uuid import UUID

from sqlalchemy import Select
from db import LocalSession, local_object_session
from db.models.lab.allocatable import LabAllocation
from db.models.lab.installable import (
    Installable,
    LabInstallation,
)
from db.models.lab.installable.lab_installation import LabInstallationProvisionParams
from db.models.lab.lab import Lab
from db.models.lab.provisionable import LabProvision
from db.models.uni.funding import Budget
from db.models.user import User

from ..base_schemas import ModelCreateRequest, ModelDetail, ModelIndexPage, ModelRequestContextError, ModelUpdateRequest
from .lab_provision_schemas import LabProvisionCreateRequest, LabProvisionDetail, LabProvisionIndexPage
from .lab_allocation_schemas import LabAllocationDetail

TInstallation = TypeVar("TInstallation", bound=LabInstallation)
TAllocation = TypeVar("TAllocation", bound=LabAllocation)


class LabInstallationDetail(ModelDetail[TInstallation], Generic[TInstallation]):
    type: str
    lab_id: UUID

    active_provisions: LabProvisionIndexPage
    allocation_type: str
    active_allocations: ModelIndexPage[LabAllocation, Any]

    @classmethod
    @abstractmethod
    def _allocation_index_from_installation(cls, installation: LabInstallation[Any]) -> Callable[[LocalSession], Awaitable[ModelIndexPage[Any, Any]]]:
        ...

    @classmethod
    @abstractmethod
    def _select_provisions(cls, installation: LabInstallation[Any]) -> Select[tuple[LabProvision[TInstallation, Any]]]:
        ...

    @classmethod
    async def _from_lab_installation(
        cls, lab_installation: TInstallation, **kwargs: Any
    ) -> Self:
        db = local_object_session(lab_installation)

        allocation_index = cls._allocation_index_from_installation(lab_installation)
        active_allocations = await allocation_index(db)
        active_provisions = await LabProvisionIndexPage.from_selection(
            db,
            cls._select_provisions(lab_installation)
        )

        return await cls._from_base(
            lab_installation,
            type=lab_installation.type,
            lab_id=lab_installation.lab_id,

            active_provisions=active_provisions,

            allocation_type = lab_installation.allocation_type,
            active_allocations=active_allocations,

            **kwargs,
        )


class LabInstallationCreateRequest(ModelCreateRequest[TInstallation], Generic[TInstallation]):
    lab: UUID

class LabInstallationUpdateRequest(ModelUpdateRequest[TInstallation], Generic[TInstallation]):
    pass

TProvisionable = TypeVar("TProvisionable", bound=LabInstallation)
TParams = TypeVar("TParams", bound=LabInstallationProvisionParams)

class LabInstallationProvisionDetail(LabProvisionDetail[TInstallation, TParams], Generic[TInstallation, TParams]):
    installation_id: UUID

    @classmethod
    @override
    async def _from_lab_provision(
        cls,
        provision: LabProvision[TInstallation, TParams],
        action: str,
        action_params: TParams,
        **kwargs
    ):
        return await super()._from_lab_provision(
            provision,
            action=action,
            action_params=action_params,
            installation_id=action_params["installation_id"],
            **kwargs
        )


TInstallationCreate = TypeVar('TInstallationCreate', bound=LabInstallationCreateRequest)

class LabInstallationProvisionCreateRequest(
    LabProvisionCreateRequest[TProvisionable, Any],
    Generic[TProvisionable, TInstallationCreate]
):
    __can_create_installation__ = False

    installation: TInstallationCreate | UUID | None = None

    @abstractmethod
    async def get_or_create_installation(
        self,
        db: LocalSession,
        installation: LabInstallation | TInstallationCreate | UUID,
        **kwargs
    ) -> TProvisionable: ...

    @abstractmethod
    async def _do_create_lab_installation_provision(
        self,
        db: LocalSession,
        installation: LabInstallation,
        *,
        budget: Budget,
        estimated_cost: float,
        purchase_url: str,
        purchase_note: str,
        current_user: User,
        note: str
    ) -> LabProvision[TProvisionable, Any]: ...

    @override
    async def _do_create_lab_provision(
        self,
        db: LocalSession,
        *,
        lab: Lab,
        budget: Budget,
        estimated_cost: float,
        purchase_url: str,
        purchase_instructions: str,
        current_user: User,
        note: str,
        installation: LabInstallation | None = None,
        **kwargs
    ):
        installation_ = installation or self.installation
        if installation_ is None:
            raise ModelRequestContextError("No installation on request")

        installation = await self.get_or_create_installation(db, installation_, current_user=current_user, **kwargs)

        if installation.lab_id != lab.id:
            raise ValueError('Installation must be for requested lab')

        return await self._do_create_lab_installation_provision(
            db,
            installation,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_note=purchase_instructions,
            current_user=current_user,
            note=note,
        )
