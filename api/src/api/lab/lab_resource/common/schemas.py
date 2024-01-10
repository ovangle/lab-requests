from __future__ import annotations
from abc import abstractmethod
from datetime import datetime
from enum import Enum
from pathlib import Path
import re
from typing import TYPE_CHECKING, Any, ClassVar, Generic, Literal, Type, TypeVar, cast
from uuid import UUID, uuid4
from fastapi import UploadFile

from pydantic import Field, GetCoreSchemaHandler
from pydantic_core import core_schema

from db import LocalSession

from ....base.schemas import BaseModel
from .resource_type import ResourceType


class HazardClass(str):
    RE = re.compile(r"(?P<group>\d+)(?P<class>\.\d+)?")

    def __new__(cls, value: str | HazardClass):
        if isinstance(value, HazardClass):
            return value
        if not HazardClass.RE.match(value):
            raise ValueError("Invalid Hazard class. Must match ")

        return super().__new__(cls, value)

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ):
        return core_schema.no_info_after_validator_function(cls, handler(str))


class ResourceCostEstimate(BaseModel):
    is_university_supplied: bool
    estimated_cost: float = 0


class ResourceStorage(BaseModel):
    description: str
    estimated_cost: ResourceCostEstimate | None = None


class ResourceDisposal(BaseModel):
    description: str
    estimated_cost: ResourceCostEstimate | None = None


class ResourceFileAttachment(BaseModel):
    container_id: UUID
    resource_type: ResourceType
    resource_id: UUID

    @classmethod
    def from_model(cls, model):
        if model.resource_type is None or model.resource_id is None:
            raise ValueError("Invalid resource container file attachment")

        return cls(
            container_id=model.get_container_id(),
            resource_type=model.resource_type,
            resource_id=model.resource_id,
        )


class ResourceBase(BaseModel):
    __resource_type__: ClassVar[ResourceType]

    container_id: UUID
    id: UUID
    index: int

    attachments: list[ResourceFileAttachment] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime

    @classmethod
    def create(
        cls,
        container: UUID,
        index: int,
        params: ResourceParams,
    ):
        raise NotImplementedError

    async def sync_file_attachments(self, container):
        file_attachments = await container.get_file_attachments(
            ResourceType.for_resource(self), self.id
        )
        self.attachments = [
            # ResourceFileAttachment(
            #     container_id=container_attachment.get_container_id(),
            #     resource_type=cast(ResourceType, container_attachment.resource_type),
            #     resource_id=cast(UUID, container_attachment.resource_id),
            #     stored_file=container_attachment.stored_file_meta,
            # )
            # for container_attachment in file_attachments
        ]
        return self

    def apply(self, params: ResourceParams):
        self.updated_at = datetime.now()

    @property
    def type(self) -> ResourceType:
        return ResourceType(self)


class ResourceParams(BaseModel):
    id: UUID | None = None
