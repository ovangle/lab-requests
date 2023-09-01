from enum import Enum


class ExperimentalPlanType(Enum):
    GRANT = 'grant'
    GENERAL_RESEARCH = 'general research'
    STUDENT_PROJECT = 'student project'

    OTHER = 'other'

class LabType(Enum):
    ELECTRICAL = 'Electrical'
    MECHANICAL = 'Mechanical'
    CIVIL = 'Civil'
    ICT = 'ict'
