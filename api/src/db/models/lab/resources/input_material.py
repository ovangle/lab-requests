from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column

from ..lab_resource import LabResource, LabResourceType, lab_resource_pk


class InputMaterial(LabResource):
    __tablename__ = "lab_resource__input_material"
    __mapper_args__ = {
        "polymorphic_identity": LabResourceType.INPUT_MATERIAL,
    }

    id: Mapped[lab_resource_pk]
