from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from api.lab.work_unit.resource.common.schemas import ResourceType
from db import LocalSession

from filestore.store import FileStore
from .schemas import WorkUnit
from .resource.schemas import Resource, ResourceFileAttachment
from . import models

workunit_filestore = FileStore('lab/work-units')

async def upload_resource_attachment(
    db: LocalSession,
    resource: Resource,
    upload_file: UploadFile,
) -> ResourceFileAttachment:
    resource_name = resource.type.container_attr_name
    path = Path(f'{resource.container_id!s}/{resource_name}/{resource.id!s}')

    stored_file_meta = await workunit_filestore.store(upload_file, save_to=path)
    
    attachment = models.WorkUnitFileAttachment_(
        work_unit_id=resource.container_id,
        resource_type=resource.type,
        resource_id=resource.id,
        **stored_file_meta
    )

    db.add(attachment)
    await db.commit()

    return ResourceFileAttachment.from_model(attachment)