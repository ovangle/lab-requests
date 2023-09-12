import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID

from fastapi.responses import JSONResponse

API_DEBUG = os.environ.get('API_DEBUG', 'no') == 'yes'

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
    except Exception as e:
        import traceback

        traceback.print_exception(e)

        response_content = {
            "error": 500,
            "message": "Internal server error",
            "exception": traceback.format_exception_only(e),
            "trace": traceback.format_tb(e.__traceback__)
        }

        # Global
        return JSONResponse(content=response_content, status_code=500)

CORS_ALLOW_ORIGINS = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4201',
    'http://localhost:8000'
]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=CORS_ALLOW_ORIGINS, 
    allow_credentials=True, 
    allow_methods=['*'], 
    allow_headers=['*']
)

from api.lab.equipment.views import lab_equipments
app.include_router(lab_equipments)

from api.lab.plan.views import lab_plans
app.include_router(lab_plans)

from api.uni.views import uni_campuses
app.include_router(uni_campuses)

from api.uni.research.views import uni_research_funding
app.include_router(uni_research_funding)


if __name__ == '__main__':
    import uvicorn
    import debugpy

    if API_DEBUG:
        print('running in debug mode. waiting for client...')
        debugpy.listen(('0.0.0.0', 8765))
        # debugpy.wait_for_client()

    uvicorn.run('main:app', host="0.0.0.0", port=8000, reload=True)