from fastapi import FastAPI
from uuid import UUID

app = FastAPI()

@app.get('/')
async def root():
    return {"Message": "Hello World"}

@app.get('/plans')
async def list_plans():
    return []

@app.get('/plans/{plan_id}')
async def fetch_plan(plan_id: UUID):
    return {}

