from sqlalchemy import Select
from db.models.lab.resources import SoftwareLease

from ...base.schemas import ModelIndexPage
from ..lab_resource import LabResourceView, LabResourceIndex


class LabSoftwareLeaseView(LabResourceView[SoftwareLease]):
    pass


class LabSoftwareLeaseIndex(LabResourceIndex[LabSoftwareLeaseView]):
    __item_view__ = LabSoftwareLeaseView
