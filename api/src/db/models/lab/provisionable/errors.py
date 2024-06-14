from typing import TYPE_CHECKING, Literal
from uuid import UUID
from db.models.base import ModelException
from db.models.base.base import model_id
from db.models.lab.provisionable.provision_status import ProvisionStatus

from ..lab import Lab

if TYPE_CHECKING:
    from .provisionable import Provisionable
    from .lab_provision import LabProvision


class ProvisioningError(ModelException):
    def __init__(self, provision: LabProvision | UUID | None, msg: str):
        self.provision_id = (
            provision.id if isinstance(provision, LabProvision) else provision
        )
        super().__init__(msg)


class ProvisioningInProgress(ProvisioningError):
    def __init__(
        self,
        lab: Lab | UUID,
        provisionable: Provisionable | UUID,
        existing_provision: LabProvision | UUID,
    ):
        self.existing_provision_id = existing_provision
        self.provisionable_id = model_id(provisionable)
        self.lab_id = model_id(lab)

        super().__init__(
            None,
            f"An active provision already exists for provision '{self.provisionable_id}' in lab '{self.lab_id}'",
        )


class UnapprovedProvision(ProvisioningError):
    def __init__(self, provision: LabProvision, transition: str):
        super().__init__(
            provision,
            f"{provision.status} provision must be approved before {transition}",
        )


class UnpurchasedProvision(ProvisioningError):
    def __init__(self, provision: LabProvision, transition: str):
        super().__init__(
            provision,
            f"{provision.status} provision must be purchased before {transition}",
        )


class ProvisionAlreadyFinalised(ProvisioningError):
    def __init__(self, provision: LabProvision, transition: str):
        super().__init__(
            provision, f"{provision.status} provision already cannot be {transition}"
        )
