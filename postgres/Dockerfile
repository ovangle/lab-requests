FROM postgres:15.4

ENV PG_INIT_DIR="/docker-entrypoint-initdb.d"

COPY initdb/ $PG_INIT_DIR/
RUN chmod a+x $PG_INIT_DIR/*;

