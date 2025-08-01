# Инструкции по настройке Huginn

## Быстрый запуск

### 1. Настройка переменных окружения

Скопируйте файлы с примерами переменных окружения:

```bash
# Backend
cp backend/env.example backend/.env

# Frontend  
cp frontend/env.example frontend/.env
```

**Важно**: Отредактируйте `JWT_SECRET` в `backend/.env` для production!

### 2. Запуск всех сервисов

```bash
docker-compose up -d
```

### 3. Ожидание запуска сервисов

Подождите несколько минут, пока все сервисы запустятся:
- PostgreSQL (порт 5432)
- RabbitMQ (порт 5672, управление 15672)
- Keycloak (порт 8080)
- Backend API (порт 8000)
- Frontend (порт 3000)
- Nginx (порт 80)

### 4. Настройка Keycloak

1. Откройте https://localhost:8443
2. Войдите как admin/admin
3. Создайте новый realm "huginn"
4. Создайте клиент "huginn-client":
   - Client ID: huginn-client
   - Client Protocol: openid-connect
   - Access Type: public
   - Valid Redirect URIs: http://localhost:3000/*, https://localhost/*
   - Web Origins: http://localhost:3000

### 5. Проверка работы

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Keycloak: http://localhost:8080
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## Разработка

### Backend разработка (с uv)

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend разработка

```bash
cd frontend
npm install
npm start
```

### Миграции базы данных

```bash
cd backend
uv run aerich init-db
uv run aerich migrate
uv run aerich upgrade
```

## Структура проекта

```
huginn/
├── backend/                 # FastAPI приложение
│   ├── app/
│   │   ├── api/v1/         # API эндпоинты
│   │   ├── core/           # Конфигурация
│   │   ├── models/         # Модели данных
│   │   └── services/       # Бизнес-логика
│   ├── pyproject.toml      # Зависимости (uv)
│   ├── env.example         # Пример переменных окружения
│   └── Dockerfile.dev
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/         # Страницы
│   │   ├── contexts/      # Контексты
│   │   └── services/      # API клиенты
│   ├── package.json
│   ├── env.example        # Пример переменных окружения
│   └── Dockerfile.dev
├── nginx/                  # Nginx конфигурация
├── docker-compose.yml
└── README.md
```

## Следующие шаги

1. Настройте Keycloak realm и клиент
2. Добавьте запрещенные слова через API
3. Создайте MCC коды для классификации
4. Добавьте контрагентов для проверки
5. Настройте планировщик проверок

## Устранение неполадок

### Проблемы с базой данных

```bash
# Пересоздать базу данных
docker-compose down -v
docker-compose up -d postgres
# Подождать запуска PostgreSQL
docker-compose up -d
```

### Проблемы с Keycloak

```bash
# Перезапустить Keycloak
docker-compose restart keycloak
```

### Проблемы с frontend

```bash
# Очистить кэш
cd frontend
rm -rf node_modules
npm install
```

### Проблемы с backend

```bash
# Переустановить зависимости
cd backend
uv sync --reinstall
```

## Логирование

Логи выводятся в stdout для корректной работы с Docker:

```bash
# Просмотр логов всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Логи в реальном времени
docker-compose logs -f backend
```

### Уровни логирования

Настройте уровень логирования через переменную `LOG_LEVEL` в `backend/.env`:

- `DEBUG` - подробная отладочная информация
- `INFO` - общая информация (по умолчанию)
- `WARNING` - только предупреждения и ошибки
- `ERROR` - только ошибки
- `CRITICAL` - только критические ошибки 