from fastapi import FastAPI
from uuid import UUID


app = FastAPI()

@app.get('/')
async def root():
    return {"Message": "Hello World"}

from .plan.views import plans
app.add_route('/plan', plans)

from .uni.views import campuses
app.add_route('/uni/campuses', campuses)

@app.get('/plans/{plan_id}')
async def fetch_plan(plan_id: UUID):
    return {}

