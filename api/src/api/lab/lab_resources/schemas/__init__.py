__all__ = (
    "LabResourceType",
    "LabResourceView",
    "LabResourceIndex",
    "LabResourceIndexPage",
    "LabResourcePatch",
    "LabEquipmentLeaseIndex",
    "LabEquipmentLeaseView",
    "LabEquipmentLeasePatch",
    "LabSoftwareLeaseIndex",
    "LabSoftwareLeaseView",
    "LabSoftwareLeasePatch",
    "InputMaterialIndex",
    "InputMaterialView",
    "InputMaterialPatch",
    "OutputMaterialIndex",
    "OutputMaterialView",
    "OutputMaterialPatch",
    "resource_view_cls",
    "resource_index_cls",
    "resource_params_cls",
)


from db.models.lab.lab_resource import LabResourceType
from ._common import (
    LabResourceView,
    LabResourceIndex,
    LabResourceIndexPage,
    LabResourcePatch,
)
from .equipment_lease import (
    LabEquipmentLeaseIndex,
    LabEquipmentLeaseView,
    LabEquipmentLeasePatch,
)
from .software_lease import (
    LabSoftwareLeaseIndex,
    LabSoftwareLeaseView,
    LabSoftwareLeasePatch,
)
from .input_material import (
    InputMaterialIndex,
    InputMaterialView,
    InputMaterialPatch,
)
from .output_material import (
    OutputMaterialIndex,
    OutputMaterialView,
    OutputMaterialPatch,
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


def resource_params_cls(resource_type: LabResourceType) -> type[LabResourcePatch]:
    match resource_type:
        case LabResourceType.EQUIPMENT_LEASE:
            return LabEquipmentLeasePatch
        case LabResourceType.SOFTWARE_LEASE:
            return LabSoftwareLeasePatch
        case LabResourceType.INPUT_MATERIAL:
            return InputMaterialPatch
        case LabResourceType.OUTPUT_MATERIAL:
            return OutputMaterialPatch
