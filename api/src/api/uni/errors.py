from uuid import UUID

from .types import CampusCode

class CampusDoesNotExist(Exception):
    @classmethod
    def for_code(cls, code: CampusCode):
        return cls('No campus exists with campus code {code}')
    
    @classmethod
    def for_id(cls, id: UUID):
        return cls('No campus exists with id {id}')