from __future__ import annotations
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from ..lab_resource import LabResource, LabResourceType, lab_resource_pk


class InputMaterial(LabResource):
    __tablename__ = "lab_resource__input_material"
    __mapper_args__ = {
        "polymorphic_identity": LabResourceType.INPUT_MATERIAL,
    }

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_resource.id", name="input_material_resource_fk"),
        primary_key=True,
    )
