from uuid import UUID
from fastapi import HTTPException


class LabDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, f"No lab with id {id}")
