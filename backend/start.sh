#!/bin/bash
set -e

echo "Starting Huginn Backend..."

# Ждем, пока база данных будет готова
echo "Waiting for database to be ready..."
while ! nc -z database 5432; do
  echo "Database is not ready - waiting..."
  sleep 2
done
echo "Database is ready!"

# Инициализируем базу данных и применяем миграции
echo "Initializing database..."
python init_db.py

# Создаем администратора, если его нет
echo "Creating admin user..."
python create_admin.py

# Запускаем приложение
echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload 