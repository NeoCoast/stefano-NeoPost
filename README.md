# NeoPost App

A REST API built with **TypeScript**, Node.js, Express 5, Prisma, and PostgreSQL. Includes user authentication with bcrypt, Passport, and JWT, request validation with AJV, and a full test suite with Mocha.

## Prerequisites

- Node.js v18+
- Docker (for PostgreSQL)

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Then edit `.env` and fill in the required values:

```
NODE_ENV=development
JWT_SECRET=pick-a-secret-string
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=
BREVO_SMTP_PASS=
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://dev:dev@localhost:5434/nodejs_training?schema=public
```

- `JWT_SECRET` — any random string, used to sign tokens.
- `BREVO_SMTP_USER` / `BREVO_SMTP_PASS` — only needed if you want production emails. In development, emails are previewed via [Ethereal](https://ethereal.email).
- `DATABASE_URL` — must match the Docker Compose credentials and port below.

**3. Start the database**

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5434`.

**4. Run database migrations**

```bash
npx prisma migrate dev
```

This creates the tables and generates the Prisma Client.

**5. Start the server**

```bash
npm run dev
```

The server runs on `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with tsx watch (auto-restart on save) |
| `npm start` | Start compiled JS (`node dist/bin/www.js`) |
| `npm test` | Run tests with Mocha + tsx |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |

## Project Structure

```
src/
├── bin/www.ts           # HTTP server entry point
├── app.ts               # Express app setup
├── routes/              # Route handlers
│   └── validators/      # AJV JSON schemas
├── business/            # Business logic layer
├── dataaccess/          # Database queries (Prisma)
├── db/
│   └── prisma.ts        # PrismaClient singleton
├── middlewares/         # Express middleware (passport, validation)
├── services/            # JWT and email services
├── templates/           # Email HTML templates
├── types/               # Shared TypeScript types and declarations
└── utils/               # Shared constants
prisma/
├── schema.prisma        # Database schema
└── migrations/          # Migration history
test/
├── routes/              # Route integration tests
├── services/            # Service unit tests
└── utils/               # Utility unit tests
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript | Static type checking (strict mode) |
| tsx | TypeScript runtime for development |
| Express 5 | HTTP server and routing |
| Prisma | ORM (PostgreSQL) |
| AJV | Request body validation |
| bcrypt | Password hashing |
| Passport (local + JWT) | Authentication |
| jsonwebtoken | Token generation and verification |
| Nodemailer | Confirmation emails |
| Mocha + Supertest | Testing (with tsx loader) |
| ESLint + typescript-eslint | Code quality and type-aware linting |
| Husky | Pre-commit hooks (lint + tests) |
| Docker Compose | Local PostgreSQL database |

## Database

The development database runs in Docker:

- **Host:** `localhost:5434`
- **Database:** `nodejs_training`
- **User / Password:** `dev` / `dev`

Connection string: `postgresql://dev:dev@localhost:5434/nodejs_training?schema=public`
