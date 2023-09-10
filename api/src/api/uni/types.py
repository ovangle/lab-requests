from __future__ import annotations

import re
from typing import Annotated, Any, Type

from enum import Enum
from typing import ClassVar
from pydantic import AfterValidator, GetCoreSchemaHandler, constr
from pydantic_core import CoreSchema, core_schema

from sqlalchemy import VARCHAR, TypeDecorator
from sqlalchemy.orm import mapped_column

class CampusCode(str):
    _RE = re.compile(r'^[A-Z]{0,8}$')

    def __new__(cls, value: str | CampusCode):
        if isinstance(value, CampusCode):
            return value
        return super().__new__(cls, value)

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler
    ):
        return core_schema.no_info_after_validator_function(cls, handler(str))

campus_code = Annotated[
    CampusCode, mapped_column(VARCHAR(8))
]

class Discipline(Enum):
    ELECTRICAL = 'Electrical'
    MECHANICAL = 'Mechanical'
    CIVIL = 'Civil'
    ICT = 'ICT'
