FROM ghcr.io/astral-sh/uv:0.13.0 AS uv

FROM python:3.12-slim AS production
COPY --from=uv /uv /bin/uv
WORKDIR /app

ENV UV_PYTHON_DOWNLOADS=never \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev

RUN useradd --system --no-create-home app
COPY alembic.ini ./
COPY migrations ./migrations
COPY app ./app

USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM production AS testing
USER root
RUN uv sync --locked
COPY tests ./tests
USER app
CMD ["sh", "-ec", "alembic upgrade head && pytest -p no:cacheprovider"]

FROM production AS final
