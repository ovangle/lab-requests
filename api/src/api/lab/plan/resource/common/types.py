from __future__ import annotations

from enum import Enum
import re


class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    SERVICE = 'service'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'

class ResourceStorageType(Enum):
    GENERAL = 'general'
    SAMPLES = 'samples'
    CHEMICAL = 'chemical'
    DRY = 'dry'
    BIOLOGICAL = 'biological'

    COLD = 'cold (-4 °C)'
    FROZEN = 'frozen (-18 °C)',
    ULT = 'ult (-80 °C)',
    OTHER = 'other'

class DisposalType(Enum):
    GENERAL = 'general'
    BULK = 'bulk/landfill'
    RECYCLEABLE = 'recylable'
    LIQUIDS = 'liquid/oil'
    HAZARDOUS = 'hazardous'
    OTHER = 'other'

class HazardClass(str):
    RE = re.compile(r'(?<group>\d+)(?<class>\.\d+)?')

    def __new__(cls, value: str | HazardClass):
        if isinstance(value, HazardClass):
            return value
        if not HazardClass.RE.match(value):
            raise ValueError('Invalid Hazard class. Must match ') 

        return super().__new__(cls, value)