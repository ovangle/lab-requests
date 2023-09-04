from __future__ import annotations

from enum import Enum
import re

class FundingType(str):
    re = re.compile(r'^[a-z]{0,8}$')

    def __new__(cls, value: str | FundingType):
        if isinstance(value, FundingType):
            return value

        if not FundingType.re.match(value):
            raise ValueError('Funding type must match {FundingType.re}')
        return super().__new__(cls, value)


class LabType(Enum):
    ELECTRICAL = 'Electrical'
    MECHANICAL = 'Mechanical'
    CIVIL = 'Civil'
    ICT = 'ICT'
