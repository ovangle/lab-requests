
from uuid import UUID
from fastapi import HTTPException


class WorkUnitDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, f'Work unit does not exist for id {id}')

    @classmethod
    def for_plan_id_and_index(cls, plan_id: UUID, index: int):
        return cls(404, f'Work unit does not exist for plan {plan_id} at index {index}')
