import re
from typing import Annotated

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects import postgresql as psql


INSTALLATION_TYPE_PATTERN = re.compile(r"^[a-z_]+$")


def is_installation_type(value: str):
    return INSTALLATION_TYPE_PATTERN.match(value)
