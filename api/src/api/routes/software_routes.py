from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends

from api.auth.context import get_current_authenticated_user

from db import get_db
from db.models.lab.provisionable.lab_provision import LabProvision
from db.models.software import Software, query_softwares, SoftwareInstallation, query_software_installation_provisions
from db.models.software.software_installation import SoftwareInstallation, query_software_installation_provisions, query_software_installations

from api.schemas.lab import LabProvisionDetail, LabProvisionIndexPage
from api.schemas.software import (
    SoftwareCreateRequest,
    SoftwareDetail,
    SoftwareIndexPage,
    NewSoftwareRequest,
    SoftwareInstallationCreateRequest,
    SoftwareInstallationDetail,
    SoftwareInstallationIndexPage,
    SoftwareLeaseIndexPage,
    SoftwareInstallationUpdateRequest,
    UpgradeSoftwareRequest
)
from db.models.software.software_lease import query_software_leases

softwares = APIRouter(prefix="/softwares")

@softwares.get("/software")
async def index_softwares(
    lab_id: UUID | None = None,
    name_startswith: str | None = None,
    name: str | None = None,
    tags: str | None = None,
    page_index: int = 1,
    db=Depends(get_db),
):
    if tags:
        tags_ = set(tags.split(','))
    else:
        tags_ = set()


    return await SoftwareIndexPage.from_selection(
        db,
        query_softwares(
            lab=lab_id,
            name_istartswith=name_startswith,
            name_eq=name,
            has_tags=tags_,
        ),
        page_index=page_index
    )


@softwares.post("/software")
async def create_software(create_req: SoftwareCreateRequest, db=Depends(get_db), current_user=Depends(get_current_authenticated_user)):
    model = await create_req.do_create(db, current_user=current_user)
    return await SoftwareDetail.from_model(model)


@softwares.get("/software/{software_id}")
async def read_equipment(software_id: UUID, db=Depends(get_db)) -> SoftwareDetail:
    equipment = await Software.get_by_id(db, software_id)
    return await SoftwareDetail.from_model(equipment)

@softwares.get("/installation")
async def index_equipment_installations(
    lab: UUID | None = None,
    software: UUID | None = None,
    page_index: int = 1,
    db=Depends(get_db)
):
    return await SoftwareInstallationIndexPage.from_selection(
        db,
        query_software_installations(lab=lab, software=software),
        page_index=page_index
    )

@softwares.post("/installation")
async def create_installation(
    create_req: SoftwareInstallationCreateRequest,
    db=Depends(get_db), current_user=Depends(get_current_authenticated_user)
) -> SoftwareInstallationDetail:

    installation_or_provision = await create_req.do_create(db, current_user=current_user)
    if isinstance(installation_or_provision, LabProvision):
        installation = await SoftwareInstallation.get_by_id(db, installation_or_provision.action_params["installation_id"])

    return await SoftwareInstallationDetail.from_model(installation)

@softwares.post("/installation/new")
async def new_software_installation(
    new_software_request: NewSoftwareRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
):
    raise NotImplementedError


@softwares.get("/installation/{installation_id}")
async def read_software_installation(
    installation_id: UUID, db=Depends(get_db)
) -> SoftwareInstallationDetail:
    software_installation = await SoftwareInstallation.get_by_id(db, installation_id)
    return await SoftwareInstallationDetail.from_model(software_installation)

@softwares.put("/installation/{installation_id}")
async def update_equipment_installation(
    installation_id: UUID,
    update_req: SoftwareInstallationUpdateRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
):
    installation = await SoftwareInstallation.get_by_id(db, installation_id)

    if isinstance(update_req, SoftwareInstallationUpdateRequest):
        installation = await update_req.do_update(installation, current_user=current_user)
    else:
        lab = await installation.awaitable_attrs.lab
        provision = await update_req.do_create(db, )


    return await SoftwareInstallationDetail.from_model(installation)

@softwares.get("/installation/{installation_id}/provision")
@softwares.get("/installation/{installation_id}/provision/{action_name}")
async def index_installation_provisions(
    installation: UUID,
    action_name: Literal["new_software", "upgrade_software"] | None = None,
    only_pending: bool = False,
    db=Depends(get_db)
) -> LabProvisionIndexPage:
    return await LabProvisionIndexPage.from_selection(
        db,
        query_software_installation_provisions(
            installation=installation,
            action=action_name,
            only_pending=only_pending
        )
    )


@softwares.put("/installation/{installation_id}/provision/{action_name}")
async def create_installation_provision(
    installation_id: UUID,
    action_name: Literal['new_software', 'upgrade_software'],
    request: NewSoftwareRequest | UpgradeSoftwareRequest,
    db = Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
) -> LabProvisionDetail[SoftwareInstallation, Any]:
    installation = await SoftwareInstallation.get_by_id(db, installation_id)

    if action_name != request.action:
        raise ValueError(f'Expected an {action_name} request')

    provision = await request.do_create(db, installation=installation, current_user=current_user)
    return await LabProvisionDetail.from_model(provision)

@softwares.get("/installation/{installation_id}/lease")
async def index_installation_leases(installation_id: UUID, db=Depends(get_db)) -> SoftwareLeaseIndexPage:
    return await SoftwareLeaseIndexPage.from_selection(
        db,
        query_software_leases(
            installation=installation_id
        )
    )

@softwares.get("/software/provision")
@softwares.get("/softwares/provision/{action_name}")
async def index_software_provisions(
    action: Literal["new_software", "upgrade_software"] | None = None,
    page_index: int = 1,
    db = Depends(get_db)
):
    return await LabProvisionIndexPage.from_selection(
        db,
        query_software_installation_provisions(action=action),
        page_index=page_index
    )
