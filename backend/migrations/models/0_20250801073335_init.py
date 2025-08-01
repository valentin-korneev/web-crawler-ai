from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "full_name" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "is_active" BOOL NOT NULL DEFAULT True,
    "is_admin" BOOL NOT NULL DEFAULT False,
    "email_notifications" BOOL NOT NULL DEFAULT True,
    "webhook_notifications" BOOL NOT NULL DEFAULT False,
    "notification_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMPTZ
);
COMMENT ON COLUMN "users"."username" IS 'Имя пользователя';
COMMENT ON COLUMN "users"."email" IS 'Email';
COMMENT ON COLUMN "users"."full_name" IS 'Полное имя';
COMMENT ON COLUMN "users"."hashed_password" IS 'Хешированный пароль';
COMMENT ON COLUMN "users"."role" IS 'Роль пользователя';
COMMENT ON COLUMN "users"."is_active" IS 'Активен ли пользователь';
COMMENT ON COLUMN "users"."is_admin" IS 'Администратор';
COMMENT ON COLUMN "users"."email_notifications" IS 'Email уведомления';
COMMENT ON COLUMN "users"."webhook_notifications" IS 'Webhook уведомления';
COMMENT ON COLUMN "users"."notification_email" IS 'Email для уведомлений';
COMMENT ON COLUMN "users"."last_login" IS 'Последний вход';
CREATE TABLE IF NOT EXISTS "contractors" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "is_active" BOOL NOT NULL DEFAULT True,
    "check_schedule" VARCHAR(50) NOT NULL DEFAULT 'daily',
    "last_check" TIMESTAMPTZ,
    "next_check" TIMESTAMPTZ,
    "max_pages" INT,
    "max_depth" INT,
    "mcc_code" VARCHAR(10),
    "mcc_probability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_pages" INT NOT NULL DEFAULT 0,
    "scanned_pages" INT NOT NULL DEFAULT 0,
    "violations_found" INT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "contractors"."name" IS 'Название контрагента';
COMMENT ON COLUMN "contractors"."domain" IS 'Домен сайта';
COMMENT ON COLUMN "contractors"."description" IS 'Описание';
COMMENT ON COLUMN "contractors"."is_active" IS 'Активен ли контрагент';
COMMENT ON COLUMN "contractors"."check_schedule" IS 'Расписание проверок';
COMMENT ON COLUMN "contractors"."last_check" IS 'Последняя проверка';
COMMENT ON COLUMN "contractors"."next_check" IS 'Следующая проверка';
COMMENT ON COLUMN "contractors"."max_pages" IS 'Максимальное количество страниц для проверки';
COMMENT ON COLUMN "contractors"."max_depth" IS 'Максимальная глубина обхода';
COMMENT ON COLUMN "contractors"."mcc_code" IS 'MCC код';
COMMENT ON COLUMN "contractors"."mcc_probability" IS 'Вероятность MCC классификации';
COMMENT ON COLUMN "contractors"."total_pages" IS 'Общее количество найденных страниц';
COMMENT ON COLUMN "contractors"."scanned_pages" IS 'Количество отсканированных страниц';
COMMENT ON COLUMN "contractors"."violations_found" IS 'Общее количество найденных нарушений';
CREATE TABLE IF NOT EXISTS "forbidden_words" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "word" VARCHAR(255) NOT NULL UNIQUE,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "is_active" BOOL NOT NULL DEFAULT True,
    "case_sensitive" BOOL NOT NULL DEFAULT False,
    "use_regex" BOOL NOT NULL DEFAULT False,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "forbidden_words"."word" IS 'Запрещенное слово';
COMMENT ON COLUMN "forbidden_words"."category" IS 'Категория слова';
COMMENT ON COLUMN "forbidden_words"."description" IS 'Описание';
COMMENT ON COLUMN "forbidden_words"."severity" IS 'Уровень критичности';
COMMENT ON COLUMN "forbidden_words"."is_active" IS 'Активно ли слово';
COMMENT ON COLUMN "forbidden_words"."case_sensitive" IS 'Учитывать регистр';
COMMENT ON COLUMN "forbidden_words"."use_regex" IS 'Использовать регулярные выражения';
CREATE TABLE IF NOT EXISTS "mcc_codes" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(10) NOT NULL UNIQUE,
    "description" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "keywords" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "keyword_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "tag_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "is_active" BOOL NOT NULL DEFAULT True,
    "min_probability" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "mcc_codes"."code" IS 'MCC код';
