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

from ..base import ModelDetail, ModelIndex, ModelIndexPage


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


class LabStorageStrategyIndex(ModelIndex[LabStorageStrategy]):
    async def item_from_model(self, model: LabStorageStrategy):
        return await LabStorageStrategyDetail.from_model(model)

    def get_selection(self):
        return select(LabStorageStrategy)


class LabStorageContainerDetail(ModelDetail[LabStorageContainer]):
    storage_id: UUID

    @classmethod
    async def from_model(cls, model: LabStorageContainer):
        return await cls._from_base(
            model,
            storage_id=model.storage_id
        )


class LabStorageContainerIndex(ModelIndex[LabStorageContainer]):
    storage: UUID | None = None

    async def item_from_model(self, model: LabStorageContainer):
        return await LabStorageContainerDetail.from_model(model)

    def get_selection(self):
        return query_lab_storage_containers(
            storage=self.storage
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

        container_index = LabStorageContainerIndex(storage=model_id(model))

        return await cls._from_base(
            model,
            lab_id=model.lab_id,
            strategy=await LabStorageStrategyDetail.from_model(strategy),
            items=await container_index.load_page(db)
        )


class LabStorageIndex(ModelIndex[LabStorage]):
    lab: UUID | None = None

    async def item_from_model(self, model: LabStorage):
        return await LabStorageDetail.from_model(model)

    def get_selection(self):
        return query_lab_storages(lab=self.lab)

LabStorageIndexPage = ModelIndexPage[LabStorage, LabStorageDetail]