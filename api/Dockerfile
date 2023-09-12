FROM python:3.11
ARG API_DEBUG=no

WORKDIR /srv/api

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

ENV API_DEBUG=${API_DEBUG} \
    PYTHONPATH="/srv/api/src" \
    DB_HOST="postgres" 


EXPOSE 8000
CMD ["python", "-X", "frozen_modules=off", "-m", "main"]
