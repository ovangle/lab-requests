from typing import Annotated
from sqlalchemy import Integer

from sqlalchemy.orm import mapped_column, DeclarativeBase, Mapped
from sqlalchemy.dialects import postgresql as pg_dialect


# adapted from html5 standard
# https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#basic_validation
_POSTGRES_EMAIL_RE = (
    r"^"
    r"[a-z0-9.!#$%&''*+/=?^_`{|}~-]+"
    r"@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    r"(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*"
    r"$"
)

EMAIL_DOMAIN = pg_dialect.DOMAIN(
    'email',
    pg_dialect.CITEXT(),
    check=rf"VALUE ~ '{_POSTGRES_EMAIL_RE}'"
) 

email_str = Annotated[str, mapped_column(EMAIL_DOMAIN)]

class Base(DeclarativeBase):
    pass

class Contact(Base):
    __tablename__ = 'contacts'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[email_str]
