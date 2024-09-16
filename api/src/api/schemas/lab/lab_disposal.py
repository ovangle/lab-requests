
from uuid import UUID
from sqlalchemy import select
from db.models.lab.disposable import LabDisposal, DisposalStrategy, query_lab_disposals

from ..base import ModelDetail, ModelIndex, ModelIndexPage

class DisposalStrategyDetail(ModelDetail[DisposalStrategy]):
    name: str
    description: str

    @classmethod
    async def from_model(cls, model: DisposalStrategy):
        return await cls._from_base(
            model,
            name=model.name,
            description=model.description
        )


class DisposalStrategyIndex(ModelIndex[DisposalStrategy]):
    async def item_from_model(self, model: DisposalStrategy) -> ModelDetail[DisposalStrategy]:
        return await DisposalStrategyDetail.from_model(model)

    def get_selection(self):
        # If we're loading this, we're loading them all
        return select(DisposalStrategy)


class LabDisposalDetail(ModelDetail[LabDisposal]):
    strategy_id: UUID
    strategy_name: str

    lab_id: UUID

    @classmethod
    async def from_model(cls, model: LabDisposal):
        strategy = await model.awaitable_attrs.strategy

        return await cls._from_base(
            model,
            strategy_id=strategy.id,
            strategy_name=strategy.name,
            lab_id=model.lab_id
        )

class LabDisposalIndex(ModelIndex[LabDisposal]):
    lab: UUID | None = None

    async def item_from_model(cls, model: LabDisposal):
        return await LabDisposalDetail.from_model(model)

    def get_selection(self):
        return query_lab_disposals(lab=self.lab)


LabDisposalIndexPage = ModelIndexPage[LabDisposal, LabDisposalDetail]