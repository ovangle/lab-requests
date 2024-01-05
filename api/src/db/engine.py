import json
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import create_async_engine

from .settings import DbSettings

db_settings = DbSettings()

db_url = db_settings.db_url

db_engine = create_async_engine(
    db_url,
    json_serializer=lambda d: json.dumps(jsonable_encoder(d)),
)
