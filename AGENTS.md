# AGENTS.md

## Project Overview

Express 5 REST API (Node.js, CommonJS) with PostgreSQL via Sequelize ORM.
This is a learning/training project — see `CLAUDE.md` for teaching workflow rules.

## Build & Run Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon (`src/bin/www.js`) |
| `npm start` | Start production server |
| `npm test` | Run all tests (Mocha, recursive, `test/` dir) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint `src/` with ESLint (airbnb-base) |
| `npm run lint:fix` | Auto-fix lint issues |

### Running a Single Test

```bash
# Run a single test file
npx mocha --exit test/routes/item.test.js

# Run tests matching a describe/it string
npx mocha --exit --recursive --grep "should return 200" test/

# Run one test directory
npx mocha --exit --recursive test/business/
```

### Database

- PostgreSQL 16 via Docker: `docker compose up -d` (port **5434** on host, maps to 5432 in container)
- Credentials: user=`dev`, password=`dev`, database=`nodejs_training`
- Run migrations: `npx sequelize-cli db:migrate`
- Sequelize CLI config: `.sequelizerc` points to `src/db/`

### Pre-commit Hook (Husky)

The pre-commit hook runs `npm run lint && npm test`. Both must pass before committing.

## Architecture

```
src/
  app.js              # Express app setup, middleware, route mounting
  bin/www.js          # Server entry point (listen on PORT)
  routes/             # HTTP layer — Express routers
    validators/       # AJV JSON schemas for request body validation
  business/           # Business logic layer (called by routes)
  dataaccess/         # Data access layer (Sequelize queries, called by business)
  db/
    config.js         # Sequelize connection config (per environment)
    models/           # Sequelize model definitions (class syntax)
    migrations/       # Sequelize CLI migrations
  middlewares/        # Express middleware (passport, input validation)
  utils/              # Shared constants and helpers
test/                 # Mirrors src/ structure (routes/, business/, models/)
```

### Request Flow

`Route -> validateInput middleware -> Business -> DataAccess -> Sequelize Model`

Business functions return `{ code, data }` objects using `RESULT_CODES` from `src/utils/constants.js`.
Routes interpret the code to set the HTTP status and response body.

## Code Style

### ESLint Configuration

- **Base**: `eslint-config-airbnb-base` (flat config via `@eslint/eslintrc` FlatCompat)
- **ECMAScript**: 2022, `sourceType: 'commonjs'`
- **Custom rules**: `no-console: 'warn'`
- Config file: `eslint.config.cjs`

### Formatting Rules (Airbnb Base)

- **Quotes**: Single quotes
- **Semicolons**: Always
- **Trailing commas**: Yes (ES5 style — arrays, objects, function params)
- **Indentation**: 2 spaces
- **Max line length**: 100 characters (enforced by airbnb-base)
- **Arrow function parens**: Always `(x) => x`
- **Object shorthand**: Required when possible
- **Prefer destructuring**: Yes for arrays and objects

### Module System

- **CommonJS only** (`"type": "commonjs"` in package.json)
- Use `require()` / `module.exports` — no ES module `import`/`export`
- Named exports preferred: `module.exports = { fn1, fn2 }`
- Destructure on import: `const { RESULT_CODES } = require('../utils/constants')`

### Import Ordering

1. Node built-ins (`fs`, `path`, `process`)
2. Third-party packages (`express`, `sequelize`, `bcrypt`)
3. Blank line
4. Local modules (relative paths)
5. Within local: config/utils first, then same-layer dependencies

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case.js` | `validate-input.js`, `user-body.js` |
| Variables/functions | `camelCase` | `itemsBusiness`, `getAll` |
| Constants | `UPPER_SNAKE_CASE` | `RESULT_CODES`, `NOT_FOUND` |
| Classes/Models | `PascalCase` | `Item`, `User` |
| DB tables | `PascalCase` plural | `Items`, `Users` |
| Route paths | lowercase, plural nouns | `/api/items`, `/api/users` |
| Test files | `<name>.test.js` | `item.test.js`, `user.test.js` |

**Important**: Do NOT use `.routes.js`, `.controller.js`, or similar dot-suffix patterns for filenames.
The project uses plain `kebab-case.js` names organized by directory.

### Error Handling

- Business layer: wrap logic in `try/catch`, return `{ code: RESULT_CODES.*, data }` — never throw
- DataAccess layer: no try/catch — let errors propagate up to business
- Routes: check `result.code` and map to HTTP status codes
- Use `RESULT_CODES` enum from `src/utils/constants.js`: `SUCCESS`, `NOT_FOUND`, `ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `ERROR`
- Error responses follow: `{ message: 'Human-readable error' }`
- Use `console.error('Context:', error.message)` in catch blocks (not the full error object)

### Validation

- AJV for request body validation via `validateInput` middleware
- Schemas live in `src/routes/validators/<resource>-body.js`
- Schema objects use `additionalProperties: false` to reject unknown fields
- Validation errors return 400 with `{ message: 'Invalid input', errors: [...] }`

## Testing

- **Framework**: Mocha (with `--recursive --exit`)
- **Assertions**: `expect` from the `expect` package (Jest-compatible matchers like `toBe`, `toHaveProperty`, `toBeNull`, `toBeUndefined`)
- **HTTP testing**: `supertest` for route/integration tests
- **Fake data**: `@faker-js/faker`
- **No mocking**: Tests hit the real database — ensure Docker DB is running
- **Lifecycle hooks**: Use Mocha's `before`/`after` (not `beforeEach`/`afterEach`) for test data setup/teardown
- **Cleanup**: Always destroy test-created records in `after` blocks

### Test File Structure

```
test/
  routes/          # Integration tests (HTTP via supertest)
  business/        # Business logic tests
  models/          # Model-level tests (instance methods, validations)
```

Test files mirror the source path: `src/business/item.js` -> `test/business/item.test.js`

### Test Pattern

```js
const { expect } = require('expect');
const request = require('supertest');  // for route tests
const app = require('../../src/app');  // for route tests

describe('Subject under test', () => {
  // setup with before(), cleanup with after()
  it('should describe expected behavior', async () => {
    // arrange, act, assert
  });
});
```

## Sequelize Models

- Use class syntax extending `Model`
- Define via factory function: `module.exports = (sequelize, DataTypes) => { ... }`
- Instance methods use `function` keyword (not arrows) for correct `this` binding
- Migrations use `BIGINT` for IDs and `TIMESTAMPTZ` for timestamps
- Auto-loaded from `src/db/models/` by `index.js` (filesystem scan)

## Key Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Session workflow, teaching guidelines, project lessons |
| `TEACHING_GUIDE.md` | Student profile, per-concept depth guidance |
| `PLAN.md` | Learning phases and scope |
| `src/utils/constants.js` | `RESULT_CODES` enum used across all layers |
| `.sequelizerc` | Sequelize CLI path configuration |
| `docker-compose.yml` | PostgreSQL 16 on port 5434 |
