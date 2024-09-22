
from uuid import UUID
from sqlalchemy import select
from db.models.lab.disposable import LabDisposal, DisposalStrategy, query_lab_disposals

from ..base import ModelDetail, ModelIndexPage

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



LabDisposalIndexPage = ModelIndexPage[LabDisposal, LabDisposalDetail]