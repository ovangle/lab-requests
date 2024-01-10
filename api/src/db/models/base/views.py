import sqlalchemy as sa
from sqlalchemy.ext import compiler
from sqlalchemy.schema import DDLElement


class CreateView(DDLElement):
    def __init__(self, name: str, selectable):
        self.name = name
        self.selectable = selectable


@compiler.compiles(CreateView, "postgresql")
def _create_view(element: CreateView, compiler, **kw):
    return "CREATE VIEW %s AS %s" % (
        element.name,
        compiler.sql_compiler.process(element.selectable, literal_binds=True),
    )


class DropView(DDLElement):
    def __init__(self, name: str):
        self.name = name


@compiler.compiles(DropView, "postgresql")
def _drop_view(element: DropView, compiler, **kw):
    return "DROP VIEW %s" % element.name


def view_exists(ddl, target, connection, *kw):
    return ddl.name in sa.inspect(connection).get_view_names()


def not_view_exists(ddl, target, connection, **kwargs):
    return ddl.name not in sa.inspect(connection).get_view_names()


def view(name, metadata, selectable):
    t = sa.table(name)

    t._columns._populate_separate_keys(
        col._make_proxy(t) for col in selectable.selected_columns
    )

    sa.event.listen(
        metadata,
        "after_create",
        CreateView(name, selectable).execute_if(callable_=not_view_exists),  # type: ignore
    )
    sa.event.listen(
        metadata, "before_drop", DropView(name).execute_if(callable_=view_exists)  # type: ignore
    )

    return t
