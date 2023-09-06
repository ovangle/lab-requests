

from uuid import UUID


class EquipmentDoesNotExist(Exception):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(f'No equipment exists with id {id}')