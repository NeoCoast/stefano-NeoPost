# Node.js Express API - Learning Plan

## Overview

4-phase plan for a JavaScript beginner. Each phase adds **one tool** and **2-4 JS concepts** — learned because the task needs them, not as prerequisites.

**Stack:** Express, Sequelize, PostgreSQL (Docker), AJV, nodemon
**Module system:** CommonJS (`require`/`module.exports`) — this is what Express docs, most tutorials, and StackOverflow answers use for this stack. ESM (`import`/`export`) exists and is the future, but the student will read CommonJS 80% of the time when searching for help.

---

## Phase 0: Prerequisites

Get PostgreSQL running with Docker. Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: nodejs_training
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Run `docker-compose up -d`. Done.

---

## Phase 1: Hello World Express Server

**Tool:** Express + nodemon
**New JS concepts:** `const`/`let`, `require()`, callbacks, template literals

### Steps
1. `npm init -y`
2. `npm install --save express sequelize pg ajv nodemon`
3. Create single file `index.js`
4. Add to `package.json` scripts: `"dev": "nodemon index.js"`, `"start": "node index.js"`
5. `npm run dev`

### What the student writes (~12 lines)

```js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', function(req, res) {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, function() {
  console.log(`Server running on port ${PORT}`);
});
```

### Test it
Browser → `http://localhost:3000` → see JSON. Change message, save → nodemon reloads.

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| `const` | `const express = ...` | "Like `var` but can't be reassigned. Use `const` by default, `let` only if the value changes" |
| `require()` | `require('express')` | "How Node.js loads libraries. You installed Express, now `require` brings it into your file" |
| Callback | `app.get('/', function(...) { })` | "You give Express a function to run LATER — when someone visits this URL. Express calls YOUR function" |
| Template literal | `` `Server on port ${PORT}` `` | "A string using backticks. `${}` inserts a variable's value. Same as `'Server on port ' + PORT` but cleaner" |

**Note:** Use `function` keyword here, NOT arrow functions. The student knows `function`.

---

## Phase 2: 3-Layer Architecture

**Tool:** Express Router
**New JS concepts:** `module.exports`, objects `{}`, arrays of objects `[{}]`

### The motivation
"Imagine 20 routes all in `index.js` — plus database code mixed with HTTP code. Unreadable. Let's split it."

### Steps
1. Create folders: `src/routes/`, `src/business/`, `src/dataaccess/`, `src/middlewares/`, `src/utils/`
2. Create `src/app.js` — Express setup
3. Create `src/bin/www.js` — server startup (separated so we can import `app` for testing later)
4. Create one resource through all 3 layers with **hardcoded data** (no database yet)
5. Update `package.json` scripts to `src/bin/www.js`

### Folder structure
```
src/
├── app.js
├── bin/www.js
├── routes/items.routes.js       ← HTTP in/out
├── business/items.business.js   ← logic, rules
├── dataaccess/items.dataaccess.js ← data retrieval (hardcoded for now)
├── middlewares/                  ← (empty, used in Phase 4)
└── utils/constants.js           ← result codes
```

### The rule
```
Route  →  Business  →  DataAccess
(only calls the layer below)
```

### Test it
`GET http://localhost:3000/api/items` → JSON array flowing through all 3 layers.

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| `module.exports` | `module.exports = { getAll }` | "Phase 1 used `require` to load Express (someone else's code). Now YOU create files that other files can load. `module.exports` says: here's what this file shares" |
| Objects `{}` | `{ id: 1, name: 'Item' }` | "A container with labeled values. `id` is the label, `1` is the value" |
| Array of objects | `[{ id: 1 }, { id: 2 }]` | "A list where each item is an object. Our API returns a list of items" |

**Important:** Split Router creation (no method chaining):
```js
const express = require('express');
const router = express.Router();
```

---

## Phase 3: Database (Sequelize + PostgreSQL)

**Tool:** Sequelize ORM + Docker PostgreSQL
**New JS concepts:** `async/await`, `try/catch`, arrow functions `=>`

### The motivation
"Restart the server — all data is gone. We need a real database."

### Steps
1. `npm install --save-dev sequelize-cli`
2. Create `.sequelizerc` in project root (tells Sequelize where files go):
```js
const path = require('path');
module.exports = {
  'config': path.resolve('src', 'db', 'config.js'),
  'models-path': path.resolve('src', 'db', 'models'),
  'seeders-path': path.resolve('src', 'db', 'seeds'),
  'migrations-path': path.resolve('src', 'db', 'migrations'),
};
```
3. `npx sequelize-cli init` — creates `src/db/` folders
4. Edit `src/db/config.js` — connect to Docker PostgreSQL
5. Generate model: `npx sequelize-cli model:generate --name Item --attributes name:string,description:string`
6. Fix migration to use best-practice types (see below)
7. `npx sequelize-cli db:migrate`
8. Replace hardcoded data in `items.dataaccess.js` with Sequelize queries

