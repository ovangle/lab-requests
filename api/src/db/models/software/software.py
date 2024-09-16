from __future__ import annotations
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db.models.base import Base
from db.models.fields import uuid_pk
from db.models.lab import Lab
from db.models.lab.installable import Installable

if TYPE_CHECKING:
    from .software_installation import SoftwareInstallation


class Software(Installable, Base):
    __tablename__ = "software"
    id: Mapped[uuid_pk] = mapped_column()

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(64), unique=True, index=True)
    description: Mapped[str] = mapped_column(postgresql.TEXT)

    tags: Mapped[list[str]] = mapped_column(postgresql.ARRAY(postgresql.TEXT), server_default="{}")

    requires_license: Mapped[bool] = mapped_column(postgresql.BOOLEAN, default=False)
    is_paid_software: Mapped[bool] = mapped_column(postgresql.BOOLEAN, default=False)

def query_softwares(
    lab: Lab | UUID | None = None,
    name_eq: str | None = None,
    name_istartswith: str | None = None,
    has_tags: set[str] | None = None
) -> Select[tuple[Software]]:
    from .software_installation import query_software_installations
    where_clauses: list = []

    if lab is not None:
        installed_labs = query_software_installations(lab=lab)
        where_clauses.append(Software.id.in_(installed_labs.scalar_subquery()))

    if name_eq is not None:
        where_clauses.append(Software.name == name_eq)
    elif name_istartswith:
        where_clauses.append(Software.name._ilike(f"{name_istartswith}%"))

    if has_tags:
        where_clauses.append(*[Software.tags.contains(tag) for tag in has_tags])

    return select(Software)