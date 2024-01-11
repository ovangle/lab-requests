from __future__ import annotations

from sqlalchemy.orm import Mapped
from ..lab_resource import LabResource, LabResourceType, lab_resource_pk


class OutputMaterial(LabResource):
    __tablename__ = "lab_resource__output_material"
    __mapper_args__ = {
        "polymorphic_identity": LabResourceType.OUTPUT_MATERIAL,
    }

    id: Mapped[lab_resource_pk]
