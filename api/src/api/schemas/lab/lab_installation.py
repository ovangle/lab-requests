from __future__ import annotations

from abc import abstractmethod
from typing import Any, Generic, Self, TypeVar
from uuid import UUID
from db import local_object_session
from db.models.lab.allocatable import LabAllocation
from db.models.lab.installable import (
    Installable,
    LabInstallation,
    LabInstallationProvision,
)
from db.models.lab.provisionable import LabProvision
from ..base import ModelDetail, ModelIndex, ModelIndexPage

from .lab_provision import LabProvisionCreateRequest, LabProvisionDetail, LabProvisionIndex
from .lab_allocation import LabAllocationDetail, LabAllocationIndex

TInstallation = TypeVar("TInstallation", bound=LabInstallation)
TProvision= TypeVar("TProvision", bound=LabProvision)
TAllocation = TypeVar("TAllocation", bound=LabAllocation)


class LabInstallationDetail(ModelDetail[TInstallation], Generic[TInstallation]):
    type: str
    lab_id: UUID

    provision_type: str
    active_provisions: ModelIndexPage[LabInstallation, Any]
    allocation_type: str
    active_allocations: ModelIndexPage[LabAllocation, Any]

    @classmethod
    @abstractmethod
    def _allocation_index_from_installation(cls, installation: LabInstallation[Any]) -> LabAllocationIndex[Any]:
        ...

    @classmethod
    @abstractmethod
    def _provision_index_from_installation(cls, installation: LabInstallation[Any]) -> LabAllocationIndex[Any]:
        ...

    @classmethod
    async def _from_lab_installation(
        cls, lab_installation: TInstallation, **kwargs: Any
    ) -> Self:
        db = local_object_session(lab_installation)

        provision_index = cls._allocation_index_from_installation(lab_installation)
        allocation_index = cls._provision_index_from_installation(lab_installation)

        return await cls._from_base(
            lab_installation,
            type=lab_installation.type,
            lab_id=lab_installation.lab_id,

            provision_type=lab_installation.provision_type,
            active_provisions=await provision_index.load_page(db),

            allocation_type = lab_installation.allocation_type,
            active_allocations=await allocation_index.load_page(db),

            **kwargs,
        )


class LabInstallationIndex(ModelIndex[TInstallation]):
    pass


TInstallationProvision = TypeVar(
    "TInstallationProvision", bound=LabInstallationProvision[Any]
)


class LabInstallationProvisionDetail(
    LabProvisionDetail[TInstallationProvision], Generic[TInstallationProvision]
):
    installation_id: UUID

    @classmethod
    async def _from_lab_installation_provision(
        cls, provision: LabInstallationProvision, **kwargs
    ):
        return await cls._from_lab_provision(
            provision, installation_id=provision.installation_id, **kwargs
        )


class LabInstallationProvisionIndex(
    LabProvisionIndex[TInstallationProvision], Generic[TInstallationProvision]
):
    installation: UUID | None = None
    only_pending: bool = False


class LabInstallationProvisionCreateRequest(
    LabProvisionCreateRequest[TInstallationProvision],
    Generic[TInstallationProvision]
):
    installation_id: UUID

    @abstractmethod
    async def get_installation(self): ...