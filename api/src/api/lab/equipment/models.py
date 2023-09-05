
from sqlalchemy import ARRAY, TEXT, VARCHAR
from sqlalchemy.dialects import postgresql as pg_dialect
from sqlalchemy.orm import Mapped, mapped_column

from api.base.models import Base
from api.utils.db import uuid_pk

from ..types import LabType

class Equipment(Base):
    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(VARCHAR(128), unique=True)
    description: Mapped[str] = mapped_column(TEXT, server_default='')

    available_in_lab_types: Mapped[list[LabType]] = mapped_column(
        ARRAY(pg_dialect.ENUM(LabType)), 
        server_default="{}"
    )

    requires_training: Mapped[bool] = mapped_column()
    training_descriptions: Mapped[list[str]] = mapped_column(ARRAY(TEXT), server_default="{}")

