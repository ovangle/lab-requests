from enum import Enum

from sqlalchemy.dialects import postgresql


class LabStorageType(Enum):
    STANDARD = "standard"


LAB_STORAGE_TYPE = postgresql.ENUM(LabStorageType, create_type=False)
