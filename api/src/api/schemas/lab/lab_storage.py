from uuid import UUID
from sqlalchemy import select
from db import local_object_session
from db.models.base import model_id
from db.models.lab.storable import (
    LabStorageStrategy,
    LabStorage,
    query_lab_storages,
    LabStorageContainer,
    query_lab_storage_containers,
)

from ..base import ModelDetail, ModelIndexPage


class LabStorageStrategyDetail(ModelDetail[LabStorageStrategy]):
    name: str
    description: str

    @classmethod
    async def from_model(cls, model: LabStorageStrategy):
        return await cls._from_base(
            model,
            name=model.name,
            description=model.description
        )


class LabStorageContainerDetail(ModelDetail[LabStorageContainer]):
    storage_id: UUID

    @classmethod
    async def from_model(cls, model: LabStorageContainer):
        return await cls._from_base(
            model,
            storage_id=model.storage_id
        )

LabStorageContainerIndexPage = ModelIndexPage[LabStorageContainer, LabStorageContainerDetail]

class LabStorageDetail(ModelDetail[LabStorage]):
    lab_id: UUID

    strategy: LabStorageStrategyDetail

    items: LabStorageContainerIndexPage

    @classmethod
    async def from_model(cls, model: LabStorage):
        db = local_object_session(model)
        strategy = await model.awaitable_attrs.strategy

        items = await LabStorageContainerIndexPage.from_selection(
            db,
            query_lab_storage_containers(storage=model_id(model)),
            LabStorageContainerDetail.from_model
        )

        return await cls._from_base(
            model,
            lab_id=model.lab_id,
            strategy=await LabStorageStrategyDetail.from_model(strategy),
            items=items
        )

LabStorageIndexPage = ModelIndexPage[LabStorage, LabStorageDetail]