from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects import postgresql

from ..func import gen_random_uuid


uuid_pk = Annotated[
    UUID,
    mapped_column(postgresql.UUID, primary_key=True, server_default=gen_random_uuid()),
]


_POSTGRES_EMAIL_RE = (
    r"^"
    r"[a-z0-9.!#$%&''*+/=?^_`{|}~-]+"
    r"@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*"
    r"$"
)

EMAIL_DOMAIN = postgresql.DOMAIN(
    "email", postgresql.CITEXT(), check=rf"value ~ '{_POSTGRES_EMAIL_RE}'"
)

email_str = Annotated[str, mapped_column(EMAIL_DOMAIN)]


action_timestamp = Annotated[
    datetime | None, mapped_column(postgresql.TIME(timezone=True), server_default=None)
]
action_user_fk = Annotated[UUID | None, mapped_column(ForeignKey("users.id"))]

action_notes = Annotated[str, mapped_column(postgresql.TEXT)]
