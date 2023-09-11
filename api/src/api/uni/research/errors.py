

from uuid import UUID


class FundingModelDoesNotExist(Exception):
    @classmethod
    def for_id(cls, id: UUID):
        return cls('ExperimentalPlanFundingModel {id} does not exist')
