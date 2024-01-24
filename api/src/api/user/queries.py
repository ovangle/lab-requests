from typing import Optional
from sqlalchemy import Select, select, or_

from db.models.user import User


def query_users(
    search: Optional[str] = None,
    include_roles: Optional[set[str]] = None,
) -> Select[tuple[User]]:
    clauses: list = [User.disabled.is_(False)]

    if search:
        clauses.append(
            or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
        )

    if include_roles:
        clauses.append(User.roles.overlap(list(include_roles)))

    return select(User).where(*clauses)
