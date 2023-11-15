from __future__ import annotations
from enum import Enum

import re
from typing import Annotated, Any

from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema, CoreSchema
from sqlalchemy import VARCHAR
from sqlalchemy.orm import mapped_column


class UserDomain(Enum):
    """
    Represents the origin of the user in question. Native users are
    users which are stored in our database, external users exist in 
    some external user information store we trust.
    """
    NATIVE = 'native'
    EXTERNAL = 'external'


class UserRole(str):
    _RE = re.compile(r'[_A-Z]{0,64}', re.IGNORECASE)

    def __new__(cls, value: str | UserRole):
        if isinstance(value, UserRole):
            return value
        if not cls._RE.fullmatch(value):
            raise ValueError(f'value must full match {cls._RE.pattern}')
        
        return super().__new__(cls, value)

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler
    ):
        return core_schema.no_info_after_validator_function(cls, handler(str))

user_role = Annotated[
    UserRole, mapped_column(VARCHAR(64))
]