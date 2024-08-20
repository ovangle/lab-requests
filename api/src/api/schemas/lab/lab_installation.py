from __future__ import annotations

from typing import Any, Generic, Self, TypeVar
from uuid import UUID
from db.models.lab.installable import (
    Installable,
    LabInstallation,
    LabInstallationProvision,
)
from ..base import ModelDetail

from .lab_provision import LabProvisionDetail

TInstallation = TypeVar("TInstallation", bound=LabInstallation)


class LabInstallationDetail(ModelDetail[TInstallation], Generic[TInstallation]):
    type: str
    lab_id: UUID

    @classmethod
    async def _from_lab_installation(
        cls, lab_installation: TInstallation, **kwargs: Any
    ) -> Self:
        return await cls._from_base(
            lab_installation,
            type=lab_installation.type,
            lab_id=lab_installation.lab_id,
            **kwargs,
        )


TInstallationProvision = TypeVar(
    "TInstallationProvision", bound=LabInstallationProvision
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
