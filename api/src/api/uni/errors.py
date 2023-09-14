from uuid import UUID

from fastapi import HTTPException

from .types import CampusCode

class CampusDoesNotExist(HTTPException):
    @classmethod
    def for_code(cls, code: CampusCode):
       return cls(404, f'No campus exists with campus code {code}')
    
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, f'No campus exists with id {id}')