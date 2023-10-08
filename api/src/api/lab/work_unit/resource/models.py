from __future__ import annotations

from abc import abstractmethod
import asyncio
from uuid import UUID
from typing import TYPE_CHECKING, Any, Awaitable, List, TypeVar
from fastapi import UploadFile
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from api.base.files.models import StoredFile_
from db import LocalSession
from db.orm import uuid_pk

from api.base.models import Base
from .common.resource_type import ResourceType

if TYPE_CHECKING:
    from .common.schemas import ResourceBase

TContainer = TypeVar('TContainer', bound='ResourceContainer_')

class ResourceContainer_(Base):
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
    def get_file_attachments(self, resource_type: ResourceType, resource_id: UUID) -> Awaitable[list[ResourceContainerFileAttachment_]]:
        ...
    
    async def _sync_resource_file_attachments(self, resource_type: ResourceType, container: ResourceContainer_) -> list[ResourceBase]:
        resources: list[ResourceBase] = getattr(self, resource_type.container_attr_name)
        synced_resources: list[Awaitable[ResourceBase]] = [
            r.sync_file_attachments(container)
            for r in resources
        ]

        return await asyncio.gather(*synced_resources)

    async def sync_file_attachments(self: TContainer, container: ResourceContainer_) -> TContainer:
        for resource_type in ResourceType: 
            resources = await self._sync_resource_file_attachments(resource_type, container)
            setattr(self, resource_type.container_attr_name, resources)
        return self


class ResourceContainerFileAttachment_(StoredFile_):
    __abstract__ = True

    id: Mapped[uuid_pk]

    resource_type: Mapped[ResourceType | None] = mapped_column(default=None)
    resource_id: Mapped[UUID | None] = mapped_column(default=None)

    @abstractmethod
    def get_container_id(self) -> UUID:
        ...

    @abstractmethod
    async def get_container(self, db: LocalSession) -> ResourceContainer_:
        ...

    @property
    def is_resource_attachment(self):
        return self.resource_type is not None and self.resource_id is not None
