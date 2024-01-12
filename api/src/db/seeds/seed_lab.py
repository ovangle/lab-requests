from uuid import uuid4

import pandas
from sqlalchemy import select

from db import LocalSession
from db.models.uni import Discipline, Campus
from db.models.lab import Lab, LabDoesNotExist
from db.models.user import User

from .seed_user import (
    load_user_seeds,
    campus_code_from_user_seed_row,
    disciplines_from_user_seed_row,
)


async def seed_labs(db: LocalSession):
    user_seeds = load_user_seeds()

    async def create_or_update_lab(
        campus: Campus, discipline: Discipline, supervisors: list[User]
    ):
        try:
            lab = await Lab.get_for_campus_and_discipline(db, campus, discipline)
            lab_id = lab.id
        except LabDoesNotExist:
            lab_id = uuid4()
            lab = Lab(id=lab_id, campus_id=campus.id, discipline=discipline)
            db.add(lab)

        existing_supervisors = await lab.awaitable_attrs.supervisors
        existing_supervisor_emails = set(s.email for s in existing_supervisors)

        for s in supervisors:
            if s.email not in existing_supervisor_emails:
                existing_supervisors.append(s)
                db.add(lab)

    async def create_all_labs_for_campus(campus: Campus):
        def is_campus_user(row: pandas.Series):
            return campus.code == campus_code_from_user_seed_row(row)

        campus_user_seeds = [
            row for (_, row) in user_seeds.iterrows() if is_campus_user(row)
        ]

        for discipline in Discipline:
            campus_discipline_user_seeds = [
                row
                for row in campus_user_seeds
                if discipline in disciplines_from_user_seed_row(row)
            ]
            if not campus_discipline_user_seeds:
                # A lab is only a lab if there is at least one supervisor
                print(f"No supervisors for {campus.code} - {discipline}")
                continue

            user_emails = [
                str(row.get("Email")) for row in campus_discipline_user_seeds
            ]
            lab_supervisors = list(
                await db.scalars(select(User).where(User.email.in_(user_emails)))
            )
            await create_or_update_lab(campus, discipline, lab_supervisors)

    for campus in await db.scalars(select(Campus)):
        await create_all_labs_for_campus(campus)
    await db.commit()
