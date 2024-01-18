from typing import Optional
from sqlalchemy import Select, select, or_

from db.models.user import User


def query_users(search: Optional[str] = None) -> Select[tuple[User]]:
    clauses: list = []

    if search:
        clauses.append(
            or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
        )

    return select(User).where(*clauses)
