from sqlalchemy import select
from db import LocalSession
from db.models.lab.lab import Lab


async def seed_research_fundings(db: LocalSession):
    builtin_funding_models = [
        ResearchFunding(name="lab", description="Dedicated lab funding"),
        ResearchFunding(name="grant"),
        ResearchFunding(name="general research"),
        ResearchFunding(name="student project"),
    ]
    builtin_names = [builtin.name for builtin in builtin_funding_models]

    existing_names = set(await db.scalars(
        select(ResearchFunding.name).where(ResearchFunding.name.in_(builtin_names))
    ))
    print('existing names', existing_names)

    db.add_all(
        builtin
        for builtin in builtin_funding_models
        if builtin.name not in existing_names
    )
    await db.commit()


async def seed_research_budgets(db: LocalSession):
    lab_funding = await ResearchFunding.get_for_name(db, "lab")

    for lab in await db.scalars(select(Lab)):
        existing_budget = await db.scalar(
            select(ResearchBudget).where(
                ResearchBudget.funding_id == lab_funding.id,
                ResearchBudget.lab_id == lab.id
            )
        )

        if existing_budget is None:
            print(f'adding budget for lab {lab.id}')
            budget = ResearchBudget(
                lab=lab,
                funding=lab_funding
            )
            db.add(budget)

    await db.commit()
