from typing import Optional
from uuid import UUID
from pydantic.dataclasses import dataclass

from .types import CampusCode

@dataclass()
class Campus:
    id: UUID
    code: CampusCode
    other_description: Optional[str]
