

from uuid import UUID


class EquipmentTagDoesNotExist(Exception):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(f'No equipment tag exists with id {id}')
    
    @classmethod
    def for_name(cls, name: str):
        return cls(f'No equipment tag exists with namw {name}')


class EquipmentDoesNotExist(Exception):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(f'No equipment exists with id {id}')