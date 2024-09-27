__all__ = (
    "EquipmentDetail",
    "EquipmentIndexPage",
    "EquipmentCreateRequest",
    "EquipmentUpdateRequest",
    "EquipmentInstallationDetail",
    "EquipmentInstallationIndexPage",
    "EquipmentInstallationProvisionCreateRequest",
    "NewEquipmentRequest",
    "CreateEquipmentInstallationRequest",
    "EquipmentInstallationProvisionDetail",
    "TransferEquipmentRequest",
    "EquipmentInstallationUpdateRequest",
    "EquipmentLeaseDetail",
    "EquipmentLeaseIndexPage"
)

from .equipment_schemas import (
    EquipmentDetail,
    EquipmentIndexPage,
    EquipmentCreateRequest,
    EquipmentUpdateRequest,
)
from .equipment_installation_schemas import (
    EquipmentInstallationDetail,
    EquipmentInstallationIndexPage,
    EquipmentInstallationProvisionCreateRequest,
    NewEquipmentRequest,
    CreateEquipmentInstallationRequest,
    EquipmentInstallationProvisionDetail,
    TransferEquipmentRequest,
    EquipmentInstallationUpdateRequest
)

from .equipment_lease_schemas import (
    EquipmentLeaseDetail,
    EquipmentLeaseIndexPage,
)
