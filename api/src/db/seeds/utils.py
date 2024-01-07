def log_seed_fn(name, seed_fn):
    async def do_seed(db, **kwargs):
        print(f"seeding {name}", end="\t")
        await seed_fn(db, **kwargs)
        print("done")

    return do_seed