COMMENT ON COLUMN "mcc_codes"."description" IS 'Описание категории';
COMMENT ON COLUMN "mcc_codes"."category" IS 'Категория';
COMMENT ON COLUMN "mcc_codes"."keywords" IS 'Ключевые слова для классификации';
COMMENT ON COLUMN "mcc_codes"."tags" IS 'Теги для классификации';
COMMENT ON COLUMN "mcc_codes"."keyword_weight" IS 'Вес ключевых слов';
COMMENT ON COLUMN "mcc_codes"."tag_weight" IS 'Вес тегов';
COMMENT ON COLUMN "mcc_codes"."is_active" IS 'Активен ли код';
COMMENT ON COLUMN "mcc_codes"."min_probability" IS 'Минимальная вероятность для классификации';
CREATE TABLE IF NOT EXISTS "scan_results" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "pages_scanned" INT NOT NULL DEFAULT 0,
    "pages_with_violations" INT NOT NULL DEFAULT 0,
    "violations_data" JSONB NOT NULL,
    "mcc_classification" JSONB NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractor_id" INT NOT NULL REFERENCES "contractors" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "scan_results"."status" IS 'Статус сканирования';
COMMENT ON COLUMN "scan_results"."pages_scanned" IS 'Количество просканированных страниц';
COMMENT ON COLUMN "scan_results"."pages_with_violations" IS 'Страниц с нарушениями';
COMMENT ON COLUMN "scan_results"."violations_data" IS 'Найденные нарушения';
COMMENT ON COLUMN "scan_results"."mcc_classification" IS 'Результаты MCC классификации';
COMMENT ON COLUMN "scan_results"."started_at" IS 'Время начала сканирования';
COMMENT ON COLUMN "scan_results"."completed_at" IS 'Время завершения';
COMMENT ON COLUMN "scan_results"."error_message" IS 'Сообщение об ошибке';
CREATE TABLE IF NOT EXISTS "scan_sessions" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "pages_scanned" INT NOT NULL DEFAULT 0,
    "pages_with_violations" INT NOT NULL DEFAULT 0,
    "total_violations" INT NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "contractor_id" INT NOT NULL REFERENCES "contractors" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "webpages" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(500),
    "meta_description" VARCHAR(1000),
    "content" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "http_status" INT,
    "response_time" DOUBLE PRECISION,
    "violations_found" BOOL NOT NULL DEFAULT False,
    "violations_count" INT NOT NULL DEFAULT 0,
    "last_scanned" TIMESTAMPTZ,
    "next_scan" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractor_id" INT NOT NULL REFERENCES "contractors" ("id") ON DELETE CASCADE,
    "scan_session_id" INT REFERENCES "scan_sessions" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "webpages"."url" IS 'URL страницы';
COMMENT ON COLUMN "webpages"."title" IS 'Заголовок страницы';
COMMENT ON COLUMN "webpages"."meta_description" IS 'Meta description';
COMMENT ON COLUMN "webpages"."content" IS 'HTML контент страницы';
COMMENT ON COLUMN "webpages"."text_content" IS 'Текстовый контент без HTML';
COMMENT ON COLUMN "webpages"."status" IS 'Статус: pending, scanning, completed, failed';
COMMENT ON COLUMN "webpages"."http_status" IS 'HTTP статус код';
COMMENT ON COLUMN "webpages"."response_time" IS 'Время ответа в секундах';
COMMENT ON COLUMN "webpages"."violations_found" IS 'Найдены нарушения';
COMMENT ON COLUMN "webpages"."violations_count" IS 'Количество нарушений';
COMMENT ON COLUMN "webpages"."last_scanned" IS 'Время последнего сканирования';
COMMENT ON COLUMN "webpages"."next_scan" IS 'Время следующего сканирования';
CREATE TABLE IF NOT EXISTS "violations" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "word_found" VARCHAR(255) NOT NULL,
    "context" TEXT NOT NULL,
    "position" INT NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forbidden_word_id" INT NOT NULL REFERENCES "forbidden_words" ("id") ON DELETE CASCADE,
    "webpage_id" INT NOT NULL REFERENCES "webpages" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "violations"."word_found" IS 'Найденное слово';
COMMENT ON COLUMN "violations"."context" IS 'Контекст нарушения (окружающий текст)';
COMMENT ON COLUMN "violations"."position" IS 'Позиция в тексте';
COMMENT ON COLUMN "violations"."severity" IS 'Уровень критичности';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
