
from abc import abstractmethod
from uuid import UUID
from typing import Any, List
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from db.orm import uuid_pk
from api.base.models import Base
from .common.schemas import ResourceType, ResourceFileAttachment

class ResourceContainer(Base):
    __abstract__ = True

    id: Mapped[uuid_pk]

    equipments: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    input_materials: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    output_materials: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    tasks: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    softwares: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")

    def get_resources(self, resource_type: ResourceType) -> list[dict[str, Any]]:
        return getattr(self, resource_type.container_attr_name)

    @abstractmethod
    def get_attachments(self, resource_type: ResourceType, resource_id: UUID) -> list[ResourceFileAttachment]:
        ...

class ResourceContainerFileAttachment_(Base):
    __abstract__ = True

    id: Mapped[uuid_pk]

    resource_type: Mapped[ResourceType | None] = mapped_column(default=None)
    resource_id: Mapped[UUID | None] = mapped_column(default=None)
