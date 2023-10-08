
from humps import camelize
from pydantic import ConfigDict


SCHEMA_CONFIG = ConfigDict(
    alias_generator=camelize,
    populate_by_name=True,
    from_attributes=True,
    arbitrary_types_allowed=True
)