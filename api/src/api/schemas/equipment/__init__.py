__all__ = (
    "EquipmentDetail",
    "EquipmentIndex",
    "EquipmentIndexPage",
    "EquipmentCreateRequest",
    "EquipmentUpdateRequest",
    "EquipmentInstallationDetail",
    "EquipmentInstallationIndex",
    "EquipmentInstallationIndexPage",
    "EquipmentInstallationProvisionCreateRequest",
    "NewEquipmentRequest",
    "DeclareEquipmentInstallationRequest"
)

from .equipment import (
    EquipmentDetail,
    EquipmentIndex,
    EquipmentIndexPage,
    EquipmentCreateRequest,
    EquipmentUpdateRequest,
)
from .equipment_installation import (
    EquipmentInstallationDetail,
    EquipmentInstallationIndex,
    EquipmentInstallationIndexPage,
    EquipmentInstallationProvisionCreateRequest,
    NewEquipmentRequest,
    DeclareEquipmentInstallationRequest
)
