# Huginn - Система проверки контрагентов банка

Система для автоматической проверки веб-сайтов контрагентов на наличие запрещенного контента с использованием асинхронного сканирования и очередей.

## 🚀 Возможности

- **Регистрация контрагентов** с указанием домена
- **Автоматическое сканирование** веб-сайтов на запрещенный контент
- **Принудительное пересканирование** - возможность пересканировать сайт в любое время, игнорируя TTL
- **Глобальные запрещенные слова** - управление на уровне системы
- **Регулярные выражения** - гибкий поиск с поддержкой regex
- **Очередь задач** - асинхронное сканирование через RabbitMQ
- **Детальная отчетность** - информация о каждой странице и найденных нарушениях
- **Планировщик сканирования** - настраиваемые интервалы проверки
- **Административная панель** - управление пользователями и настройками
- **REST API** - полный API для интеграции
- **Dashboard** - статистика системы в реальном времени
- **Детализация нарушений** - просмотр контекста и позиции найденных слов

## 🏗️ Архитектура

### Технологический стек

**Backend:**
- Python 3.13
- FastAPI (асинхронный веб-фреймворк)
- Tortoise ORM (асинхронный ORM)
- PostgreSQL (база данных)
- RabbitMQ (очереди сообщений)
- Aerich (миграции БД)
- JWT (аутентификация)
- aiohttp (HTTP клиент для сканирования)

**Frontend:**
- React 18
- Material-UI (компоненты)
- React Router (навигация)
- Axios (HTTP клиент)

**Инфраструктура:**
- Docker Compose
- Nginx (обратный прокси)
- SSL/HTTPS (самоподписанные сертификаты)

### Компоненты системы

1. **API Gateway** (Nginx) - маршрутизация и SSL
2. **Backend** (FastAPI) - REST API и бизнес-логика
3. **Frontend** (React) - веб-интерфейс
4. **Database** (PostgreSQL) - хранение данных
5. **Message Queue** (RabbitMQ) - асинхронные задачи
6. **Scanner Worker** - обработка задач сканирования

## 📋 Требования

- Docker и Docker Compose
- 4GB RAM (минимум)
- 10GB свободного места
- Git

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd huginn
```

### 2. Запуск системы

```bash
docker-compose up -d
```

Система автоматически:
- Применит миграции базы данных
- Создаст администратора (admin/admin)
- Запустит все сервисы

### 3. Доступ к системе

- **Frontend:** https://localhost
- **API:** https://localhost/api/v1/
- **Администратор:** admin/admin

## ⚙️ Подробная установка (SETUP)

### Подготовка системы

#### 1. Установка Docker

**Ubuntu/Debian:**
```bash
# Обновление пакетов
sudo apt update

# Установка зависимостей
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# Установка через Homebrew
brew install docker docker-compose

# Или скачать Docker Desktop с официального сайта
# https://www.docker.com/products/docker-desktop
```

**Windows:**
- Скачайте Docker Desktop с официального сайта
- Установите и запустите Docker Desktop

#### 2. Проверка установки

```bash
# Проверка Docker
docker --version
docker-compose --version

# Проверка работы Docker
docker run hello-world
```

### Настройка проекта

#### 1. Клонирование репозитория

```bash
# Клонирование
git clone https://github.com/your-username/huginn.git
cd huginn

# Проверка структуры проекта
ls -la
```

#### 2. Настройка переменных окружения

```bash
# Создание файла .env (если не существует)
cp .env.example .env

# Редактирование переменных
nano .env
```

#### 3. Настройка SSL сертификатов (опционально)

Для продакшена рекомендуется использовать настоящие SSL сертификаты:

```bash
# Создание директории для сертификатов
mkdir -p nginx/ssl

# Генерация самоподписанного сертификата (для разработки)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Huginn/CN=localhost"
```

### Запуск системы

#### 1. Первый запуск

```bash
# Сборка и запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

#### 2. Проверка работоспособности

