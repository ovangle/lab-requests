import os
from typing import Type, cast
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID

from fastapi.responses import JSONResponse

from db.models.base.errors import DoesNotExist

API_DEBUG = os.environ.get("API_DEBUG", "no") == "yes"

app = FastAPI()


@app.middleware("default_exception_middleware")
async def default_exception_middleware(request: Request, call_next):
    # Starlette (and thus fastapi) will not attach cors headers to 500 exceptions
    #
    # see: https://github.com/tiangolo/fastapi/issues/775
    #
    # Workaround this by adding a global exception handler and returning the response
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

    from api.routes.user import users
    from api.routes.uni import uni
    from api.routes.lab import labs
    from api.routes.equipment import equipments
    from api.routes.research import research

    api_router = APIRouter(prefix="/api", tags=["api"])
    api_router.include_router(oauth)
    api_router.include_router(users)
    api_router.include_router(uni)
    api_router.include_router(equipments)
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


if __name__ == "__main__":
    import uvicorn
    import debugpy  # type: ignore

    if API_DEBUG:
        print("running in debug mode. waiting for client...")
        debugpy.listen(("0.0.0.0", 8765))
        # debugpy.wait_for_client()

    uvicorn.run(app="main:app", host="0.0.0.0", port=8000, reload=True)
