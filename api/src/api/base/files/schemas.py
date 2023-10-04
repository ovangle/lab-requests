from pathlib import Path
from typing import ClassVar, Generic, Type, TypeVar
from uuid import UUID
from fastapi import UploadFile

from pydantic import BaseModel
from db import LocalSession

from files.store import StoredFile
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


class StoredFile(BaseModel):
    # Path from the root of the 
    path: Path 

    filename: str
    orig_filename: str
    content_type: str

    size: int = 0

    def __init__(self, path: Path, file: UploadFile | None = None, **kwargs):
        self.path = path
        self.filename = path.name
        try:
            match file:
                case UploadFile():
                    orig_filename = file.filename or '<unknown>'
                case None: 
                    orig_filename = kwargs['orig_filename']
            self.orig_filename = orig_filename

            content_type = file.content_type if file else None
            if content_type is None:
                content_type = kwargs['content_type']
            self.content_type = str(content_type)

            size = file.size if file else None
            if size is None:
                size = kwargs['size']
            self.size = int(size)
        except KeyError as e:
            raise ValueError('Missing keyword argument', e)
        
