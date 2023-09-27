
from abc import abstractmethod
from uuid import UUID
from typing import Any, List
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from db.orm import uuid_pk
from api.base.models import Base
from api.lab.work_unit.resource.schemas import resource_name


class ResourceContainer(Base):
    __abstract__ = True

    id: Mapped[uuid_pk]

    equipments: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    input_materials: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    output_materials: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    tasks: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    softwares: Mapped[List[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")

    def get_resources(self, resource_type) -> list[dict[str, Any]]:
        return getattr(self, resource_name(resource_type))