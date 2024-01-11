from db.models.lab import LabResource
from db.models.lab.resources.input_material import InputMaterial

from ..lab_resource import LabResourceView, LabResourceIndex


class InputMaterialView(LabResourceView[InputMaterial]):
    pass


class InputMaterialIndex(LabResourceIndex[InputMaterial]):
    __item_type__ = InputMaterialView
