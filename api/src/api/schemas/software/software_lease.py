from ..base import ModelDetail, ModelIndexPage

from db.models.software import SoftwareLease, query_software_leases

from api.schemas.lab.lab_allocation import LabAllocationDetail
from .software_installation import SoftwareInstallationDetail


class SoftwareLeaseDetail(LabAllocationDetail[SoftwareLease]):
    installation: SoftwareInstallationDetail

    @classmethod
    async def from_model(cls, model: SoftwareLease):
        installation_detail = await SoftwareInstallationDetail.from_model(
            await model.awaitable_attrs.installation
        )
        return await cls._from_lab_allocation(
            model,
            installation=installation_detail
        )

SoftwareLeaseIndexPage = ModelIndexPage[SoftwareLease, SoftwareLeaseDetail]