from enum import Enum


class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    SERVICE = 'service'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'


class ResourceDisposalType(Enum):
    GENERAL = 'general'
    BULK = 'bulk/landfill'
    RECYCLEABLE = 'recylable'
    LIQUIDS = 'liquid/oil'
    HAZARDOUS = 'hazardous'
    OTHER = 'other'


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
