from enum import Enum
from typing import Annotated

from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import mapped_column


class Discipline(Enum):
    ICT = "ict"
    ELECTRICAL = "electrical"
    CIVIL = "civil"
    MECHANICAL = "mechanical"


uni_discipline = Annotated[Discipline, mapped_column(postgresql.ENUM(Discipline))]
