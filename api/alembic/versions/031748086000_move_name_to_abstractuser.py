"""move name to AbstractUser

Revision ID: 031748086000
Revises: 2995e8d08b1f
Create Date: 2023-11-16 10:56:23.879258

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "031748086000"
down_revision: Union[str, None] = "2995e8d08b1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "experimental_plans",
        "researcher_email",
        existing_type=postgresql.CITEXT(),
        type_=postgresql.DOMAIN("email", postgresql.CITEXT()),
        existing_nullable=False,
    )
    op.alter_column(
        "experimental_plans",
        "supervisor_email",
        existing_type=postgresql.CITEXT(),
        type_=postgresql.DOMAIN("email", postgresql.CITEXT()),
        existing_nullable=True,
    )
    op.add_column(
        "external_users", sa.Column("name", sa.VARCHAR(length=256), nullable=False)
    )
    op.alter_column(
        "external_users",
        "email",
        existing_type=sa.VARCHAR(length=256),
        type_=postgresql.DOMAIN("email", postgresql.CITEXT()),
        existing_nullable=False,
    )
    op.drop_index("ix_external_users_email", table_name="external_users")
    op.alter_column(
        "native_users",
        "email",
        existing_type=sa.VARCHAR(length=256),
        type_=postgresql.DOMAIN("email", postgresql.CITEXT()),
        existing_nullable=False,
    )
    op.drop_index("ix_native_users_email", table_name="native_users")
    op.alter_column(
        "work_units",
        "technician_email",
        existing_type=postgresql.CITEXT(),
        type_=postgresql.DOMAIN("email", postgresql.CITEXT()),
        existing_nullable=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "work_units",
        "technician_email",
        existing_type=postgresql.DOMAIN("email", postgresql.CITEXT()),
        type_=postgresql.CITEXT(),
        existing_nullable=False,
    )
    op.create_index("ix_native_users_email", "native_users", ["email"], unique=False)
    op.alter_column(
        "native_users",
        "email",
        existing_type=postgresql.DOMAIN("email", postgresql.CITEXT()),
        type_=sa.VARCHAR(length=256),
        existing_nullable=False,
    )
    op.create_index(
        "ix_external_users_email", "external_users", ["email"], unique=False
    )
    op.alter_column(
        "external_users",
        "email",
        existing_type=postgresql.DOMAIN("email", postgresql.CITEXT()),
        type_=sa.VARCHAR(length=256),
        existing_nullable=False,
    )
    op.drop_column("external_users", "name")
    op.alter_column(
        "experimental_plans",
        "supervisor_email",
        existing_type=postgresql.DOMAIN("email", postgresql.CITEXT()),
        type_=postgresql.CITEXT(),
        existing_nullable=True,
    )
    op.alter_column(
        "experimental_plans",
        "researcher_email",
        existing_type=postgresql.DOMAIN("email", postgresql.CITEXT()),
        type_=postgresql.CITEXT(),
        existing_nullable=False,
    )
    # ### end Alembic commands ###
