from pathlib import Path
from typing import ClassVar, Generic, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from db import LocalSession

from filestore.store import StoredFile
from api.base.schemas import ApiModel, SCHEMA_CONFIG

T = TypeVar('T', bound=ApiModel)

class ApiModelAttachment(StoredFile, BaseModel, Generic[T]):
    model_config = SCHEMA_CONFIG

    __api_model_type__: ClassVar[type[ApiModel] | str]

    # Path to the model resource
    model_path: Path | str
    # Unique identifier of the resource.
    model_id: UUID

    async def get_api_model(self, db: LocalSession) -> T:
        model_cls = model_attachment_api_type(self)
        return await model_cls.get_for_id(db, self.model_id)


def model_attachment_api_type(attachment: ApiModelAttachment[T] | Type[ApiModelAttachment[T]]) -> Type[T]:
    if not isinstance(attachment, type):
        return model_attachment_api_type(type(attachment))
    return getattr(attachment, '__api_model_type__')

