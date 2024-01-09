from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from db import get_db

from .schemas import Token
from .context import login_native_user

oauth = APIRouter(prefix="/oauth", tags=["oauth"])


@oauth.post("/token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db=Depends(get_db)
) -> Token:
    match form_data.grant_type:
        case "password":
            return await login_native_user(db, form_data.username, form_data.password)

        case "authorization_code":
            raise NotImplementedError("external provider login")

        case _:
            raise HTTPException(501, f"Unexpected grant type {form_data.grant_type}")
