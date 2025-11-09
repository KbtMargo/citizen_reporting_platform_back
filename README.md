# 🏙️ Платформа Звернень СiviсRеports (Backend API)

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/your-username/backend-repo-name/ci.yml?style=for-the-badge&logo=githubactions)
![Tech Stack](https://img.shields.io/badge/Tech-NestJS-red?style=for-the-badge&logo=nestjs)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql)
![ORM](https://img.shields.io/badge/ORM-Prisma-white?style=for-the-badge&logo=prisma)

Це бекенд-сервіс (API) для СiviсRеports. Він відповідає за бізнес-логіку, автентифікацію, керування базою даних та надання даних для клієнтської частини.

> ⚠️ **Важливо:** Цей репозиторій містить **лише бекенд (API)**. Він не має користувацького інтерфейсу.
>
> **➡️ Фронтенд-репозиторій знаходиться тут: [https://github.com/KbtMargo/citizen_reporting_platform_front](https://github.com/KbtMargo/citizen_reporting_platform_front)**

## ✨ API Можливості

* **GraphQL API:** Надає чіткі ендпоінти для всіх сутностей.
* **Автентифікація JWT:** Безпечний вхід та реєстрація.
* **Управління Сутностями (CRUD):** Повні операції для `Users`, `Reports`, `OSBBs`, `Categories` та ін.
* **Ролі та Дозволи:** Розподіл прав (RESIDENT, OSBB_ADMIN, ADMIN).
* **Геопросторові Дані:** Збереження та обробка `lat`/`lng` (із підтримкою `PostGIS` для поля `geom`).
* **Завантаження Файлів:** Інтеграція для зберігання файлів звернень.
* **Система Сповіщень:** Автоматична генерація сповіщень при зміні статусу звіту.

## 🛠️ Використані Технології

* **[NestJS](https://nestjs.com/)**: Як основа для API.
* **[Prisma](https://www.prisma.io/)**: Сучасний ORM для роботи з базою даних.
* **[PostgreSQL](https://www.postgresql.org/)**: Реляційна база даних.
* **[PostGIS](https://postgis.net/)**: Розширення для PostgreSQL для роботи з гео-даними (необхідне для поля `Report.geom`).
* **[TypeScript](https://www.typescriptlang.org/)**: Для типізованого коду.
* **[Swagger (OpenAPI)](https://swagger.io/)**: Для автоматичної документації API.

## 🚀 Як запустити локально

1.  **Клонуйте репозиторій:**
    ```bash
    git clone https://github.com/KbtMargo/citizen_reporting_platform_back
    cd citizen_reporting_platform_back
    ```

2.  **Встановіть залежності:**
    ```bash
    npm install
    # або yarn install
    ```

3.  **Налаштуйте Docker (Рекомендовано для БД):**
    Найпростіший спосіб запустити PostgreSQL з PostGIS – це Docker.
    ```bash
    docker run --name postgis-db -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgis/postgis
    ```

4.  **Налаштуйте змінні оточення:**
    Створіть файл `.env` у корені проєкту та додайте ваші налаштування:
    ```.env
    # URL для підключення до вашої PostgreSQL бази з PostGIS
    DATABASE_URL="postgresql://postgres:Strong_New_Password_123!@localhost:5432/nest_app?schema=public"

    # Секретний ключ для JWT
    JWT_SECRET="your-super-secret-key"

    ```

5.  **Застосуйте міграції бази даних:**
    Prisma автоматично створить таблиці на основі вашої схеми.
    ```bash
    npx prisma migrate dev
    ```

6.  **(Опційно) Заповніть базу даних початковими даними:**
    ```bash
    npx prisma db seed
    ```

7.  **Запустіть сервер:**
    ```bash
    npm run start:dev
    # або yarn start:dev
    ```

8.  **Сервер запущено!**
    * API працює на: [http://localhost:3001](http://localhost:3001)
    * Документація Swagger (API): [http://localhost:3001/api](http://localhost:3001/api)