### Database best practices
- `BIGINT` for IDs (not `INTEGER` — overflows at 2.1B rows)
- `TEXT` for strings (same Postgres performance as `VARCHAR`, no artificial limit)
- `TIMESTAMPTZ` for timestamps (timezone-aware)
- Always index foreign key columns (Postgres does NOT auto-index them)

### Use `sequelize.define()` — avoids `class` syntax the student doesn't know yet.

### Test it
POST → creates record in real DB. Stop server, restart → data is still there.

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| `async/await` | `const items = await Item.findAll()` | "The database takes time to respond. `await` means 'pause here until data comes back'. `async` marks a function that uses `await`" |
| `try/catch` | Wrapping database calls | "What if the database is down? `try` runs the code, `catch` catches the error — like a safety net" |
| Arrow functions `=>` | Throughout Phase 3 code | "Remember `function(req, res) { }`? This is shorter: `(req, res) => { }`. Same thing, less typing. You've written enough callbacks to be ready for this shortcut" |

---

## Phase 4: Validation (AJV)

**Tool:** AJV
**New JS concepts:** nested objects (JSON Schema), higher-order functions

### The motivation
"POST garbage to the API — it goes straight to the database. We need to reject bad input."

### Steps
1. Create `src/middlewares/validate-input.js`
2. Define JSON Schema for POST body
3. Apply middleware to POST route
4. Test with valid and invalid data

### How it works
```
Request → AJV checks body → Valid? → Continue to route
                           → Invalid? → 400 with error details
```

### Test it
POST missing fields → 400. POST wrong types → 400. POST valid data → 201.

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| Nested objects | JSON Schema definition | "An object inside an object. The schema describes your data's shape: which fields, what types, what's required" |
| Higher-order function | `validate(schema)` returns middleware | "A function that CREATES another function. You give it a schema, it gives you back a middleware. One function making another" |

---

## Phase 5: ESLint + Git Hooks

**Tools:** ESLint (flat config) + eslint-config-airbnb-base + Husky
**New JS concepts:** Spread operator `...`, destructuring `{ }`, config-as-code

### The motivation
"Your code works. But is it **good**? Consistent? Readable by someone else? ESLint catches problems automatically — style issues, potential bugs, patterns that confuse readers. And a pre-commit hook means you literally cannot commit bad code."

