from types import FunctionType
from typing import List, Optional
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from api.base.models import Base

class ResourceContainer(Base):
    __abstract__ = True

    equipments: Mapped[List[dict]] = mapped_column(ARRAY(JSONB), server_default="{}")
    input_materials: Mapped[List[dict]] = mapped_column(ARRAY(JSONB), server_default="{}")
    output_materials: Mapped[List[dict]] = mapped_column(ARRAY(JSONB), server_default="{}")
    services: Mapped[List[dict]] = mapped_column(ARRAY(JSONB), server_default="{}")
    softwares: Mapped[List[dict]] = mapped_column(ARRAY(JSONB), server_default="{}")
