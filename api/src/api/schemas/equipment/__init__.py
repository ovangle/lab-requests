__all__ = (
    "EquipmentDetail",
    "EquipmentIndexPage",
    "EquipmentCreateRequest",
    "EquipmentUpdateRequest",
    "EquipmentInstallationDetail",
    "EquipmentInstallationIndexPage",
    "EquipmentInstallationProvisionCreateRequest",
    "NewEquipmentRequest",
    "CreateEquipmentInstallationRequest"
)

from .equipment import (
    EquipmentDetail,
    EquipmentIndexPage,
    EquipmentCreateRequest,
    EquipmentUpdateRequest,
)
from .equipment_installation import (
    EquipmentInstallationDetail,
    EquipmentInstallationIndexPage,
    EquipmentInstallationProvisionCreateRequest,
    NewEquipmentRequest,
    CreateEquipmentInstallationRequest
)
