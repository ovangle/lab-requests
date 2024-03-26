from sqlalchemy import Select
from db.models.lab.resources import SoftwareLease

from api.base.schemas import ModelIndexPage
from api.lab.lab_resource import LabResourceView, LabResourceIndex


class LabSoftwareLeaseView(LabResourceView[SoftwareLease]):
    pass


class LabSoftwareLeaseIndex(LabResourceIndex[LabSoftwareLeaseView]):
    __item_view__ = LabSoftwareLeaseView
