"""add user table

Revision ID: 6a0b3dd483ac
Revises: 3729b62f6c1f
Create Date: 2023-11-13 15:59:24.963599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6a0b3dd483ac'
down_revision: Union[str, None] = '3729b62f6c1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('native_users',
        sa.Column('email', sa.VARCHAR(length=256), nullable=False),
        sa.Column('password_hash', sa.VARCHAR(length=256), nullable=False),
        sa.Column('name', sa.VARCHAR(length=256), nullable=False),
        sa.Column('roles', sa.ARRAY(sa.VARCHAR(length=64)), server_default='{}', nullable=False),
        sa.Column('type', postgresql.ENUM('NATIVE', name='usertype'), nullable=False),
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('disabled', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text("TIMEZONE('utc', CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_native_users_email'), 'native_users', ['email'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_native_users_email'), table_name='native_users')
    op.drop_table('native_users')
    # ### end Alembic commands ###
