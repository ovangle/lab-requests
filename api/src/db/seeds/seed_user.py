from pathlib import Path
import re
from uuid import uuid4

import pandas

from db import LocalSession
from db.models.uni import Campus, Discipline
from db.models.user import User, UserDomain, UserDoesNotExist, NativeUserCredentials

from .seed_uni import seed_campuses


def load_user_seeds() -> pandas.DataFrame:
    seeds_dir = Path(__file__).parent
    user_seeds_xlsx = seeds_dir / "user_seeds.xlsx"

    return pandas.read_excel(user_seeds_xlsx)


def campus_code_from_user_seed_row(row: pandas.Series) -> str:
    location_str = str(row.get("Location"))
    m = re.search(r"\(([A-Z]+)\)", location_str)

    if not m:
        raise ValueError(f"Unexpected location {location_str}")

    campus_code_mappings = {
        "MELB": "MEL",
        "CAIR": "CNS",
        "GLAD": "GLD",
        "ROCK": "ROK",
        "MACK": "MKY",
    }
    return campus_code_mappings[m.group(1)]


def disciplines_from_user_seed_row(row: pandas.Series) -> set[Discipline]:
    dis = str(row.get("Dis"))
    discipline_str = str(dis).strip().lower()
    match discipline_str:
        case "ict":
            return set([Discipline.ICT])
        case "civil":
            return set([Discipline.CIVIL])
        case "elec":
            return set([Discipline.ELECTRICAL])
        case "mech":
            return set([Discipline.MECHANICAL])
        case "multi":
            return set(Discipline)
        case "workshop":
            return set()
        case _:
            raise ValueError(f"Unexpected discipline from seed '{discipline_str}'")


async def seed_users(db: LocalSession):
    # Ensure all campuses are available
    await seed_campuses(db)

    async def create_or_update_lab_tech(
        email: str, name: str, campus: Campus, disciplines: set[Discipline]
    ):
        try:
            lab_tech = await User.get_for_email(db, email)
        except UserDoesNotExist:
            lab_tech = User(
                id=uuid4(),
                domain=UserDomain.NATIVE,
                email=email,
                name=name,
                roles=set(),
            )
            db.add(lab_tech)

        if lab_tech.campus_id != campus.id:
            lab_tech.campus_id = campus.id
            db.add(lab_tech)

        if lab_tech.name != name:
            lab_tech.name = name
            db.add(lab_tech)

        roles = {
            "lab-tech",
            *[f"lab-tech-{d.value}" for d in disciplines],
        }
        if lab_tech.roles - roles:
            lab_tech.roles = lab_tech.roles | roles
            db.add(lab_tech)

        return lab_tech

    user_seeds = load_user_seeds()

    for _, row in user_seeds.iterrows():
        email = str(row.get("Email")).strip().lower()

        campus_code = campus_code_from_user_seed_row(row)
        campus = await Campus.get_for_campus_code(db, campus_code)

        disciplines = disciplines_from_user_seed_row(row)

        await create_or_update_lab_tech(
            email, name=str(row.get("Name")), campus=campus, disciplines=disciplines
        )
