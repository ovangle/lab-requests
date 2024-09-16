

from uuid import UUID, uuid4

from pydantic import Field
from db import LocalSession, local_object_session
from db.models.equipment.equipment import Equipment
from db.models.software import Software, query_softwares
from db.models.user import User
from ..base import ModelCreateRequest, ModelDetail, ModelIndex, ModelIndexPage, ModelRequestContextError, ModelUpdateRequest

from .software_installation import SoftwareInstallationIndexPage


class SoftwareDetail(ModelDetail[Software]):
    name: str
    description: str
    tags: set[str]

    requires_license: bool
    is_paid_software: bool

    installations: SoftwareInstallationIndexPage

    @classmethod
    async def from_model(cls, model: Software):
        from .software_installation import SoftwareInstallationIndex
        db = local_object_session(model)

        installation_index = SoftwareInstallationIndex(software=model.id)

        return cls._from_base(
            model,
            name=model.name,
            description=model.description,
            installations=await installation_index.load_page(db),
            tags=model.tags,
            requires_license=model.requires_license,
            is_paid_software=model.is_paid_software
        )

class SoftwareIndex(ModelIndex[Software]):
    lab_id: UUID | None

    name_istartswith: str | None = None
    name_eq: str | None = None
    has_tags: set[str] = Field(default_factory=set)

    def item_from_model(self, model: Software):
        return SoftwareDetail.from_model(model)

    def get_selection(self):
        return query_softwares(
            lab=self.lab_id,
            name_istartswith=self.name_istartswith,
            name_eq=self.name_eq,
            has_tags=self.has_tags
        )

SoftwareIndexPage = ModelIndexPage[Software, SoftwareDetail]

class SoftwareCreateRequest(ModelCreateRequest[Software]):
    name: str
    description: str | None = None
    tags: list[str] | None = None
    requires_license: bool = False
    is_paid_software: bool = False

    async def do_create(self, db: LocalSession, current_user: User | None = None, **kwargs):
        if not current_user:
            raise ModelRequestContextError("No current user")

        software = Software(
            id=uuid4(),
            name=self.name,
            description=self.description,
            tags=self.tags or list(),
            requires_license=self.requires_license,
            is_paid_software=self.is_paid_software
        )
        db.add(software)
        await db.commit()
        return software


class SoftwareUpdateRequest(ModelUpdateRequest[Software]):
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def apply(self, software: Software, current_user: User | None = None, **kwargs):
        if not current_user:
            raise ModelRequestContextError("No current user")
        if self.description:
            software.description = self.description
        if self.tags:
            software.tags = self.tags
        if self.training_descriptions:
            software.training_descriptions = self.training_descriptions

        return await software.save()