### Compatibility note
The company guide references `babel-eslint`, `eslint-config-airbnb`, and `pre-commit`. These are outdated:
- `babel-eslint` was deprecated in 2020 (replaced by `@babel/eslint-parser`, which we don't need — no Babel/JSX in this project)
- `eslint-config-airbnb` includes React rules — we use `airbnb-base` (Node.js only)
- `eslint-plugin-jsx-a11y` is React accessibility — irrelevant for an API
- The `pre-commit` package was abandoned 9 years ago — we use Husky instead
- ESLint v10 removed `.eslintrc` — we downgrade to v9 which supports FlatCompat bridge

### Steps
1. `git init` + create `.gitignore` (`node_modules/`, `.env`)
2. Downgrade ESLint: `npm install --save-dev eslint@9`
3. Install ESLint ecosystem: `npm install --save-dev eslint-config-airbnb-base eslint-plugin-import @eslint/eslintrc globals`
4. Delete the empty `.eslintrc` file
5. Create `eslint.config.cjs` — flat config using FlatCompat to wrap Airbnb base rules
6. Add scripts: `"lint": "eslint src/"`, `"lint:fix": "eslint src/ --fix"`
7. Run `npm run lint` — see Airbnb violations in existing code
8. Fix lint errors (auto-fix first, then manual)
9. Install Husky: `npm install --save-dev husky` + `npx husky init`
10. Configure pre-commit hook: `.husky/pre-commit` runs `npm run lint`
11. Test: commit with a lint error → rejected. Fix → commit succeeds

### What the eslint.config.cjs looks like

```js
const { FlatCompat } = require('@eslint/eslintrc');
const globals = require('globals');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.extends('airbnb-base'),
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ['node_modules/'],
  },
];
```

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| Spread `...` | `...compat.extends(...)`, `...globals.node` | "`compat.extends()` returns an array of config objects. The three dots 'unpack' them into our array. Like pouring items from a box into a bigger box" |
| Destructuring `{ }` | `const { FlatCompat } = require(...)` | "Instead of `const eslintrc = require(...); const FlatCompat = eslintrc.FlatCompat`, you grab what you need directly. You already used this pattern: `const { Item } = require(...)`" |
| Config-as-code | The entire config file | "This isn't JSON — it's a real JS file. You can use variables, spread, conditions. ESLint's new config format is just JavaScript" |

### Test it
Break a rule on purpose → `npm run lint` catches it. Try to commit → blocked. Fix → commit passes.

---

## Phase 6: Testing Architecture

**Tools:** Mocha (test runner) + expect (assertions) + supertest (HTTP testing) + @faker-js/faker (test data)
**New JS concepts:** `describe`/`it` blocks (DSL pattern), method chaining, `beforeEach`/`afterEach` (lifecycle hooks)

### The motivation
"You add a new feature. It works. But did you just break the GET endpoint that was working before? Without tests, you don't know until someone complains. Tests are code that checks your other code — automatically, every time."

### Package note
The `expect` package is Jest's standalone assertion library (not the full Jest framework). It gives you `expect(value).toBe(...)`, `toEqual(...)`, etc. If you later encounter Jest, these assertions transfer directly.

### Steps
1. Install test dependencies: `npm install --save-dev mocha supertest expect @faker-js/faker`
2. Create `test/` directory at project root
3. Add scripts: `"test": "mocha --recursive --exit test/"`, `"test:watch": "mocha --recursive --exit --watch test/"`
4. Create first test file: `test/routes/item.test.js`
   - Import `supertest` and `app` (this is why `app.js` is separate from `www.js`)
   - Write GET /api/items test
   - Write POST /api/items test (valid body)
   - Write POST /api/items test (invalid body — expect 400)
5. Create business layer test: `test/business/item.test.js`
   - Test that getAll returns `{ code, data }` shape
   - Test that getById with non-existent ID returns NOT_FOUND
6. Update pre-commit hook: add `npm test` to `.husky/pre-commit`
7. Run `npm test` — see tests pass

### Test file structure
```
test/
├── routes/
│   └── item.test.js     ← Integration tests (HTTP)
└── business/
    └── item.test.js     ← Unit tests (logic)
```

### What a test file looks like

```js
const request = require('supertest');
const { expect } = require('expect');
const app = require('../../src/app');

describe('GET /api/items', () => {
  it('should return an array', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('POST /api/items', () => {
  it('should create an item with valid data', async () => {
    const { faker } = require('@faker-js/faker');
    const newItem = {
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
    };

    const response = await request(app)
      .post('/api/items')
      .send(newItem);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(newItem.name);
  });

  it('should return 400 with invalid data', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({});

    expect(response.status).toBe(400);
  });
});
```

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| `describe`/`it` DSL | Test file structure | "`describe` groups related tests. `it` describes one specific behavior. Read it like English: 'Describe GET /api/items — it should return an array'" |
| Callback in `it` | `it('name', async () => { })` | "Mocha calls your function when it runs that test. Same callback pattern as Express routes — you give mocha a function, mocha decides when to run it" |
| `beforeEach`/`afterEach` | Test setup/teardown | "Code that runs before/after EACH test. Like resetting a board game before every round — each test starts fresh" |
| Method chaining | `request(app).get('/api/items')` | "Each method returns the object itself, so you can chain calls. Like `string.trim().toLowerCase()` — each step returns something you can call the next method on" |

### Key insight to surface
"Remember we separated `app.js` from `www.js` in Phase 2? Here's why — supertest imports `app` directly without starting a server. That architectural decision pays off now."

### Test it
Run `npm test`. Break something on purpose in a route → re-run → test catches it.

---

## Phase 7: User Authentication

**Tools:** bcrypt (password hashing) + passport + passport-local (authentication strategy)
**New JS concepts:** Instance methods (`prototype`), `this` keyword, `function` vs `=>` for `this`, salt rounds (conceptual)

### The motivation
"Anyone can call your API. Anyone. There's nothing stopping someone from creating fake users or reading other people's data. Authentication means: prove who you are before I give you access."

### Steps

**7a. User model (no auth yet)**
1. Generate model: `npx sequelize-cli model:generate --name User --attributes email:string,username:string,birthday:date,password:string`
2. Fix migration: BIGINT IDENTITY for id, TEXT for email/username/password, DATE for birthday, add unique constraints on email and username, add indexes
3. Run migration: `npx sequelize-cli db:migrate`
4. Create 3-layer files: `src/routes/user.js`, `src/business/user.js`, `src/dataaccess/user.js`
5. Create AJV schema: `src/routes/validators/user-body.js`
6. Mount routes in `src/app.js`: `app.use('/api/users', userRoutes)`

**7b. Password hashing with bcrypt**
1. Install: `npm install --save bcrypt`
2. In business layer: hash password with `bcrypt.hash(password, 10)` before saving
3. Add `verifyPassword` instance method on User model (uses `bcrypt.compare`)
4. Write tests: `test/models/user.test.js` — correct password returns true, wrong password returns false

**7c. Passport local strategy**
1. Install: `npm install --save passport passport-local`
2. Create `src/middlewares/passport.js` — configure LocalStrategy
3. Strategy looks up user by email, calls `verifyPassword`
4. Initialize in `app.js`: `app.use(passport.initialize())`
5. Use `{ session: false }` — this is an API, not a browser app

**7d. Sign up endpoint (unprotected)**
1. POST `/api/users/signup` — validates body, hashes password, creates user
2. Returns user data WITHOUT the password field
3. Tests: valid signup (201), duplicate email (409), invalid body (400)

**7e. Sign in endpoint (protected with passport)**
1. POST `/api/users/signin` — uses `passport.authenticate('local', { session: false })` as middleware
2. On success, returns user data (without password)
3. Tests: valid credentials (200), wrong password (401), non-existent email (401)

### What the User model looks like

```js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    birthday: {
      type: DataTypes.DATE,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  User.prototype.verifyPassword = async function(password) {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, this.password);
  };

  return User;
};
```

### JS concepts to explain in context

| Concept | When it appears | How to explain |
|---------|----------------|----------------|
| Instance methods | `User.prototype.verifyPassword` | "A method that belongs to each individual user. `Item.findAll()` is called on the model itself. `user.verifyPassword()` is called on one specific user. Like 'all dogs bark' vs 'MY dog barks'" |
| `this` keyword | `this.password` in verifyPassword | "`this` refers to the specific user instance. When you call `user.verifyPassword(pw)`, inside that function `this` IS that user. So `this.password` is that user's hashed password" |
| `function` vs `=>` for `this` | Using `function` not `=>` | "Arrow functions don't have their own `this`. For instance methods, we NEED `this` to be the user instance. So we use `function`, not `=>`. Now you understand why both exist" |
| Salt rounds | `bcrypt.hash(password, 10)` | "Hashing converts a password into an irreversible string. The salt is random data added before hashing so two users with 'hello123' get DIFFERENT hashes. 10 is the 'cost' — how many times to re-hash" |
| Middleware-as-auth | `passport.authenticate('local')` | "Same middleware pattern as AJV validation. Instead of checking the body's shape, it checks credentials. Invalid? Stop. Valid? Continue to route" |

### Files to create/modify

| File | Action |
|------|--------|
| `src/db/models/user.js` | Create (sequelize-cli generates, then modify) |
| `src/db/migrations/XXXXXX-create-user.js` | Create (sequelize-cli generates, then fix types) |
| `src/routes/user.js` | Create |
| `src/routes/validators/user-body.js` | Create |
| `src/business/user.js` | Create |
| `src/dataaccess/user.js` | Create |
| `src/middlewares/passport.js` | Create |
| `src/app.js` | Modify (add user routes, passport init) |
| `test/models/user.test.js` | Create |
| `test/routes/user.test.js` | Create |

### Test it
Sign up a user → password is hashed in DB. Sign in with correct password → success. Sign in with wrong password → 401. Check API response → no password field visible.

---

## JS Concept Roadmap

| Phase | New JS Concepts | Running Total |
|-------|----------------|---------------|
| 1 | `const`/`let`, `require()`, callbacks, template literals | 4 |
| 2 | `module.exports`, objects, arrays of objects | 7 |
| 3 | `async/await`, `try/catch`, arrow functions `=>` | 10 |
| 4 | Nested objects, higher-order functions | 12 |
| 5 | Spread `...`, destructuring `{ }`, config-as-code | 15 |
| 6 | DSL pattern (`describe`/`it`), method chaining, test lifecycle hooks | 18 |
| 7 | Instance methods, `this` keyword, `function` vs `=>` for `this`, salt rounds | 22 |

**Strategy:** `function` keyword in Phases 1-2. Arrow functions in Phase 3+. Phase 7 brings `function` back with a reason — now the student understands WHY both exist.

---

## Note for the student

> This project uses `require()` (CommonJS modules). You'll also see `import`/`export` (ESM) in newer tutorials. Both work. We use `require` because Express docs, most StackOverflow answers, and the majority of tutorials for this stack use it. You'll learn `import` naturally when you encounter it.
