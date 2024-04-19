from sqlalchemy import Select
from db.models.lab import LabResource
from db.models.lab.lab_resource import LabResourceAttrs
from db.models.lab.resources.input_material import InputMaterial

from ._common import LabResourcePatch, LabResourceView, LabResourceIndex


class InputMaterialView(LabResourceView[InputMaterial]):
    pass


class InputMaterialIndex(LabResourceIndex[InputMaterialView]):
    __item_view__ = InputMaterialView


class InputMaterialPatch(LabResourcePatch):
    def as_attrs(self) -> LabResourceAttrs:
        return {}
