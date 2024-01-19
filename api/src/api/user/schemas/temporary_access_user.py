from datetime import datetime
from http import HTTPStatus
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel
from api.base.schemas import ModelCreateRequest, ModelUpdateRequest
from api.uni.schemas import CampusLookup
from db.models.uni.discipline import Discipline

from db.models.user import User
from .user import UserView


class TemporaryUserView(UserView):
    """
    Represents a view of a user with additional information about the latest temporary
    access token which exists for the user.
    """

    token_expires_at: datetime
    token_expired: bool

    token_consumed_at: datetime | None
    token_consumed: bool

    @classmethod
    async def from_model(cls, model: User, **kwargs):
        latest_access_token = await model.get_latest_temporary_access_token()
        if latest_access_token is None:
            raise HTTPException(
                HTTPStatus.CONFLICT, detail="User has no temporary access tokens"
            )

        return await super().from_model(
            model,
            token_expires_at=latest_access_token.expires_at,
            token_expired=latest_access_token.is_expired,
            token_consumed_at=latest_access_token.consumed_at,
            token_consumed=latest_access_token.is_consumed,
        )


class CreateTemporaryUserRequest(ModelCreateRequest[User]):
    email: str
    name: str
    base_campus: CampusLookup | UUID
    discipline: Discipline


class CreateTemporaryUserResponse(BaseModel):
    token: str
    user: UserView


class FinalizeTemporaryUserRequest(ModelUpdateRequest[User]):
    id: UUID
    token: str
    password: str
