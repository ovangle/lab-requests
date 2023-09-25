
from abc import abstractmethod
from uuid import UUID
from typing import Any, List
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from api.base.models import Base
from api.lab.work_unit.resource.schemas import resource_name

class ResourceContainer(Base):
    __abstract__ = True

    equipments: Mapped[List[dict[str, Any]]] = mapped_column(ARRAY(JSONB), server_default="{}")
    input_materials: Mapped[List[dict[str, Any]]] = mapped_column(ARRAY(JSONB), server_default="{}")
    output_materials: Mapped[List[dict[str, Any]]] = mapped_column(ARRAY(JSONB), server_default="{}")
    services: Mapped[List[dict[str, Any]]] = mapped_column(ARRAY(JSONB), server_default="{}")
    softwares: Mapped[List[dict[str, Any]]] = mapped_column(ARRAY(JSONB), server_default="{}")

    @abstractmethod
    def get_plan_id(self) -> UUID:
        raise NotImplementedError

    @abstractmethod
    def get_work_unit_id(self) -> UUID:
        raise NotImplementedError

    @abstractmethod
    def get_resources(self, resource_type) -> list[dict[str, Any]]:
        return getattr(self, resource_name(resource_type))

class Resource(dict[str, Any]):
    plan_id: UUID 
    work_unit_id: UUID