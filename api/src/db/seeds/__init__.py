from db import LocalSession, async_sessionmaker
from .utils import log_seed_fn

from .seed_uni import seed_campuses
from .seed_research import seed_research_fundings
from .seed_lab import seed_labs
from .seed_user import seed_users


async def seed_all(db: LocalSession):
    await log_seed_fn("campuses", seed_campuses)(db)
    await log_seed_fn("research_funding", seed_research_fundings)(db)
    await log_seed_fn("seed_users", seed_users)(db)
    await log_seed_fn("lab", seed_labs)(db)
    return
