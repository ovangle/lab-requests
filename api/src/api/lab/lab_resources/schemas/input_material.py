from sqlalchemy import Select
from db.models.lab import LabResource
from db.models.lab.resources.input_material import InputMaterial

from ._common import LabResourceParams, LabResourceView, LabResourceIndex


class InputMaterialView(LabResourceView[InputMaterial]):
    pass


class InputMaterialIndex(LabResourceIndex[InputMaterialView]):
    __item_view__ = InputMaterialView


class InputMaterialParams(LabResourceParams):
    pass
