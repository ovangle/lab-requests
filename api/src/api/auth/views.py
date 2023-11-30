from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from db import get_db
from api.user.models import NativeUser
from api.user.errors import UserDoesNotExist
from api.user.model_fns import get_user_for_email, login_native_user

from .errors import InvalidCredentials

oauth = APIRouter(
    prefix='/oauth',
    tags=['oauth']
)

@oauth.post('/token')
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db = Depends(get_db)
):
    match form_data.grant_type:
        case 'password':
            return await login_native_user(db, form_data.username, form_data.password)
