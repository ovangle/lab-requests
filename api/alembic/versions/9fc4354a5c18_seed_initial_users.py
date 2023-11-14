"""seed initial users

Revision ID: 9fc4354a5c18
Revises: 6a0b3dd483ac
Create Date: 2023-11-13 16:00:03.133595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fc4354a5c18'
down_revision: Union[str, None] = '6a0b3dd483ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from api.user.models import seed_users
    op.run_async(seed_users)


def downgrade() -> None:
    pass
