from sqlalchemy import select
from db import LocalSession
from db.models.research import ResearchFunding


async def seed_research_fundings(db: LocalSession):
    builtin_funding_models = [
        ResearchFunding(name="Grant"),
        ResearchFunding(name="General Research"),
        ResearchFunding(name="Student project"),
    ]
    builtin_names = [builtin.name for builtin in builtin_funding_models]

    existing_names = await db.scalars(
        select(ResearchFunding.name).where(ResearchFunding.name.in_(builtin_names))
    )

    db.add_all(
        builtin
        for builtin in builtin_funding_models
        if builtin.name not in existing_names
    )
    await db.commit()
