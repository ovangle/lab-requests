from pathlib import Path
from uuid import UUID

from fastapi import File, UploadFile
from pydantic import ValidationError

from filestore.store import FileStore

from .resource.common.schemas import ResourceBase, ResourceFileAttachment, ResourceType

class WorkUnitResourceFileStore(FileStore):
    def __init__(self, container_id: UUID):
        super().__init__(f'lab/attachments/{container_id!s}')
        self.container_id = container_id

    def resource_dir(
        self, 
        resource_type: ResourceType
    ) -> Path:
        return Path(f'{resource_type.container_attr_name}/')

    async def store_resource_attachment(
        self, 
        resource: ResourceBase,
        upload_file: UploadFile,
    ) -> ResourceFileAttachment:
        if not upload_file.filename:
            raise ValidationError('Uploaded file has no name')
        stored_file = await self.store(
            upload_file,
            use_filepath=self.resource_dir(ResourceType(resource)) / upload_file.filename
        )
        return ResourceFileAttachment(
            **stored_file.model_dump(),
            container_id=self.container_id,
            resource_type=ResourceType(resource),
            index=resource.index,
        )

def get_work_unit_attachments_store(work_unit_id: UUID):
    filestore = WorkUnitResourceFileStore(work_unit_id)
    try:
        yield filestore
    finally:
        filestore.close()
    