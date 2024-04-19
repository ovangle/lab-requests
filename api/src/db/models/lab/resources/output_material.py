from __future__ import annotations
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from ..lab_resource import LabResource, LabResourceType, lab_resource_pk


class OutputMaterial(LabResource):
    __tablename__ = "lab_resource__output_material"
    __mapper_args__ = {
        "polymorphic_identity": LabResourceType.OUTPUT_MATERIAL,
    }

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_resource.id", name="output_material_resource_fk"),
        primary_key=True,
    )
