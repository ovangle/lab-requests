from sqlalchemy.dialects import postgresql
from enum import Enum


class StorageType(Enum):
    STANDARD = "standard"


STORAGE_TYPE_ENUM = postgresql.ENUM(
    StorageType, name="lab_storage_type", create_type=False
)
