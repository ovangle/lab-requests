from typing import Annotated
from uuid import UUID
from sqlalchemy import VARCHAR

from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects import postgresql as pg_dialect

from .func import gen_random_uuid


uuid_pk = Annotated[UUID, mapped_column(pg_dialect.UUID, primary_key=True, server_default=gen_random_uuid())]


_POSTGRES_EMAIL_RE = (
    r"^"
    r"[a-z0-9.!#$%&''*+/=?^_`{|}~-]+"
    r"@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*"
    r"$"
)

EMAIL_DOMAIN = pg_dialect.DOMAIN(
    'email',
    pg_dialect.CITEXT(),
    check=rf"value ~ '{_POSTGRES_EMAIL_RE}'"
) 

email_str = Annotated[str, mapped_column(EMAIL_DOMAIN)]