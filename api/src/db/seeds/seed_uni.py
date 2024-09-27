from sqlalchemy import select
from db import LocalSession
from db.models.lab.lab import Lab
from db.models.uni import Campus, CampusDoesNotExist
from db.models.uni.funding import Funding, Budget


async def seed_campuses(db: LocalSession):
    all_known_campuses = [
        Campus(code="BNG", name="Bundaberg"),
        Campus(code="CNS", name="Cairns"),
        Campus(code="CNS", name="Cairns"),
        Campus(code="GLD", name="Gladstone"),
        Campus(code="MEL", name="Melbourne"),
        Campus(code="MKY", name="Mackay"),
        Campus(code="PTH", name="Perth"),
        Campus(code="ROK", name="Rockhampton"),
        Campus(code="SYD", name="Sydney"),
    ]

    for c in all_known_campuses:
        try:
            await Campus.get_for_campus_code(db, c.code)
        except CampusDoesNotExist:
            db.add(c)

    await db.commit()


async def seed_fundings(db: LocalSession):
    builtin_funding_models = [
        Funding(name="lab", description="Dedicated lab funding"),
        Funding(name="grant"),
        Funding(name="general research"),
        Funding(name="student project"),
    ]
    builtin_names = [builtin.name for builtin in builtin_funding_models]

    existing_names = set(await db.scalars(
        select(Funding.name).where(Funding.name.in_(builtin_names))
    ))
    print('existing names', existing_names)

    db.add_all(
        builtin
        for builtin in builtin_funding_models
        if builtin.name not in existing_names
    )
    await db.commit()


async def seed_budgets(db: LocalSession):
    lab_funding = await Funding.get_for_name(db, "lab")

    for lab in await db.scalars(select(Lab)):
        existing_budget = await db.scalar(
            select(Budget).where(
                Budget.funding_id == lab_funding.id,
                Budget.lab_id == lab.id
            )
        )

        if existing_budget is None:
            print(f'adding budget for lab {lab.id}')
            budget = Budget(
                lab=lab,
                funding=lab_funding
            )
            db.add(budget)

    await db.commit()
