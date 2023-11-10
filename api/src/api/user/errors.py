
from uuid import UUID
from fastapi import HTTPException

class UserDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, f'No user exists with id {id}')