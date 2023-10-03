from pathlib import Path
from uuid import UUID

from fastapi import File, UploadFile

from filestore.store import FileStore, FileStoreConfig

BASE_LAB_WORK_ATTACHMENT_STORE_CONFIG: FileStoreConfig = {
    'path': 'lab/attachments/'
}


def get_work_unit_attachments_store(work_unit_id: UUID):
    return FileStore({
        'path': f'lab/attachments/{work_unit_id!s}'
    })
