from db.models.lab import LabResource
from db.models.lab.resources import EquipmentLease

from ..lab_resource import LabResourceView, LabResourceIndex


class LabEquipmentLeaseView(LabResourceView[EquipmentLease]):
    pass


class LabEquipmentLeaseIndex(LabResourceIndex[EquipmentLease]):
    __item_view__ = LabEquipmentLeaseView
