FROM python:3.13.5-slim

WORKDIR /app

ENV UV_PROJECT_ENVIRONMENT=/usr/local

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

COPY pyproject.toml uv.lock* ./

RUN uv sync --locked --no-dev

COPY . .

RUN chmod +x start.sh

EXPOSE 8000

CMD ["bash", "./start.sh"] 