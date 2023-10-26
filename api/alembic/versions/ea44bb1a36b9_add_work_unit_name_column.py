"""add-work-unit-name-column

Revision ID: ea44bb1a36b9
Revises: 
Create Date: 2023-10-26 20:34:23.285287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ea44bb1a36b9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('work_units', sa.Column('name', sa.VARCHAR(length=256), nullable=False))
    op.create_unique_constraint('unique-plan-index', 'work_units', ['plan_id', 'index'])
    op.create_unique_constraint('unique-plan-name', 'work_units', ['plan_id', 'name'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('unique-plan-name', 'work_units', type_='unique')
    op.drop_constraint('unique-plan-index', 'work_units', type_='unique')
    op.drop_column('work_units', 'name')
    # ### end Alembic commands ###
