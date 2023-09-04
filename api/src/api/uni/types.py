from __future__ import annotations

import re
from typing import Annotated

from enum import Enum
from typing import ClassVar

from sqlalchemy import VARCHAR, TypeDecorator
from sqlalchemy.orm import mapped_column


class CampusCode(str):
    re = re.compile(r'^[A-Z]{0,8}$')

    def __new__(cls, value: str | CampusCode):
        if isinstance(value, CampusCode):
            return value

        if not CampusCode.re.match(value):
            raise ValueError(f'value must match {CampusCode.re}')

        return super().__new__(cls, value) 

class _CampusCodeDecorator(TypeDecorator):
    impl = VARCHAR(64)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return str(value)
 
    def process_result_value(self, value: str, dialect):
        return CampusCode(value)

    def copy(self, **kw):
        return _CampusCodeDecorator()

    
campus_code = Annotated[CampusCode, mapped_column(VARCHAR(8))]