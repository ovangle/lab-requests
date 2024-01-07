from pydantic import HttpUrl

from libcloud.storage.providers import get_driver
from .settings import FilestoreSettings

from sqlalchemy_file.storage import StorageManager

settings = FilestoreSettings()

_storage_manager = StorageManager()


def add_storage(name: str):
    _storage = get_driver(settings.filestore_provider)(
        key=settings.filestore_key,
        secret=settings.filestore_secret,
        api_version=settings.filestore_api_version,
        region=settings.filestore_region,
    )

    container = _storage.get_container(name)
    _storage_manager.add_storage(name, container)
