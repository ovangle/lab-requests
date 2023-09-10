from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID


app = FastAPI()

CORS_ALLOW_ORIGINS = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:8000'
]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=CORS_ALLOW_ORIGINS, 
    allow_credentials=True, 
    allow_methods=['*'], 
    allow_headers=['*']
)

from .lab.equipment.views import lab_equipments
app.include_router(lab_equipments)

from .lab.plan.views import lab_plans
app.include_router(lab_plans)

from .uni.views import uni_campuses
app.include_router(uni_campuses)

