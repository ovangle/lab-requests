FROM python:3.12

RUN groupadd -g 1000 api && \
    useradd -u 1000 -g api -s /bin/bash -m api
USER api
WORKDIR /srv/api

ENV PATH="$PATH:/home/api/.local/bin"
COPY requirements.txt requirements.txt
RUN --mount=type=cache,target=/home/api/.cache/pip,uid=1000 \
    pip install -r requirements.txt

COPY . .
ENV PYTHONPATH="/srv/api/src"

EXPOSE 8000
CMD ["python", "-X", "frozen_modules=off", "-m", "main"]
