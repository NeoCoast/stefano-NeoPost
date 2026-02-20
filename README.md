# NeoPost App

A REST API built with Node.js, Express, Sequelize, and PostgreSQL. Includes user authentication with bcrypt and Passport, request validation with AJV, and a full test suite with Mocha.

## Prerequisites

- Node.js v18+
- Docker (for PostgreSQL)

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Start the database**

```bash
docker compose up -d
```

This starts PostgreSQL on port `5434`.

**3. Run migrations**

```bash
npx sequelize-cli db:migrate
```

**4. Start the server**

```bash
npm run dev
```

The server runs on `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-restart on save) |
| `npm start` | Start without nodemon |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |

## Project Structure

```
src/
├── bin/www.js          # HTTP server entry point
├── app.js              # Express app setup
├── routes/             # Route handlers
│   └── validators/     # AJV JSON schemas
├── business/           # Business logic layer
├── dataaccess/         # Database queries (Sequelize)
├── db/
│   ├── models/         # Sequelize models
│   ├── migrations/     # Database migrations
│   └── config.js       # Database configuration
├── middlewares/        # Express middleware (passport, validation)
└── utils/              # Shared constants
test/
├── models/             # Model unit tests
└── routes/             # Route integration tests
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| Express | HTTP server and routing |
| Sequelize | ORM (PostgreSQL) |
| AJV | Request body validation |
| bcrypt | Password hashing |
| Passport + passport-local | Authentication |
| Mocha + supertest | Testing |
| ESLint (Airbnb base) | Code quality |
| Husky | Pre-commit lint enforcement |
| Docker Compose | Local PostgreSQL database |

## Database

The development database runs in Docker:

- **Host:** `127.0.0.1:5434`
- **Database:** `nodejs_training`
- **User/Password:** `dev` / `dev`

Tests use a separate database (`nodejs_training_test`) configurable via environment variables:

```
DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT
```
