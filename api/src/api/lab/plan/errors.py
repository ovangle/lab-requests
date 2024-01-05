from uuid import UUID

from fastapi import HTTPException


class ExperimentalPlanDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, "Experimental plan (id: ${id}) does not exist")
