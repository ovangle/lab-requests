from uuid import UUID
from fastapi import APIRouter, Depends

from api.auth.context import get_current_authenticated_user
from api.schemas.equipment.equipment import (
    EquipmentCreateRequest,
    EquipmentDetail,
    EquipmentIndexPage,
)
from api.schemas.equipment.equipment_installation import CreateEquipmentInstallationRequest, EquipmentInstallationDetail, EquipmentInstallationIndexPage, EquipmentInstallationProvisionDetail, NewEquipmentRequest, UpdateEquipmentInstallationReqeust
from db import get_db
from db.models.equipment.equipment import Equipment, query_equipments
from db.models.equipment.equipment_installation import EquipmentInstallation, query_equipment_installations


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
        EquipmentInstallationDetail.from_model,
        page_index=page_index
    )

@equipments.post("/installation")
async def create_installation(create_req: CreateEquipmentInstallationRequest | NewEquipmentRequest, db=Depends(get_db), current_user=Depends(get_current_authenticated_user)):
    installation = await create_req.do_create(db, current_user=current_user)
    if isinstance(installation, EquipmentInstallation):
        return await EquipmentInstallationDetail.from_model(installation)
    else:
        return await EquipmentInstallationProvisionDetail.from_model(installation)


@equipments.get("/installation/{installation_id}")
async def read_equipment_installation(
    installation_id: UUID, db=Depends(get_db)
) -> EquipmentInstallationDetail:
    equipment_installation = await EquipmentInstallation.get_by_id(db, installation_id)
    return await EquipmentInstallationDetail.from_model(equipment_installation)

@equipments.put("/installation/{installation_id}")
async def update_equipment_installation(
    installation_id: UUID,
    update_req: UpdateEquipmentInstallationReqeust | NewEquipmentRequest,
    db = Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
):
    installation = await EquipmentInstallation.get_by_id(db, installation_id)

    if isinstance(update_req, UpdateEquipmentInstallationReqeust):
        installation = await update_req.do_update(installation, current_user=current_user)
    else:
        lab = await installation.awaitable_attrs.lab
        await update_req.do_create(
            db,
            lab=lab
        )

    return await EquipmentInstallationDetail.from_model(installation)
