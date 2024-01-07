from db import LocalSession
from db.models.uni import Campus, CampusDoesNotExist


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
