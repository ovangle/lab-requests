from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


from ..provisionable import LabProvision
from .allocatable import Allocatable

TAllocatable = TypeVar("TAllocatable", bound=Allocatable)


class LabAllocationProvision(LabProvision[TAllocatable], Generic[TAllocatable]):
    __abstract__ = True


class LabAllocationSetupProvision(
    LabAllocationProvision[TAllocatable], Generic[TAllocatable]
):

    __provision_type__ = "setup_allocation"


class LabAllocataionTeardownProvision(
    LabAllocationProvision[TAllocatable], Generic[TAllocatable]
):
    # Is this teardown provision something associated with a setup provision
    setup_provision: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_allocation_setup_provision.id"), nullable=True
    )
