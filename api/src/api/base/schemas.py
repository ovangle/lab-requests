from datetime import datetime
from pydantic.dataclasses import dataclass

@dataclass(kw_only=True)
class RecordMetadata:
    created_at: datetime
    updated_at: datetime