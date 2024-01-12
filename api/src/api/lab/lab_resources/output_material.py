from sqlalchemy import Select
from db.models.lab.resources import OutputMaterial

from ..lab_resource import LabResourceView, LabResourceIndex


class OutputMaterialView(LabResourceView[OutputMaterial]):
    pass


class OutputMaterialIndex(LabResourceIndex[OutputMaterialView, OutputMaterial]):
    __item_view__ = OutputMaterialView
