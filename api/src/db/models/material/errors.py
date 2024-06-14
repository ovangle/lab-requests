from uuid import UUID
from ..base.errors import DoesNotExist


class MaterialDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None = None, for_name: str | None = None):
        if for_name:
            msg = f"No Material exists with name {for_name}"
            return super().__init__("Material", msg=msg)
        return super().__init__("Material", for_id=for_id)
