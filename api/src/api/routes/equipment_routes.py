from typing import Any, Literal
from uuid import UUID
from fastapi import APIRouter, Depends

from api.auth.context import get_current_authenticated_user

from db import get_db
from db.models.equipment.equipment import Equipment, query_equipments
from db.models.equipment.equipment_installation import EquipmentInstallation, query_equipment_installation_provisions, query_equipment_installations
from db.models.equipment.equipment_lease import query_equipment_leases
from db.models.lab.provisionable.lab_provision import LabProvision

from api.schemas.lab import LabProvisionDetail, LabProvisionIndexPage
from api.schemas.equipment import (
    EquipmentCreateRequest,
    EquipmentDetail,
    EquipmentIndexPage,
    CreateEquipmentInstallationRequest,
    EquipmentInstallationDetail,
    EquipmentInstallationIndexPage,
    EquipmentInstallationProvisionDetail, NewEquipmentRequest, TransferEquipmentRequest, EquipmentInstallationUpdateRequest,
    EquipmentLeaseDetail,
    EquipmentLeaseIndexPage
)

equipments = APIRouter(prefix="/equipments")

@equipments.get("/equipment")
async def index_equipments(
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


    return await EquipmentIndexPage.from_selection(
        db,
        query_equipments(
            lab=lab_id,
            name_istartswith=name_startswith,
            name_eq=name,
            has_tags=tags_,
        ),
        page_index=page_index
    )


@equipments.post("/equipment")
async def create_equipment(create_req: EquipmentCreateRequest, db=Depends(get_db), current_user=Depends(get_current_authenticated_user)):
    model = await create_req.do_create(db, current_user=current_user)
    return await EquipmentDetail.from_model(model)


@equipments.get("/equipment/{equipment_id}")
async def read_equipment(equipment_id: UUID, db=Depends(get_db)) -> EquipmentDetail:
    equipment = await Equipment.get_for_id(db, equipment_id)
    return await EquipmentDetail.from_model(equipment)

@equipments.get("/installation")
async def index_equipment_installations(
    lab: UUID | None = None,
    equipment: UUID | None = None,
    page_index: int = 1,
    db=Depends(get_db)
):
    return await EquipmentInstallationIndexPage.from_selection(
        db,
        query_equipment_installations(lab=lab, equipment=equipment),
        page_index=page_index
    )

@equipments.post("/installation")
async def create_installation(
    create_req: CreateEquipmentInstallationRequest | NewEquipmentRequest,
    db=Depends(get_db), current_user=Depends(get_current_authenticated_user)
) -> EquipmentInstallationDetail:

    installation_or_provision = await create_req.do_create(db, current_user=current_user)
    if isinstance(installation_or_provision, LabProvision):
        installation = await EquipmentInstallation.get_by_id(db, installation_or_provision.action_params["installation_id"])

    return await EquipmentInstallationDetail.from_model(installation)


@equipments.get("/installation/{installation_id}")
async def read_equipment_installation(
    installation_id: UUID, db=Depends(get_db)
) -> EquipmentInstallationDetail:
    equipment_installation = await EquipmentInstallation.get_by_id(db, installation_id)
    return await EquipmentInstallationDetail.from_model(equipment_installation)

@equipments.put("/installation/{installation_id}")
async def update_equipment_installation(
    installation_id: UUID,
    update_req: EquipmentInstallationUpdateRequest | NewEquipmentRequest | TransferEquipmentRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
):
    installation = await EquipmentInstallation.get_by_id(db, installation_id)

    if isinstance(update_req, EquipmentInstallationUpdateRequest):
        installation = await update_req.do_update(installation, current_user=current_user)
    else:
        lab = await installation.awaitable_attrs.lab
        provision = await update_req.do_create(db, )


    return await EquipmentInstallationDetail.from_model(installation)

@equipments.get("/installation/{installation}/provision")
@equipments.get("/installation/{installation}/provision/{action_name}")
async def index_installation_provisions(
    installation: UUID,
    action_name: Literal["new_equipment", "transfer_equipment"] | None = None,
    only_pending: bool = False,
    db=Depends(get_db)
) -> LabProvisionIndexPage:
    return await LabProvisionIndexPage.from_selection(
        db,
        query_equipment_installation_provisions(
            installation=installation,
            action=action_name,
            only_pending=only_pending
        )
    )


@equipments.put("/installation/{installation_id}/provision/{action_name}")
async def create_installation_provision(
    installation_id: UUID,
    action_name: Literal['new_equipment', 'transfer_equipment'],
    request: NewEquipmentRequest | TransferEquipmentRequest,
    db = Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
) -> LabProvisionDetail[EquipmentInstallation, Any]:
    installation = await EquipmentInstallation.get_by_id(db, installation_id)

    if action_name != request.action:
        raise ValueError(f'Expected an {action_name} request')

    provision = await request.do_create(db, installation=installation, current_user=current_user)
    return await LabProvisionDetail.from_model(provision)

@equipments.get("/installation/{installation_id}/lease")
async def index_installation_leases(installation_id: UUID, db=Depends(get_db)) -> EquipmentLeaseIndexPage:
    return await EquipmentLeaseIndexPage.from_selection(
        db,
        query_equipment_leases(
            installation=installation_id
        )
    )


@equipments.get("/provision/")
async def index_equipment_provisions(
    equipment: UUID | None = None,
    db = Depends(get_db)
) -> LabProvisionIndexPage:
    return await LabProvisionIndexPage.from_selection(
        db,
        query_equipment_installation_provisions(
            equipment=equipment
        )
    )
