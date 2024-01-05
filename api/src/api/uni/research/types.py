from __future__ import annotations
from asyncio import Protocol

import re
from pydantic import ConstrainedString, StringConstraints
from typing import Annotated, ClassVar, Iterable, Type

FieldOfResearchDivision = Annotated[str, StringConstraints(pattern=r"\d{2}")]


def field_of_research_division(
    value: FieldOfResearchDivision | FieldOfResearchGroup | FieldOfResearchCode,
):
    return value[:2]


FieldOfResearchGroup = Annotated[str, StringConstraints(pattern=r"\d{4}")]


def field_of_research_group(value: FieldOfResearchGroup | FieldOfResearchCode):
    return value[:4]


FieldOfResearchCode = Annotated[str, StringConstraints(pattern=r"\d{6}")]


def field_of_research_code(value: FieldOfResearchCode):
    return value[:6]


class FieldOfResearch(Protocol):
    code: FieldOfResearchCode

    @property
    def division(self):
        return field_of_research_division(self.code)

    @property
    def group(self):
        return field_of_research_group(self.code)


def division_items(
    fields: Iterable[FieldOfResearch], division: FieldOfResearchDivision
):
    yield from filter(lambda f: f.division == division, fields)


def group_items(fields: Iterable[FieldOfResearch], group: FieldOfResearchGroup):
    yield from filter(lambda f: f.group == group, fields)
