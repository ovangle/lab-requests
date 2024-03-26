from typing import Awaitable, Callable, TypeVar
from fastapi import APIRouter
from uuid import UUID

from db import LocalSession
from db.models.lab.lab_resource_consumer import LabResourceConsumer

from .equipment_lease import register_equipment_lease_views

TConsumer = TypeVar("TConsumer", bound=LabResourceConsumer)


def register_resource_views(
    router: APIRouter,
    prefix: str,
    fetch_consumer: Callable[[LocalSession, UUID], Awaitable[TConsumer]],
):
    register_equipment_lease_views(router, prefix, fetch_consumer)
