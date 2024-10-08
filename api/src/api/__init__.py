__all__ = ("api_settings", "app", "serve")

import debugpy

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import uvicorn

from db.models.base import DoesNotExist
from db import _import_models
from .settings import api_settings

# TODO: Move most of the src/main.py stuff in here.

_import_models()
app = FastAPI()

@app.middleware("default_exception_middleware")
async def default_exception_middleware(request: Request, call_next):
    # Starlette (and thus fastapi) will not attach cors headers to 500 exceptions
    #
    # see: https://github.com/tiangolo/fastapi/issues/775
    #

    # containing the python exception.
    try:
        return await call_next(request)
    except DoesNotExist as dne:
        raise HTTPException(404, detail=str(dne))

    except Exception as e:
        import traceback

        traceback.print_exception(e)

        response_content = {
            "error": 500,
            "message": "Internal server error",
            "exception": traceback.format_exception_only(type(e), e),
            "trace": traceback.format_tb(e.__traceback__),
        }

        # Global
        return JSONResponse(content=response_content, status_code=500)


CORS_ALLOW_ORIGINS = [
    "http://localhost:4200",
    "http://localhost:4201",
    "http://127.0.0.1:4201",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def api_router():
    from api.auth.views import oauth

    from api.routes.user_routes import users
    from api.routes.uni_routes import uni
    from api.routes.lab_routes import labs
    from api.routes.equipment_routes import equipments
    from api.routes.software_routes import softwares
    from api.routes.material_routes import materials
    from api.routes.research_routes import research

    api_router = APIRouter(prefix="/api", tags=["api"])
    api_router.include_router(oauth)
    api_router.include_router(users)
    api_router.include_router(uni)
    api_router.include_router(equipments)
    api_router.include_router(softwares)
    api_router.include_router(materials)
    api_router.include_router(labs)

    # from api.lab.equipment.views import lab_equipments, lab_equipment_tags
    # api_router.include_router(lab_equipments)
    # api_router.include_router(lab_equipment_tags)

    # from api.lab.plan.views import lab_plans
    # api_router.include_router(lab_plans)

    # from api.lab.work_unit.views import lab_work_units
    # api_router.include_router(lab_work_units)

    api_router.include_router(research)

    return api_router


app.include_router(api_router())


@app.get("/")
async def health_check():
    """
    Used only for internal health checks.
    Everything useful is under /api
    """
    return {"message": "no content"}


def serve():
    uvicorn.run(app="api:app", host="0.0.0.0", port=8000, reload=True)
