# AGENTS.md

## Project Overview

Express 5 REST API with TypeScript, Prisma ORM, and PostgreSQL.
Learning/training project — see `CLAUDE.md` for teaching workflow.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with tsx watch (`src/bin/www.ts`) |
| `npm start` | Start production server |
| `npm test` | Run all tests (Mocha + tsx) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint `src/` and `test/` |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run typecheck` | Run TypeScript type check |

### Running a Single Test

```bash
# Run a single test file
npx mocha --require tsx test/routes/post.test.ts

# Run tests matching a pattern
npx mocha --require tsx --grep "should return 401" test/
```

## Database

- PostgreSQL 16 via Docker: `docker compose up -d` (port **5434**)
- Credentials: user=`dev`, password=`dev`, database=`nodejs_training`
- Set `DATABASE_URL` in `.env` file
- Run migrations: `npx prisma migrate dev`

**Important:** Ensure `.env` `DATABASE_URL` matches Docker configuration (port, database name, credentials). Mismatch causes tests to hit a different database than migrations.

### Pre-commit Hook

Runs `npm run lint && npm test`. Both must pass before committing.

## Architecture

```
src/
  app.ts              # Express app setup, middleware, route mounting
  bin/www.ts          # Server entry point
  routes/             # HTTP layer — Express routers
    validators/       # AJV JSON schemas for request body validation
  controllers/        # Request handlers, call services, format responses
  services/           # Business logic layer
  models/             # Prisma query wrappers
  db/
    prisma.ts         # Prisma client instance
  middlewares/        # Express middleware (passport, input validation)
  types/              # TypeScript type definitions
  utils/              # Shared constants and helpers
test/                 # Mirrors src/ structure
```

### Request Flow

`Route → validateInput middleware → Controller → Service → Model → Prisma`

Services return `{ code, data }` objects using `RESULT_CODES` from `src/utils/constants.ts`.
Controllers use switch statements on `result.code` to set HTTP status.

## Code Style

### TypeScript & ES Modules

- **TypeScript** with strict mode enabled
- **ES Modules** (`"type": "module"` in package.json)
- Use `import`/`export` — no CommonJS `require()`
- Path alias: `@/*` maps to `src/*` (e.g., `import { X } from '@/utils/constants'`)

### ESLint Configuration

- **Base**: `typescript-eslint` recommended
- **Max line length**: 100 characters
- **Custom rules**: `no-console: 'warn'`
- Config file: `eslint.config.ts`

### Formatting

- Single quotes
- Semicolons always
- 2-space indentation
- Trailing commas in arrays/objects
- Trailing newline at end of all files

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case.ts` | `validate-input.ts`, `user-body.ts` |
| Variables/functions | `camelCase` | `postService`, `getAll` |
| Constants | `UPPER_SNAKE_CASE` | `RESULT_CODES`, `EDIT_WINDOW_MS` |
| Classes | `PascalCase` | `PostController`, `UserService` |
| Types/interfaces | `PascalCase` | `ServiceResult`, `CreatePostInput` |
| Route paths | lowercase, plural nouns | `/api/posts`, `/api/users` |
| Test files | `<name>.test.ts` | `post.test.ts`, `user.test.ts` |

### Error Handling

- **Services**: wrap logic in `try/catch`, return `{ code: RESULT_CODES.*, data }` — never throw
- **Models**: no try/catch — let errors propagate to service
- **Controllers**: switch on `result.code` and map to HTTP status codes
- Use `RESULT_CODES` enum: `SUCCESS`, `NOT_FOUND`, `ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `EDIT_WINDOW_EXPIRED`, `ERROR`
- Error responses: `{ message: 'Human-readable error' }`
- Use `console.error('Context:', error)` in catch blocks

### Controller Patterns

- **Type assertion for route params**: Use `req.params.id as string` instead of `String(req.params.id)` — cleaner and more explicit
- **Blank lines before `return;`**: Add a blank line before each `return;` in switch statements for readability:
  ```typescript
  case RESULT_CODES.NOT_FOUND:
    res.status(404).json({ message: 'User not found' });

    return;
  ```

### Code Patterns

- **Destructuring in map functions**: Prefer destructuring for cleaner code:
  ```typescript
  // Preferred
  items.map(({ field: { id, name } }) => ({ id, name }))
  
  // Avoid
  items.map((item) => ({ id: item.field.id, name: item.field.name }))
  ```

## BigInt Handling

PostgreSQL uses `BIGINT` for IDs. A global `toJSON` is added to `BigInt.prototype` in `app.ts`:

```typescript
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
```

No manual conversion needed in controllers. Exception: pass `Number(user.id)` to functions expecting `number`.

## Validation

- AJV for request body validation via `validateInput` middleware
- Schemas in `src/routes/validators/<resource>-body.ts`
- Use `additionalProperties: false` to reject unknown fields
- Validation errors return 400 with `{ message: 'Invalid input', errors: [...] }`

## Testing

- **Framework**: Mocha with `tsx` loader
- **Assertions**: `expect` from the `expect` package (Jest-compatible matchers)
- **HTTP testing**: `supertest` for route/integration tests
- **Fake data**: `@faker-js/faker`
- **No mocking**: Tests hit the real database — ensure Docker DB is running
- **Lifecycle**: Use `before`/`after` for setup/teardown

### Test Pattern

```typescript
import { expect } from 'expect';
import request from 'supertest';
import app from '@/app';

describe('Subject under test', () => {
  before(async () => { /* setup */ });
  after(async () => { /* cleanup */ });

  it('should describe expected behavior', async () => {
    // arrange, act, assert
  });
});
```

## Prisma

- Schema: `prisma/schema.prisma`
- Client: imported from `@/db/prisma`
- Models wrap Prisma queries with static methods (e.g., `PostModel.findById()`)
- Migrations stored in `prisma/migrations/`
