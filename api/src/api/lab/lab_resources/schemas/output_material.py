from sqlalchemy import Select
from db.models.lab.resources import OutputMaterial

from ._common import LabResourceParams, LabResourceView, LabResourceIndex


class OutputMaterialView(LabResourceView[OutputMaterial]):
    pass


class OutputMaterialIndex(LabResourceIndex[OutputMaterialView]):
    __item_view__ = OutputMaterialView


class OutputMaterialParams(LabResourceParams):
    pass
