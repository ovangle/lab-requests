from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Any, Optional, cast
from uuid import UUID
from fastapi import UploadFile

from sqlalchemy import VARCHAR, ForeignKey, select, Select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TEXT, DATE
from sqlalchemy.dialects import postgresql as pg_dialect
from api.base.files.models import StoredFile_
from api.lab.work_unit.resource.common.schemas import ResourceFileAttachment, ResourceType

from db import LocalSession
from db.orm import uuid_pk, email
from api.base.models import Base
from api.uni.models import Campus
from api.lab.types import LabType
from api.lab.plan.models import ExperimentalPlan_
from files.store import FileStore

from .errors import WorkUnitDoesNotExist
from .resource.models import ResourceContainer_, ResourceContainerFileAttachment_
    
class WorkUnit_(ResourceContainer_, Base):
    __tablename__ = 'work_units'

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey('experimental_plans.id'))
    plan: Mapped[ExperimentalPlan_] = relationship(back_populates='work_units')

    campus_id: Mapped[UUID] = mapped_column(ForeignKey('campuses.id'))
    campus: Mapped[Campus] = relationship()

    index: Mapped[int] = mapped_column()

    lab_type: Mapped[LabType] = mapped_column(pg_dialect.ENUM(LabType))
    technician_email: Mapped[email]

    process_summary: Mapped[str] = mapped_column(TEXT)

    start_date: Mapped[Optional[date]] = mapped_column(DATE)
    end_date: Mapped[Optional[date]] = mapped_column(DATE)

    file_attachments: Mapped[set[WorkUnitFileAttachment_]] = relationship(back_populates="work_unit")

    def __init__(self, 
                 plan_id: UUID, 
                 index: int, *, 
                 campus_id: UUID,
                 lab_type: LabType, 
                 technician_email: str, 
                 process_summary: str, 
                 start_date: date | None, 
                 end_date: date | None
    ):
        super().__init__()
        self.plan_id = plan_id
        self.index = index
        self.campus_id = campus_id
        self.lab_type = lab_type
        self.technician_email = technician_email
        self.process_summary = process_summary
        self.start_date = start_date
        self.end_date = end_date

    @staticmethod
    async def get_for_id(db: LocalSession, id: UUID) -> WorkUnit_:
        instance = await db.get(WorkUnit_, id)
        if not instance:
            raise WorkUnitDoesNotExist.for_id(id)
        return instance

    @staticmethod
    async def get_for_plan_and_index(db: LocalSession, plan_id: UUID, index: int) -> WorkUnit_:
        instance = await db.scalar(
            select(WorkUnit_).where(WorkUnit_.plan_id == plan_id, WorkUnit_.index == index)
        )
        if not instance:
            raise WorkUnitDoesNotExist.for_plan_id_and_index(plan_id, index)
        return instance

    @staticmethod
    def list_for_experimental_plan(db: LocalSession, plan_id: UUID) -> Select[tuple[WorkUnit_]]:
        return (
            select(WorkUnit_)
                .where(WorkUnit_.plan_id == plan_id)
                .order_by(WorkUnit_.index)
        )
    
    @staticmethod
    def list_for_technician(db: LocalSession, technician_email: str) -> Select[tuple[WorkUnit_]]:
        return select(WorkUnit_).where(WorkUnit_.technician_email == technician_email)

    def get_file_attachments(self, resource_type: ResourceType, resource_id: UUID) -> list[ResourceContainerFileAttachment_]:
        try:
            file_attachments = self.file_attachments
        except IOError:
            raise IOError('Cannot access unresolved awaitable attribute \'file_attachments\'')
        return [
            attachment
            for attachment in file_attachments
            if attachment.is_resource_attachment(resource_type, resource_id)
        ]


class WorkUnitFileAttachment_(ResourceContainerFileAttachment_, StoredFile_):
    __tablename__ = 'work_unit_file_attachments'
    filestore = FileStore(Path('lab/work-units'))

    id: Mapped[uuid_pk]

    work_unit_id: Mapped[UUID] = mapped_column(ForeignKey('work_units.id'))
    work_unit = relationship(back_populates="file_attachments")


    @property
    def path(self):
        return Path(f'{self.work_unit_id!s}/{self.resource_type}/{self.filename}')

    def is_resource_attachment(self, resource_type: ResourceType, id: UUID):
        return self.resource_type == resource_type and self.resource_id == id

    def get_container_id(self):
        return self.work_unit_id

    async def get_container(self, db: LocalSession):
        return await WorkUnit_.get_for_id(db, self.work_unit_id)
