# NeoPost API

A REST API built with **TypeScript**, Express 5, Prisma, and PostgreSQL. Features user authentication with JWT, email confirmation, posts, comments, likes, and user follows.

**Live API:** https://neopost-api.onrender.com

**API Documentation:** See [API_EXAMPLES.md](./API_EXAMPLES.md) for curl examples.

## Features

- User signup with email confirmation
- JWT-based authentication
- CRUD operations for posts
- Comments on posts
- Like/unlike posts and comments
- Follow/unfollow users
- User profiles with activity stats
- Soft delete for posts
- Request validation with AJV
- Rate limiting

## Prerequisites

- Node.js v18+
- Docker (for local PostgreSQL)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
NODE_ENV=development
DATABASE_URL=postgresql://dev:dev@localhost:5434/nodejs_training?schema=public
JWT_SECRET=your-secret-string
APP_URL=http://localhost:3000
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=
BREVO_SMTP_PASS=
```

In development, emails are previewed via [Ethereal](https://ethereal.email).

### 3. Start the database

```bash
docker compose up -d
```

PostgreSQL 16 runs on port `5434`.

### 4. Run migrations

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with tsx watch (auto-restart on save) |
| `npm start` | Start production server (runs migrations first) |
| `npm test` | Run tests with Mocha |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check with `tsc` |
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |

## Project Structure

```
src/
├── bin/www.ts           # HTTP server entry point
├── app.ts               # Express app setup
├── routes/              # Route handlers (Express routers)
│   └── validators/      # AJV JSON schemas
├── controllers/         # Request handlers
├── services/            # Business logic layer
├── models/              # Prisma query wrappers
├── db/
│   └── prisma.ts        # PrismaClient singleton
├── middlewares/         # Express middleware (passport, validation)
├── templates/           # Email HTML templates
├── types/               # TypeScript type definitions
└── utils/               # Shared constants
prisma/
├── schema.prisma        # Database schema
└── migrations/          # Migration history
test/                    # Mirror of src/ structure
```

### Request Flow

```
Route → validateInput middleware → Controller → Service → Model → Prisma
```

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript | Static type checking (strict mode) |
| tsx | TypeScript runtime |
| Express 5 | HTTP server and routing |
| Prisma | ORM (PostgreSQL) |
| AJV | Request body validation |
| bcrypt | Password hashing |
| Passport + JWT | Authentication |
| Nodemailer | Transactional emails |
| Mocha + Supertest | Testing |
| ESLint | Code linting |
| Husky | Pre-commit hooks |

## Database

Local development database (Docker):

- **Host:** `localhost:5434`
- **Database:** `nodejs_training`
- **User / Password:** `dev` / `dev`

## Deployment

This project is deployed on [Render](https://render.com) using a `render.yaml` blueprint.

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `NODE_ENV` | Set to `production` |
| `APP_URL` | Base URL for email links |
| `BREVO_SMTP_HOST` | SMTP server host |
| `BREVO_SMTP_PORT` | SMTP port (2525 for Render) |
| `BREVO_SMTP_USER` | SMTP username |
| `BREVO_SMTP_PASS` | SMTP password |
| `BREVO_SENDER_EMAIL` | Verified sender email address |

### Notes

- Free tier web services spin down after 15 minutes of inactivity (cold start ~30s)
- Free tier PostgreSQL expires after 90 days
- Port 587 is often blocked on free tiers; use port 2525 for Brevo SMTP