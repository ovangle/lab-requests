__all__ = (
    "Campus",
    "query_campuses",
    "CampusDoesNotExist",
    "Discipline",
)

from .campus import Campus, CampusDoesNotExist, query_campuses
from .discipline import Discipline
