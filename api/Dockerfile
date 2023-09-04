FROM python:3.11

WORKDIR /srv/api

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

ENV PYTHONPATH="/srv/api/src" \
    DB_HOST="postgres" 

EXPOSE "80"
CMD ["uvicorn", "api.main:app", "--host=0.0.0.0", "--port=8000"]
