from __future__ import annotations

from abc import abstractmethod
import dataclasses
import inspect
from typing import TYPE_CHECKING, Any, Awaitable, Callable, ClassVar, Generic, Self, TypeVar
from uuid import UUID
from sqlalchemy.orm import Mapped

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.lab.lab import Lab
from db.models.uni.funding import Budget
from db.models.user import User

if TYPE_CHECKING:
    from .lab_provision import LabProvision

class Provisionable(Base):
    __abstract__ = True

    @classmethod
    def __init_subclass__(cls, **kwargs):
        if not cls.__abstract__:

            if cls.__tablename__ in __provisionable_types:
                raise TypeError(f"Model {cls.__name__} already registered as a provisionable type")

            actions={}
            for method in inspect.getmembers(cls):
                action = getattr(method, '__provisionable_action__', None)
                if action is not None:
                    actions[action.name] = action

            provisionable_type = ProvisionableType(
                cls.__tablename__,
                cls,
                actions=actions
            )
            __provisionable_types[cls.__tablename__] = provisionable_type
            cls.__provisionable_type__ = provisionable_type
        super().__init_subclass__(**kwargs)

    provisions: Mapped[list[LabProvision]]

    async def create_provision(
        self,
        action: str,
        *,
        params: Any,
        lab: Lab,
        budget: Budget,
        estimated_cost: float = 0.0,
        purchase_url: str | None,
        purchase_instructions: str,
        note: str,
        requested_by: User
    ) -> LabProvision[Self, Any]:
        from .lab_provision import LabProvision
        db = local_object_session(self)
        provision = LabProvision[Self, Any](
            self,
            action=action,
            action_params=params,
            lab=lab,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            note=note,
            requested_by=requested_by
        )
        db.add(provision)
        await db.commit()
        return provision

    @abstractmethod
    def apply_provision(
        self,
        provision: LabProvision[Self, Any],
        *,
        by: User,
        note: str,
        **kwargs,
    ) -> Awaitable[Self]: ...


TProvisionable = TypeVar('TProvisionable', bound=Provisionable)

__provision_type_actions: dict[str, ProvisionableTypeAction] = {}
__provisionable_types: dict[str, ProvisionableType] = {}

@dataclasses.dataclass()
class ProvisionableType(Generic[TProvisionable]):
    name: str
    py_type: type[TProvisionable]
    actions: dict[str, ProvisionableTypeAction[TProvisionable, Any]] = dataclasses.field(default_factory=dict)


def get_provisionable_type(py_type_or_name: TProvisionable | type[TProvisionable] | str) -> ProvisionableType[Any]:
    if isinstance(py_type_or_name, str):
        name = py_type_or_name
        try:
            return __provisionable_types[name]
        except KeyError:
            raise TypeError(f"No registered provisionable type {name}")
    else:
        if isinstance(py_type_or_name, type):
            py_type = py_type_or_name
        else:
            py_type = type(py_type_or_name)

        if not hasattr(py_type, '__provisionable_type__'):
            raise TypeError(f"{py_type.__name__} is not a provisionable type")
        return getattr(py_type, '__provisionable_type__')

TParams = TypeVar('TParams')

@dataclasses.dataclass(frozen=True)
class ProvisionableTypeAction(Generic[TProvisionable, TParams]):
    name: str
    to_json: Callable[[TParams], dict]
    from_json: Callable[[dict], TParams]

def provisionable_action(name: str, to_json: Callable[[TParams], dict], from_json: Callable[[dict], TParams]):
    """
    Decorates a method on a Provisionable instance as creating a provision
    """
    if name in __provision_type_actions:
        raise TypeError(f"Provision action names must be globally unique")
    action = ProvisionableTypeAction(name, to_json, from_json)
    __provision_type_actions[name] = action

    def decorator(method):
        object.__setattr__(method, '__provisionable_action__', action)
        return method

    return decorator
