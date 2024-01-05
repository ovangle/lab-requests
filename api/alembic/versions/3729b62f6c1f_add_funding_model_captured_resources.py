"""add funding model captured resources

Revision ID: 3729b62f6c1f
Revises: ea44bb1a36b9
Create Date: 2023-10-27 14:39:55.687634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "3729b62f6c1f"
down_revision: Union[str, None] = "ea44bb1a36b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "uni_research_funding_model",
        sa.Column(
            "captured_resources",
            postgresql.ARRAY(sa.VARCHAR(length=256)),
            server_default="{}",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("uni_research_funding_model", "captured_resources")
