from uuid import UUID
from fastapi import HTTPException

from api.lab.work_unit.resource.common.schemas import ResourceType


class ResourceDoesNotExist(HTTPException):
    @classmethod
    def for_container(cls, container, resource_type, index):
        container_id = container if isinstance(container, UUID) else container.id
        return cls(
            404,
            f"No {resource_type} resource for container {container_id!s} at index {index}",
        )

    @classmethod
    def for_id(cls, resource_type: ResourceType, resource_id: UUID):
        return cls(404, f"No {resource_type!s}  with id {resource_id!s}")
