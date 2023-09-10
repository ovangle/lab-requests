

from uuid import UUID


class ExperimentalPlanFundingModelDoesNotExist(Exception):
    @classmethod
    def for_id(cls, id: UUID):
        return cls('ExperimentalPlanFundingModel {id} does not exist')
