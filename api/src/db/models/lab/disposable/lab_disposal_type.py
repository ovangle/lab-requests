from enum import Enum

from sqlalchemy.dialects import postgresql


class LabDisposalType(Enum):
    STANDARD = "standard"


LAB_DISPOSAL_TYPE = postgresql.ENUM(LabDisposalType, create_type=False)
