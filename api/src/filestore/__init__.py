from pydantic import HttpUrl
from .store import StoredFileMeta
from .settings import FilestoreSettings, filestore_settings


def filesrv_url(stored_file: StoredFileMeta) -> HttpUrl:
    filesrv_url = filestore_settings.filesrv_url
    return HttpUrl(str(filesrv_url) + str(stored_file["path"]))
