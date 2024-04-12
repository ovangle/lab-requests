from typing import (
    Annotated,
    Any,
    Awaitable,
    Callable,
    NewType,
    Optional,
    TypeVar,
    TypeVarTuple,
    TypedDict,
    Unpack,
    cast,
)
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import Select, select

from db import get_db
from db.models.lab.lab_resource import LabResource, LabResourceType, select_resources
from db.models.lab.lab_resource_container import (
    LabResourceConsumer,
    LabResourceContainer,
    get_mapped_consumer_container_id,
)

from .schemas import (
    LabResourceIndexPage,
    resource_index_cls,
    resource_params_cls,
    resource_view_cls,
)

TConsumer = TypeVar("TConsumer", bound=LabResourceConsumer)


def _resource_type_route_prefix(t: LabResourceType) -> str:
    return f"/{t.value.replace("_", "-")}s"


def _register_resource_views(router: APIRouter, resource_type: LabResourceType):
    route_prefix = _resource_type_route_prefix(resource_type)

    index_type = resource_index_cls(resource_type)
    view_type = resource_view_cls(resource_type)
    params_type = resource_params_cls(resource_type)

    @router.get(route_prefix + "/")
    async def index_resources(consumer_id: UUID | None = None, db=Depends(get_db)):
        selection = select_resources(resource_type)
        index = index_type(cast(Select[tuple[Any]], selection), consumer_id=consumer_id)
        return await index.load_page(db, 1)

    @router.get(route_prefix + "/{id}", response_model=view_type)
    async def read_resource(lab_id: UUID, id: UUID, db=Depends(get_db)):
        model = await LabResource.get_for_id(db, id)
        assert model.lab_id == lab_id
        assert model.type == resource_type
        return await view_type.from_model(model)

    @router.post(route_prefix)
    async def create_resource(lab_id: UUID, request: Request, db=Depends(get_db)):
        raise NotImplementedError


lab_resources = APIRouter(prefix="/resources")

_register_resource_views(lab_resources, LabResourceType.EQUIPMENT_LEASE)
_register_resource_views(lab_resources, LabResourceType.SOFTWARE_LEASE)
_register_resource_views(lab_resources, LabResourceType.INPUT_MATERIAL)
_register_resource_views(lab_resources, LabResourceType.OUTPUT_MATERIAL)


def _register_resource_consumer_views(
    consumer_resources: APIRouter,
    consumer_param: str,
    resource_type: LabResourceType,
):
    index_type = resource_index_cls(resource_type)
    view_type = resource_view_cls(resource_type)
    params_type = resource_params_cls(resource_type)

    resources_of_type = APIRouter(prefix=_resource_type_route_prefix(resource_type))

    @resources_of_type.get("/")
    async def index_resources(
        consumer_id: Annotated[UUID, Query(alias=consumer_param)], db=Depends(get_db)
    ) -> LabResourceIndexPage:
        selection = select_resources(
            resource_type=resource_type, consumer_id=consumer_id
        )
        index = index_type(
            cast(Select[tuple[Any]], selection),
            consumer_id=consumer_id,
        )
        return await index.load_page(db, 1)

    @resources_of_type.get("/{resource_index}")
    async def get_resource(
        consumer_id: Annotated[UUID, Query(alias=consumer_param)], resource_index: int, db=Depends(get_db)
    ):
        container_id = await get_mapped_consumer_container_id(db, consumer_id)
        model = await LabResource.get_for_container_index(
            db, container_id, resource_index
        )
        return await view_type.from_model(model)

    @resources_of_type.post("/")
    async def append_resource(
        self, consumer_id: Annotated[UUID, Query(alias=consumer_param)], request: Request, db=Depends(get_db)
    ):
        patch = params_type.model_validate_json(await request.json())
        raise NotImplementedError()

    @resources_of_type.post("/{at_index}")
    async def insert_resource(
        self, consumer_id: Annotated[UUID, Query(alias=consumer_param)], at_index: int, request: Request, db=Depends(get_db)
    ):
        patch = params_type.model_validate_json(await request.json())
        raise NotImplementedError()

    @resources_of_type.delete("/{at_index}")
    async def delete_resource(
        self, consumer_id: Annotated[UUID, Query(alias=consumer_param)], at_index: int, dp=Depends(get_db)
    ):
        raise NotImplementedError()

    consumer_resources.include_router(resources_of_type)


def register_equipment_lease_consumer_views(
    router: APIRouter,
    consumer_prefix: str,
):
    _register_resource_consumer_views(
        router,
        consumer_prefix,
        LabResourceType.EQUIPMENT_LEASE,
    )


def register_software_lease_consumer_views(resource_router: APIRouter, consumer_param: str):
    return _register_resource_consumer_views(
        resource_router,
        consumer_param,
        LabResourceType.SOFTWARE_LEASE,
    )


def register_input_material_consumer_views(
    resource_router: APIRouter,
    consumer_param: str,
):
    return _register_resource_consumer_views(
        resource_router,
        consumer_param,
        LabResourceType.INPUT_MATERIAL,
    )


def register_output_material_consumer_views(resource_router: APIRouter, consumer_param: str):
    return _register_resource_consumer_views(
        resource_router,
        consumer_param,
        LabResourceType.OUTPUT_MATERIAL,
    )


def register_resource_consumer_views(
    resource_router: APIRouter,
    consumer_param: str,
    include_types: set[LabResourceType] | None = None,
):
    include_types = include_types or set(LabResourceType)

    if LabResourceType.EQUIPMENT_LEASE in include_types:
        register_equipment_lease_consumer_views(resource_router, consumer_param)

    if LabResourceType.SOFTWARE_LEASE in include_types:
        register_software_lease_consumer_views(resource_router, consumer_param)

    if LabResourceType.INPUT_MATERIAL in include_types:
        register_input_material_consumer_views(resource_router, consumer_param)

    if LabResourceType.OUTPUT_MATERIAL in include_types:
        register_output_material_consumer_views(resource_router, consumer_param)
