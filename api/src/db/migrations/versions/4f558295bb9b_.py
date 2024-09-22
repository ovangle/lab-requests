"""empty message

Revision ID: 4f558295bb9b
Revises: c798de283765
Create Date: 2024-09-21 14:51:56.419392

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f558295bb9b'
down_revision: Union[str, None] = 'c798de283765'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('research_budget', 'lab_id',
               existing_type=sa.UUID(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('research_budget', 'lab_id',
               existing_type=sa.UUID(),
               nullable=True)
    # ### end Alembic commands ###
