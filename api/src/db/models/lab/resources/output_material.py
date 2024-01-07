from __future__ import annotations

from sqlalchemy.orm import Mapped
from ..lab_resource import LabResource, lab_resource_pk


class OutputMaterial(LabResource):
    __tablename__ = "lab_resource__output_material"
    __mapper_args__ = {
        "polymorphic_identity": "output_material",
    }

    id: Mapped[lab_resource_pk]
