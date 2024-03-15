"""empty message

Revision ID: 42e5608e160c
Revises: 3e5ae9afc9ef
Create Date: 2024-03-15 00:14:19.375994

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import postgresql

from db.models.research.plan import ResearchPlan

# revision identifiers, used by Alembic.
revision: str = "42e5608e160c"
down_revision: Union[str, None] = "3e5ae9afc9ef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "research_plan",
        sa.Column(
            "discipline",
            postgresql.ENUM(
                "ICT", "ELECTRICAL", "CIVIL", "MECHANICAL", name="discipline"
            ),
            nullable=True,
        ),
    )

    session = orm.Session(bind=op.get_bind())

    for plan in session.scalars(sa.select(ResearchPlan)):
        plan.discipline = plan.lab.discipline
        print(f"updating {plan.id} set discipline to {plan.lab.id}")
        session.add(plan)
    session.commit()

    op.alter_column("research_plan", "discipline", nullable=False)

    old_domain_type = postgresql.ENUM("NATIVE", "EXTERNAL", name="userdomain")

    domain_type = postgresql.ENUM(
        "NATIVE", "EXTERNAL", name="user_domain", create_type=False
    )
    domain_type.create(bind=op.get_bind())

    op.execute(
        'alter table "user" '
        'alter column "domain" '
        "set data type user_domain using (domain::varchar::user_domain)"
    )
    old_domain_type.drop(bind=op.get_bind())


def downgrade() -> None:
    op.alter_column(
        "user",
        "domain",
        existing_type=postgresql.ENUM("NATIVE", "EXTERNAL", name="user_domain"),
        type_=postgresql.ENUM("NATIVE", "EXTERNAL", name="userdomain"),
        existing_nullable=False,
    )
    op.drop_column("research_plan", "discipline")
