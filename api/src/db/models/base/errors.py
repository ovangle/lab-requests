from typing import TYPE_CHECKING
from uuid import UUID

if TYPE_CHECKING:
    from . import Base


class ModelException(Exception):
    pass


class DoesNotExist(ModelException):
    def __init__(self, msg: str | None = None, *, for_id: UUID | None = None):
        if for_id:
            msg = f"No instance with id '{for_id}'"

        super().__init__(msg)


class DetachedInstanceError(ModelException):
    def __init__(self, instance):
        self.instance = instance
        super().__init__(f"Instance {instance} was detached from session")