```bash
# Проверка доступности frontend
curl -k https://localhost

# Проверка доступности API
curl -k https://localhost/api/v1/health

# Проверка базы данных
docker-compose exec database psql -U huginn_user -d huginn_db -c "SELECT version();"

# Проверка RabbitMQ
docker-compose exec rabbitmq rabbitmqctl status
```

#### 3. Создание администратора

Если администратор не создался автоматически:

```bash
# Ручное создание администратора
docker-compose exec backend python create_admin.py
```

### Настройка для продакшена

#### 1. Безопасность

```bash
# Изменение паролей по умолчанию
docker-compose exec backend python -c "
from app.models.user import User
from tortoise import Tortoise
from app.core.database import TORTOISE_ORM

async def change_admin_password():
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    
    admin = await User.get(username='admin')
    admin.set_password('your-secure-password')
    await admin.save()
    
    print('Admin password changed successfully')

import asyncio
asyncio.run(change_admin_password())
"
```

#### 2. Настройка внешней базы данных

```env
# В .env файле
DATABASE_URL=postgres://user:password@your-db-host:5432/huginn_db
```

#### 3. Настройка внешнего RabbitMQ

```env
# В .env файле
RABBITMQ_URL=amqp://user:password@your-rabbitmq-host:5672/
```

#### 4. Настройка мониторинга

```bash
# Установка дополнительных инструментов мониторинга
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Обновление системы

#### 1. Обновление кода

```bash
# Получение последних изменений
git pull origin main

# Пересборка и перезапуск
docker-compose down
docker-compose up -d --build
```

#### 2. Обновление миграций

```bash
# Применение новых миграций
docker-compose exec backend python -m aerich upgrade
```

#### 3. Очистка неиспользуемых ресурсов

```bash
# Удаление неиспользуемых образов
docker image prune -f

# Удаление неиспользуемых контейнеров
docker container prune -f

# Удаление неиспользуемых томов
docker volume prune -f
```

### Резервное копирование

#### 1. Резервное копирование базы данных

```bash
# Создание резервной копии
docker-compose exec database pg_dump -U huginn_user huginn_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из резервной копии
docker-compose exec -T database psql -U huginn_user huginn_db < backup_20241201_120000.sql
```

#### 2. Резервное копирование конфигурации

```bash
# Создание архива конфигурации
tar -czf huginn_config_$(date +%Y%m%d_%H%M%S).tar.gz \
  .env \
  nginx/ \
  docker-compose.yml
```

### Удаление системы

```bash
# Остановка всех сервисов
docker-compose down

# Удаление всех контейнеров и образов
docker-compose down --rmi all --volumes --remove-orphans

# Удаление данных (ОСТОРОЖНО!)
docker volume rm huginn_database_data huginn_rabbitmq_data

