
from db.models.lab import LabWork, LabWorkOrder

from ..base_schemas import ModelDetail

class LabWorkOrderDetail(ModelDetail[LabWorkOrder]):
    pass

class LabWorkDetail(ModelDetail[LabWork]):
    pass