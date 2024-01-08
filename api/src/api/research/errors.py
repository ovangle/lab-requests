from uuid import UUID
from fastapi import HTTPException


class FundingModelDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, f"Could not locate funding model with id '{id}'")

    @classmethod
    def for_name(cls, name: str):
        return cls(404, f"Could not locate funding model with name '{name}'")
