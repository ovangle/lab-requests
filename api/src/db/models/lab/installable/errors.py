from typing import cast
from uuid import UUID

from db.models.base import DoesNotExist

from ..lab import Lab
from .installable import Installable


class LabInstallationDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_installable_lab: tuple[UUID, UUID] | None = None,
    ):
        if for_installable_lab is not None:
            installable, lab = for_installable_lab
            installable_id = (
                cast(Installable, installable).id
                if hasattr(installable, "id")
                else installable
            )
            lab_id = cast(Lab, lab).id if hasattr(lab, "id") else lab

            msg = f"No installation for {installable_id} in lab {lab_id}"
            super().__init__("LabInstallation", msg=msg)
        else:
            super().__init__("LabInstallation", for_id=for_id)
