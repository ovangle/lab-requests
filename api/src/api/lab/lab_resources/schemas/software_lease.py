from sqlalchemy import Select
from db.models.lab.lab_resource import LabResourceAttrs
from db.models.lab.resources import SoftwareLease

from api.base.schemas import ModelIndexPage
from ._common import LabResourcePatch, LabResourceView, LabResourceIndex


class LabSoftwareLeaseView(LabResourceView[SoftwareLease]):
    pass


class LabSoftwareLeaseIndex(LabResourceIndex[LabSoftwareLeaseView]):
    __item_view__ = LabSoftwareLeaseView


class LabSoftwareLeasePatch(LabResourcePatch):
    def as_attrs(self) -> LabResourceAttrs:
        return {}
