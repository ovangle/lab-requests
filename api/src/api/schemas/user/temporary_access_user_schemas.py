from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from typing import override
from uuid import UUID, uuid4

from fastapi import HTTPException
from api.settings import api_settings
from db import LocalSession
from db.models.uni.discipline import Discipline

from db.models.user import TemporaryAccessToken, User, UserDoesNotExist, UserDomain

from api.schemas.uni import CampusLookup, lookup_campus
from ..base_schemas import ModelCreateRequest, ModelUpdateRequest, BaseModel
from .user_schemas import UserDetail


class TemporaryUserDetail(UserDetail):
    """
    Represents a view of a user with additional information about the latest temporary
    access token which exists for the user.
    """

    token_expires_at: datetime
    token_expired: bool

    token_consumed_at: datetime | None
    token_consumed: bool

    @classmethod
    async def _from_user(cls, model: User, **kwargs):
        token = kwargs.pop("token")
        if token is None:
            raise ValueError("Expected a keyword argument 'token'")
        latest_access_token = await model.get_temporary_access_token(token)
        if latest_access_token is None:
            raise HTTPException(
                HTTPStatus.CONFLICT, detail="User has no temporary access tokens"
            )

        return await super()._from_user(
            model,
            token_expires_at=latest_access_token.expires_at,
            token_expired=latest_access_token.is_expired,
            token_consumed_at=latest_access_token.consumed_at,
            token_consumed=latest_access_token.is_consumed,
            **kwargs
        )


class CreateTemporaryUserRequest(ModelCreateRequest[User]):
    email: str
    name: str
    base_campus: CampusLookup | UUID
    discipline: Discipline

    @override
    async def do_create(self, db: LocalSession, **kwargs):
        base_campus = await lookup_campus(db, self.base_campus)

        try:
            user = await User.get_for_email(db, self.email)
        except UserDoesNotExist:
            user = User(
                id=uuid4(),
                domain=UserDomain.NATIVE,
                disabled=True,
                email=self.email,
                name=self.name,
                title="student",
                campus=base_campus,
                disciplines=set([self.discipline]),
                roles=["student"],
            )
            db.add(user)

        expires_at = datetime.now(tz=timezone.utc) + timedelta(
            minutes=api_settings.user_temporary_access_token_expire_minutes
        )

        access_token = TemporaryAccessToken(user=user, expires_at=expires_at)
        db.add(access_token)
        await db.commit()
        return user


class CreateTemporaryUserResponse(BaseModel):
    token: str
    token_expires_at: datetime
    user: UserDetail

    @classmethod
    async def from_model(cls, user: User):
        token = await user.get_latest_temporary_access_token()
        if token is None:
            raise ValueError("User has no latest access token")
        return cls(
            token=token.token,
            token_expires_at=token.expires_at,
            user=await UserDetail.from_model(user),
        )


class FinalizeTemporaryUserRequest(ModelUpdateRequest[User]):
    id: UUID
    token: str
    password: str

    @override
    async def do_update(self, model: User, **kwargs) -> User:
        # This is handled in view.
        raise NotImplemented
