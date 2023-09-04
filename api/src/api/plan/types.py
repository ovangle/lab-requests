from __future__ import annotations

from enum import Enum
import re
from typing import Any

from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema

class FundingType(str):
    re = re.compile(r'^[a-z]{0,8}$')

    def __new__(cls, value: str | FundingType):
        if isinstance(value, FundingType):
            return value

        if not FundingType.re.match(value):
            raise ValueError('Funding type must match {FundingType.re}')
        return super().__new__(cls, value)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler):
        return core_schema.no_info_after_validator_function(cls, handler(str))


class LabType(Enum):
    ELECTRICAL = 'Electrical'
    MECHANICAL = 'Mechanical'
    CIVIL = 'Civil'
    ICT = 'ICT'
