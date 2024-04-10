__all__ = (
    "LabResourceType",
    "LabResourceView",
    "LabResourceIndex",
    "LabResourceIndexPage",
    "LabResourceParams",
    "LabEquipmentLeaseIndex",
    "LabEquipmentLeaseView",
    "LabEquipmentLeaseParams",
    "LabSoftwareLeaseIndex",
    "LabSoftwareLeaseView",
    "LabSoftwareLeaseParams",
    "InputMaterialIndex",
    "InputMaterialView",
    "InputMaterialParams",
    "OutputMaterialIndex",
    "OutputMaterialView",
    "OutputMaterialParams",
    "resource_view_cls",
    "resource_index_cls",
    "resource_params_cls",
)


from db.models.lab.lab_resource import LabResourceType
from ._common import (
    LabResourceView,
    LabResourceIndex,
    LabResourceIndexPage,
    LabResourceParams,
)
from .equipment_lease import (
    LabEquipmentLeaseIndex,
    LabEquipmentLeaseView,
    LabEquipmentLeaseParams,
)
from .software_lease import (
    LabSoftwareLeaseIndex,
    LabSoftwareLeaseView,
    LabSoftwareLeaseParams,
)
from .input_material import (
    InputMaterialIndex,
    InputMaterialView,
    InputMaterialParams,
)
from .output_material import (
    OutputMaterialIndex,
    OutputMaterialView,
    OutputMaterialParams,
)


def resource_view_cls(resource_type: LabResourceType) -> type[LabResourceView]:
    match resource_type:
        case LabResourceType.EQUIPMENT_LEASE:
            return LabEquipmentLeaseView
        case LabResourceType.SOFTWARE_LEASE:
            return LabSoftwareLeaseView
        case LabResourceType.INPUT_MATERIAL:
            return InputMaterialView
        case LabResourceType.OUTPUT_MATERIAL:
            return OutputMaterialView


def resource_index_cls(resource_type: LabResourceType) -> type[LabResourceIndex]:
    match resource_type:
        case LabResourceType.EQUIPMENT_LEASE:
            return LabEquipmentLeaseIndex
        case LabResourceType.SOFTWARE_LEASE:
            return LabSoftwareLeaseIndex
        case LabResourceType.INPUT_MATERIAL:
            return InputMaterialIndex
        case LabResourceType.OUTPUT_MATERIAL:
            return OutputMaterialIndex


def resource_params_cls(resource_type: LabResourceType) -> type[LabResourceParams]:
    match resource_type:
        case LabResourceType.EQUIPMENT_LEASE:
            return LabEquipmentLeaseParams
        case LabResourceType.SOFTWARE_LEASE:
            return LabSoftwareLeaseParams
        case LabResourceType.INPUT_MATERIAL:
            return InputMaterialParams
        case LabResourceType.OUTPUT_MATERIAL:
            return OutputMaterialParams
