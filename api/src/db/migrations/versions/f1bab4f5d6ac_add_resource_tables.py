"""add_resource_tables

Revision ID: f1bab4f5d6ac
Revises: c9ac84bbdab5
Create Date: 2024-04-19 11:57:31.931392

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f1bab4f5d6ac"
down_revision: Union[str, None] = "c9ac84bbdab5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("lab_resource__input_material")
    op.create_table(
        "lab_resource__input_material",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["id"], ["lab_resource.id"], name="input_material_resource_fk"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.drop_table("lab_resource__output_material")
    op.create_table(
        "lab_resource__output_material",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["id"], ["lab_resource.id"], name="output_material_resource_fk"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.drop_table("lab_resource__software_lease")
    op.create_table(
        "lab_resource__software_lease",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("software_id", sa.UUID(), nullable=True),
        sa.Column("software_provision_id", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id"], ["lab_resource.id"], name="software_lease_resource_fk"
        ),
        sa.ForeignKeyConstraint(
            ["software_id"],
            ["lab_software.id"],
        ),
        sa.ForeignKeyConstraint(
            ["software_provision_id"],
            ["lab_software_provision.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    raise NotImplementedError("Cannot downgrade past this revision")
