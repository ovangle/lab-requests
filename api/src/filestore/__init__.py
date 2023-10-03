from pydantic import HttpUrl
from .store import FileStore, StoredFile
from .settings import FilestoreSettings

filestore_settings = FilestoreSettings()

def filesrv_url(stored_file: StoredFile) -> HttpUrl:
    filesrv_url = filestore_settings.filesrv_url
    return HttpUrl(str(filesrv_url) + str(stored_file.path))