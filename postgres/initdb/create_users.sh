#! /bin/bash

api_user=${API_USER:-api}
api_user_pwd=${API_USER_PWD:-secret}
api_db=${API_DB:-api}

psql -U postgres <<EOM
    CREATE USER ${api_user} WITH PASSWORD '${api_user_pwd}';
    CREATE DATABASE ${api_db} WITH OWNER ${api_user};
EOM
psql -U postgres -d api <<EOM
    CREATE EXTENSION citext;
EOM
if [[ $? != "0" ]]; then
    echo "failed to create user or db";
    exit 1;
fi