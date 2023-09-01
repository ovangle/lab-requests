from types import FunctionType
from typing import List, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

def _resource_column(name: str, from_jsonb: Optional[FunctionType] = None):
    return Column(name, ARRAY(JSONB), server_default="{}")

def resource_container_columns() -> List[Column]:
    return [
        _resource_column('equipments'),
        _resource_column('input_materials'),
        _resource_column('output_materials'),
        _resource_column('services'),
        _resource_column('softwares')
    ]