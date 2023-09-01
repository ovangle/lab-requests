FROM python:3.11

WORKDIR /srv/api

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

ENV DB_HOST="postgres" 