# Удаление директории проекта
cd ..
rm -rf huginn
```

## 📖 Документация API

### Аутентификация

```bash
# Получение токена
curl -X POST https://localhost/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"
```

### Основные эндпоинты

#### Аутентификация
- `POST /api/v1/auth/login` - вход в систему
- `POST /api/v1/auth/register` - регистрация
- `GET /api/v1/auth/me` - информация о текущем пользователе

#### Контрагенты
- `GET /api/v1/contractors/` - список контрагентов
- `POST /api/v1/contractors/` - создание контрагента
- `GET /api/v1/contractors/{id}` - информация о контрагенте
- `PUT /api/v1/contractors/{id}` - обновление контрагента
- `DELETE /api/v1/contractors/{id}` - удаление контрагента
- `POST /api/v1/contractors/{id}/scan` - запуск сканирования
- `POST /api/v1/contractors/{id}/rescan` - принудительное пересканирование
- `GET /api/v1/contractors/{id}/pages` - страницы контрагента
- `GET /api/v1/contractors/{id}/pages/{page_id}` - детали страницы с нарушениями

#### Запрещенные слова
- `GET /api/v1/forbidden-words/` - список запрещенных слов
- `POST /api/v1/forbidden-words/` - добавление запрещенного слова
- `PUT /api/v1/forbidden-words/{id}` - обновление запрещенного слова
- `DELETE /api/v1/forbidden-words/{id}` - удаление запрещенного слова

#### Пользователи
- `GET /api/v1/users/` - список пользователей (только админы)
- `POST /api/v1/users/` - создание пользователя (только админы)
- `PUT /api/v1/users/{id}` - обновление пользователя (только админы)
- `DELETE /api/v1/users/{id}` - удаление пользователя (только админы)

#### Dashboard
- `GET /api/v1/dashboard/stats` - статистика системы

## 🔍 Регулярные выражения для поиска

Система поддерживает использование регулярных выражений для поиска запрещенных слов. Это позволяет создавать гибкие правила поиска.

### Примеры использования

**Поиск всех слов, начинающихся с "платеж":**
```
платеж.*
```

**Точное начало слова:**
```
^платеж
```

**Комбинация слов:**
```
(платеж|оплата|перевод)
```

**Поиск номеров карт:**
```
\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b
```

**Поиск email адресов:**
```
\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b
```

**Поиск телефонных номеров:**
```
\+?[78][-\(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}
```

### Специальные символы

| Символ | Описание | Пример |
|--------|----------|--------|
| `.` | Любой символ | `платеж.` найдет "платеж1", "платежa" |
| `*` | 0 или более повторений | `платеж*` найдет "плате", "платеж", "платежж" |
| `+` | 1 или более повторений | `платеж+` найдет "платеж", "платежж" |
| `?` | 0 или 1 повторение | `платеж?` найдет "плате", "платеж" |
| `\w` | Буква, цифра или подчеркивание | `платеж\w*` найдет "платеж1", "платеж_система" |
| `\s` | Пробел, табуляция, перенос строки | `платеж\s+система` |
| `^` | Начало строки | `^платеж` найдет только в начале |
| `$` | Конец строки | `платеж$` найдет только в конце |
| `\b` | Граница слова | `\bплатеж\b` найдет только отдельное слово |
| `[а-я]` | Диапазон символов | `платеж[а-я]*` найдет только с русскими буквами |
| `(a\|b)` | Альтернатива | `(платеж\|оплата)` найдет "платеж" или "оплата" |

### Как настроить регулярное выражение

1. Перейдите в раздел "Запрещенные слова"
2. Нажмите "Добавить слово"
3. Включите переключатель "Регулярное выражение"
4. Введите ваше регулярное выражение
5. При необходимости включите "Учитывать регистр"

## 🔧 Конфигурация

### Настройка сканирования

Для каждого контрагента можно настроить:

- **Максимальное количество страниц** - ограничение на количество сканируемых страниц
- **Максимальная глубина** - глубина рекурсивного обхода
- **Расписание проверки** - hourly, daily, weekly, monthly

## 📊 Мониторинг

### Логи

```bash
# Логи backend
docker-compose logs backend

# Логи scan-worker
docker-compose logs scan-worker

# Логи всех сервисов
docker-compose logs -f
```

### Статус сервисов

```bash
docker-compose ps
```

## 🔒 Безопасность

- HTTPS с самоподписанными сертификатами
- JWT токены для аутентификации
- Хеширование паролей (bcrypt)
- Валидация входных данных
- CORS настройки
- Ролевая модель доступа (админы/пользователи)

## 🛠️ Разработка

### Структура проекта

```
huginn/
├── backend/                 # Backend (FastAPI)
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── contractors.py
│   │   │       │   ├── dashboard.py
│   │   │       │   ├── forbidden_words.py
│   │   │       │   ├── mcc_codes.py
│   │   │       │   ├── scan_results.py
│   │   │       │   └── users.py
│   │   │       └── api.py
│   │   ├── core/           # Конфигурация и утилиты
│   │   │   ├── auth.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── logging.py
│   │   ├── models/         # Модели данных
│   │   │   ├── user.py
│   │   │   ├── contractor.py
│   │   │   ├── forbidden_word.py
│   │   │   ├── mcc_code.py
│   │   │   ├── webpage.py
│   │   │   └── scan_result.py
│   │   ├── schemas/        # Pydantic схемы
│   │   │   ├── contractor.py
│   │   │   └── violation.py
│   │   ├── services/       # Бизнес-логика
│   │   │   ├── queue_service.py
│   │   │   └── scanner_service.py
│   │   └── workers/        # Worker процессы
│   │       └── scan_worker.py
│   ├── pyproject.toml      # Зависимости Python
│   └── Dockerfile          # Docker образ
├── frontend/               # Frontend (React)
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   │   └── Layout.tsx
│   │   ├── contexts/       # React контексты
│   │   │   └── AuthContext.tsx
│   │   ├── pages/          # Страницы
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Contractors.tsx
│   │   │   ├── ForbiddenWords.tsx
│   │   │   ├── MCCCodes.tsx
│   │   │   ├── Users.tsx
│   │   │   └── ContractorPages.tsx
│   │   ├── services/       # API клиент
│   │   │   └── api.ts
│   │   ├── config/         # Конфигурация
│   │   │   └── api.ts
│   │   └── App.tsx         # Главный компонент
│   ├── package.json        # Зависимости Node.js
│   └── Dockerfile          # Docker образ
├── nginx/                  # Nginx конфигурация
│   └── nginx.conf
├── docker-compose.yml      # Docker Compose
└── README.md              # Документация
```

### Локальная разработка

```bash
# Пересборка backend
docker-compose build backend

# Пересборка frontend
docker-compose build frontend

# Перезапуск с пересборкой
docker-compose up -d --build
```

### Миграции базы данных

```bash
# Создание миграции
docker-compose exec backend aerich migrate

# Применение миграций
docker-compose exec backend aerich upgrade
```

## 🐛 Устранение неполадок

### Проблемы с запуском

1. **Порт занят:**
   ```bash
   # Проверка занятых портов
   lsof -i :80 -i :443 -i :8000
   ```

2. **Проблемы с базой данных:**
   ```bash
   # Сброс базы данных
   docker-compose down
   docker volume rm huginn_database_data
   docker-compose up -d
   ```

3. **Проблемы с RabbitMQ:**
   ```bash
   # Сброс очередей
   docker-compose down
   docker volume rm huginn_rabbitmq_data
   docker-compose up -d
   ```

4. **Проблемы с миграциями:**
   ```bash
   # Полный сброс миграций
   docker-compose down
   rm -rf backend/migrations
   docker volume rm huginn_database_data
   docker-compose up -d
   docker-compose exec backend python -m aerich init-db
   docker-compose exec backend python -m aerich upgrade
   ```

### Логи и отладка

```bash
# Детальные логи backend
docker-compose logs backend --tail=50

# Логи scan-worker
docker-compose logs scan-worker --tail=50

# Логи в реальном времени
docker-compose logs -f backend

# Проверка состояния контейнеров
docker-compose ps
```

### Частые проблемы

1. **Dashboard показывает нули:**
   - Проверьте, что backend запущен
   - Проверьте логи на ошибки API
   - Убедитесь, что есть данные в базе

2. **Сканирование не работает:**
   - Проверьте логи scan-worker
   - Убедитесь, что RabbitMQ запущен
   - Проверьте настройки запрещенных слов

3. **Регулярные выражения не работают:**
   - Проверьте синтаксис regex
   - Убедитесь, что включен флаг "Регулярное выражение"
   - Проверьте логи на ошибки компиляции

## 📈 Производительность

### Рекомендации по масштабированию

- **Увеличьте RAM** для обработки больших сайтов
- **Настройте несколько worker'ов** для параллельного сканирования
- **Используйте внешнюю базу данных** для продакшена
- **Настройте мониторинг** (Prometheus, Grafana)

### Ограничения

- Максимум 1000 страниц на контрагента
- Максимальная глубина обхода: 10 уровней
- Таймаут запросов: 30 секунд
- Размер очереди: 10000 задач
- TTL для повторного сканирования: 1 час

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

- Создайте Issue в GitHub
- Опишите проблему подробно
- Приложите логи и конфигурацию

---

**Huginn** - Система проверки контрагентов банка  
Версия: 1.0.0  
Последнее обновление: 2024 