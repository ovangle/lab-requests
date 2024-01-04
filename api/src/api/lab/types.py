from enum import Enum

from api.uni.types import Discipline


class LabType(Enum):
    ELECTRICAL = "Electrical"
    MECHANICAL = "Mechanical"
    CIVIL = "Civil"
    ICT = "ICT"

    @classmethod
    def for_discipline(cls, discipline: Discipline):
        return LabType(discipline.value)
