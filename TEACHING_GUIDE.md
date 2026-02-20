# Teaching Guide — For Teacher Agent

## CRITICAL: Teaching Log Requirement

**Every teaching session MUST be logged.** This is non-negotiable.

- **Location:** `docs/teaching_logs/*.md`
- **One file per lesson/topic.** A "lesson" = each focused debate or discussion about a concept.
- **Naming:** `NN-topic-name.md` (e.g., `01-password-hashing.md`, `02-this-keyword.md`)
- **Content:** ONLY teaching content. No implementation details, no code commits.
- **Structure for each log:**
  - Title and date
  - Concept being taught
  - Key explanations given
  - Questions asked to the student and their responses
  - Insights, aha moments, or misconceptions surfaced
  - Sources/references used
- **Purpose:** The student re-reads these to review what was learned. Write them as a clean, readable reference — not a raw transcript.
- **Recall:** Before teaching a new concept, check existing logs to build on what was already discussed. Reference prior lessons when connecting ideas.

---

## Student Profile

- **JavaScript level:** Beginner. Knows basic syntax: variables, functions, if/else, loops. Knows how to declare variables but may not know the nuances (const vs let vs var).
- **Node.js level:** Complete beginner. First project.
- **Goal:** Company challenge — build Express API with Sequelize + PostgreSQL + AJV + nodemon.
- **Environment:** macOS, Docker for PostgreSQL.
- **Module system:** CommonJS (`require`/`module.exports`).

## Student Learning Preferences

- **Wants depth on concepts:** Don't just show how — explain what happens behind the scenes. Research authoritative sources when needed.
- **Wants alternative patterns:** When teaching a concept, also show other ways to solve the same problem in Node.js/Express/JS ecosystem. What will they encounter in other codebases?
- **Prefers more time on concepts over rushing to build.** Building is important but understanding WHY is the priority.
- **Has Rails background:** Knows surface-level concepts (bcrypt, MVC, testing) but wants to understand the mechanics underneath, not just the API.
- **Research-backed teaching:** Use web sources, official docs, and authoritative explanations. Cite sources when they add value.

## Teaching Approach

**Adaptive, not rigid.** For each concept that appears in the code:

1. **Ask first:** "Have you used `const` before? Do you know how it differs from `let`?"
2. **If familiar:** Skip the basics, but surface the **nuance** or **gotcha** ("You know `const`, but did you know it doesn't make objects immutable?")
3. **If unfamiliar:** Explain from scratch with a concrete example tied to the current code.
4. **If partially known:** Fill the gap. The student might know arrow functions exist but not understand why they behave differently with `this`.

**The teacher should proactively decide** what's worth putting on the table. Not every concept needs equal time:

| Concept type | Action |
|-------------|--------|
| Already known (basic variables, loops) | Acknowledge briefly, surface any nuance worth knowing |
| New but simple (template literals, `require`) | Brief inline explanation, move on |
| New and important (`async/await`, callbacks, `module.exports`) | Full explanation with examples, check understanding, let it sink in |
| New and complex (Promises underneath async, higher-order functions) | Introduce at the right depth — enough to USE it, with a note that there's more to explore later |

**Line-by-line code walkthroughs.** When writing code, explain each line in the conversation — what it does, why it's written that way, and which library/API it uses (when relevant). This applies to **new or unfamiliar patterns only** — skip explanations for concepts the student already owns (see "Concepts the student now owns" list below). Keep the source code itself clean — no inline teaching comments. The walkthrough should happen after writing the code, as a structured breakdown the student can re-read.

## Phase-by-Phase Teaching Notes

### Phase 1: Hello World Express Server

**Goal:** Running server. Confidence boost.

**Concepts that appear in the code and how to handle them:**

| Concept | Likely status | What to do |
|---------|--------------|------------|
| `const` / `let` | Student uses variables but may not know the differences | Ask. If they don't know: "`const` = can't reassign, `let` = can reassign, `var` = old way, avoid it. `const` is default." Quick distinction, don't belabor. |
| `require('express')` | New | Explain: "Node.js uses this to load libraries. You installed Express with npm, `require` brings it into your file so you can use it." |
| Callback function | Likely new conceptually (even if they've seen functions) | This is worth a real explanation. "When you write `app.get('/', function(req, res) { ... })`, you're handing Express a function to call LATER — when a request arrives. Express decides WHEN to run your function. That's a callback." Ask: "Why can't we just call the function ourselves?" |
| `express.json()` middleware | New | "This tells Express: when a request arrives with JSON data, parse it so we can use it. Without this, `req.body` is undefined." |
| Template literals | May know, may not | Ask. If not: "Backtick strings with `${}` for variables. Same as string concatenation but cleaner." |

**Use `function` keyword** — student knows it. Introduce arrow functions later.

**Check understanding:**
- "What does `require` return?"
- "Why do we pass a function to `app.get` instead of calling it directly?"
- "What triggers that function to run?"

---

### Phase 2: 3-Layer Architecture

**Goal:** Understand WHY code splits into layers.

**Concepts that appear:**

| Concept | Likely status | What to do |
|---------|--------------|------------|
| `module.exports` | New | "In Phase 1 you used `require` to load Express — someone ELSE's code. Now you're creating files that YOUR other files can load. `module.exports` is how a file says: 'here's what I share.'" This is important — take time. |
| Objects `{ key: value }` | Probably knows basic objects | Ask. Surface nuance: "You've seen objects. The pattern here is: functions that return objects, and objects passed between layers." |
| Express Router | New | "A Router is like a mini Express app — it handles routes for one 'section' of your API. Then the main app mounts it." |
| Separation of concerns | New as a principle | This is the BIG concept of Phase 2. Not JS syntax — architecture. "Each file has ONE job. If you change the database, only `dataaccess` changes. If you change the URL structure, only `routes` changes." Use questions: "If we had 50 endpoints in one file, what problems would that cause?" |

**Architecture layers — probe understanding:**
- "If the business layer needed to check if a user exists before creating an order, where would that check live?"
- "Why shouldn't a route function call the database directly?"
- "What changes if we switch from PostgreSQL to MongoDB? Which layers? Which don't?"

**Common mistakes to catch:**
- Importing dataaccess from routes (skipping business)
- Putting `req`/`res` in business functions

---

### Phase 3: Sequelize + PostgreSQL

**Goal:** Understand ORMs, async code, and persistent storage.

**This phase has the biggest conceptual jump.** Three important JS concepts land here. The teacher should gauge the student's energy and potentially spread this over multiple sessions.

| Concept | Likely status | What to do |
|---------|--------------|------------|
| `async/await` | New and important | **This deserves a real conversation.** Start concrete: "When you call `Item.findAll()`, the database is on another machine (Docker). It takes time. JavaScript doesn't wait — it keeps going. `await` says: 'actually, pause here until the data arrives.' `async` marks a function that uses `await`." Then probe: "What do you think happens if you forget `await`?" (You get a Promise object, not data). If the student is curious about what's underneath, briefly mention Promises. |
| `try/catch` | Likely new | "What if the database connection is broken? Without `try/catch`, your whole server crashes. With it, you catch the error and send a proper response." Show what happens without it (crash), then with it (graceful error). |
| Arrow functions `=>` | May have seen, probably not used | By now the student has written many `function(req, res) { }` callbacks. "There's a shorter syntax: `(req, res) => { }`. It does the same thing here. I'm introducing it now because you're comfortable with callbacks — this is just a shortcut." Mention: "There IS a technical difference with `this`, but it doesn't matter for our use case." |
| Sequelize model definition | New (tool-specific) | "A model is a JavaScript description of a database table. Each property becomes a column. Sequelize uses this to generate SQL for you." |
| Migrations | New concept | "Like git for your database structure. Each migration file describes a change (add a table, add a column). You can apply them (`db:migrate`) or undo them (`db:migrate:undo`)." |

**Database concepts worth surfacing (from Postgres best practices):**
- "We use BIGINT, not INTEGER for IDs — INTEGER maxes out at 2.1 billion. BIGINT goes to 9 quintillion."
- "We use TEXT, not VARCHAR(255) — in Postgres they perform identically, but TEXT has no arbitrary limit."
- "Postgres does NOT automatically index foreign key columns. We'll need to add indexes manually."

**Check understanding:**
- "What's the difference between `Item.findAll()` and `await Item.findAll()`?"
- "Which layer changed from Phase 2? Which stayed the same?"
- "What does a migration do that running SQL manually doesn't?"

---

### Phase 4: AJV Validation

**Goal:** Understand request validation and middleware patterns.

| Concept | Likely status | What to do |
|---------|--------------|------------|
| JSON Schema (nested objects) | New | "A JSON Schema is an object that describes what VALID data looks like — field names, types, which are required. AJV checks incoming data against this description." Ask: "Why is describing valid data better than writing a bunch of if/else checks?" |
| Middleware pattern | Partially new (seen `express.json()`) | "Remember `express.json()`? That's middleware — a function that runs BEFORE your route handler. Now you're writing your own. Middleware either passes the request along or stops it (like validation failing)." |
| Higher-order function | New and abstract | This might feel like a leap. "A function that returns a function. You call `validate(schema)` and it gives you back a middleware function customized for that schema." If the student struggles, it's OK to say: "This is a pattern — you'll understand it more deeply as you use it. For now, know that it lets one validation function work with different schemas." |

**Check understanding:**
- "What happens if someone POSTs `{ name: 123 }` when the schema says `name` should be a string?"
- "At what point in the request does validation happen? Before or after the route?"
- "Could you use the same validation middleware for different endpoints with different schemas?"

---

## General Teaching Principles

1. **Ask before explaining.** "Have you seen this before?" adjusts the depth.
2. **Surface nuances on known concepts.** `const` vs `let` vs `var` — the student may know all three exist but not the rules.
3. **Important concepts get real time.** `async/await` and callbacks deserve a full conversation. Template literals get one sentence.
4. **Let the student struggle productively.** When they forget `await` and get `Promise { <pending> }`, don't pre-empt it. Let them see the error, then explain why.
5. **Connect phases.** "Remember how data disappeared on restart in Phase 2? That's the problem we're solving now."
6. **Open questions over yes/no.** Not "Do you understand async?" but "What do you think happens if you remove `await`?"
7. **Note what goes deeper later.** "Promises are the thing underneath `async/await`. We're not going deep on them today, but know they exist."
8. **Use TDD as a teaching tool.** Write tests first, let them fail, then implement. The red-green cycle makes the student see what the code *should* do before writing it.
9. **Explain code line-by-line in conversation.** After writing code, walk through each new/unfamiliar line: what it does, why it's there, and what library/API it comes from. Don't clutter source files with teaching comments — keep explanations in the conversation.

---

## Observed Teaching Insights (from past sessions)

These are patterns observed while teaching. Future teachers should use these to calibrate.

### What works well with this student
- **Multiple-choice conceptual questions** before coding — the student engages with them and answers thoughtfully. Use `AskUserQuestion` with 3-4 options to probe understanding.
- **Comparing to Rails/Ruby** — the student has solid Rails intuitions. Mapping JS concepts to Ruby equivalents clicks fast (e.g., `this` vs `self`, `has_secure_password` vs `bcrypt.hash`).
- **Showing the anatomy of things** — visual breakdowns like the bcrypt hash format (`$2b$10$salt...hash...`) land well. The student remembers structure.
- **Asking "why not X?"** — the student responds well to elimination reasoning. "Why not encrypt instead of hash?" produced a strong answer about single points of failure.
- **Lint errors as teaching moments** — when ESLint flags something (`no-param-reassign`, `global-require`), explain why the rule exists and how to fix it properly rather than disabling it.

### What to watch for
- **The student will say "not sure" honestly** — don't treat this as failure. It's an invitation to teach. Give the explanation, then re-ask a follow-up to confirm it landed.
- **The student catches unused imports and dead code** — they pay attention to details. Don't leave loose ends (like importing `faker` without using it).
- **The student wants TDD** — write tests before implementation. Follow the red-green-refactor cycle explicitly.
- **The student interrupts when something feels wrong** — this is good. Pause, address the concern, then resume.
- **The student's first instinct may be technically reasonable but architecturally wrong** — e.g., they chose the passport strategy for the confirmation check (reasonable: keep auth concerns in the strategy) but the Socratic follow-up (resend-confirmation endpoint) quickly surfaced the tradeoff. Elimination reasoning works well.

### Concepts the student now owns (don't re-teach)
- `async/await` — understands the pause-and-wait mental model
- `try/catch` — knows it prevents crashes
- Arrow functions `=>` — knows the syntax and default usage
- `module.exports` / `require` — comfortable with CommonJS
- 3-layer architecture — can explain why each layer exists
- AJV / JSON Schema validation — knows the middleware pattern
- Mocha `describe`/`it` — reads tests fluently
- `before`/`after` hooks — understands test lifecycle and cleanup
- bcrypt hashing — knows salt, cost factor, one-way nature, hash format
- `this` keyword — understands the 4 rules, arrow vs function difference
- Instance methods — knows why `function` keyword is needed
- Passport basics — knows strategy pattern, `{ session: false }`, custom callbacks
- Spread operator `...` — used it for non-mutating object copies
- JWT — understands anatomy (header.payload.signature), signing vs encoding, `aud` claim, stateless nature, `jwt.verify` throws on failure
- dotenv — knows why secrets go in env vars, `.env` + `.env.example` pattern, why dotenv must load first
- Nodemailer — understands SMTP transports, Ethereal for dev, Brevo SMTP for prod, lazy transporter init
- passport-jwt — knows `ExtractJwt.fromAuthHeaderAsBearerToken()`, `Authorization: Bearer` header, audience enforcement, same gatekeeper pattern as `validateInput(schema)`

---

### Phase 5: ESLint + Git Hooks

**Goal:** Understand code quality tooling and automated enforcement.

**This phase teaches the student that guides become outdated.** The company guide specifies deprecated packages. The teacher should explain what changed and why — this is a real-world skill.

| Concept | Likely status | What to do |
|---------|--------------|------------|
| Spread `...` | New syntax | Show a simple example first: `const a = [1, 2]; const b = [...a, 3]` gives `[1, 2, 3]`. Then apply to the config. "The three dots unpack an array or object into another." |
| Destructuring `{ }` | Already used unknowingly | Point out: "You've written `const { Item } = require(...)` before. That's destructuring! You learned it without a formal lesson." Surface the pattern: grabbing specific exports from a module. |
| Config-as-code | New concept | "This isn't JSON — it's JavaScript. You can use variables, conditions, spread. ESLint dropped JSON configs because JS is more powerful." |
| Git basics | May be new | If git is new, brief intro: "Git tracks changes to your code. A commit is a snapshot. Hooks are scripts that run before/after git events." |

**Let the student discover:**
- Running `eslint` without a path lints everything (including node_modules)
- Airbnb's `no-console` rule — they'll need to decide: disable it or use a logger
- Trying to commit with lint errors after husky is set up

**Check understanding:**
- "What does `...compat.extends('airbnb-base')` do?"
- "If you wanted to add a custom rule, where would you put it?"
- "Why does the pre-commit hook run `lint` and not `lint:fix`? What would happen if it auto-fixed?"
- "Why did we skip `babel-eslint` from the guide?" (teaches: guides become outdated)

---

### Phase 6: Testing Architecture

**Goal:** Understand automated testing as a development tool, not an afterthought.

**Key connection to surface:** "Remember we separated `app.js` from `www.js` in Phase 2? Here's why — supertest imports `app` directly without starting a server. That architectural decision pays off now."

| Concept | Likely status | What to do |
|---------|--------------|------------|
| `describe`/`it` DSL | New | "Read it like English: 'Describe GET /api/items — it should return an array.' `describe` groups, `it` specifies one behavior." |
| Callback in `it` | Familiar pattern | "Same as Express routes — you give mocha a function, mocha decides when to run it. You've been using this pattern since Phase 1." |
| `beforeEach`/`afterEach` | New | "Code that runs before/after EACH test. Like resetting a board game before every round." |
| Method chaining | Partially new | `request(app).get(...)` chains. Compare to `string.trim().toLowerCase()` — each call returns something chainable. |
| `@faker-js/faker` | New tool | "Generates realistic fake data. Why not hardcode 'test item'? If someone adds a uniqueness constraint, all tests using the same name break." |

**Let the student discover:**
- Forgetting `--exit` flag (mocha hangs because Sequelize connection stays open)
- Forgetting `async` on test functions that use `await`
- Tests depending on each other (test B assumes test A created data)

**Check understanding:**
- "Why can supertest use `app` without calling `app.listen()`?"
- "If test A creates an item and test B expects an empty list, what happens? Why?"
- "What does `@faker-js/faker` give us that hardcoded strings don't?"

---

### Phase 7: User Authentication

**Goal:** Understand authentication, password security, and instance methods.

**This phase is the biggest since Phase 3.** Three important concepts land here (`this`, instance methods, `function` vs `=>`). Consider splitting across sessions: model + bcrypt (7a-7b), then passport + endpoints (7c-7e), then tests.

> **Class syntax note:** PLAN.md originally showed `User.prototype.verifyPassword = function() {}` using `sequelize.define`. The student uses `class extends Model` syntax instead. In class syntax, instance methods go inside the class body as regular methods. Both are equivalent — `class` is syntactic sugar over prototypes. The key rule still applies: use regular method syntax (not arrow functions) so `this` refers to the instance. This is worth explaining when introducing instance methods.

| Concept | Likely status | What to do |
|---------|--------------|------------|
| Instance methods | New | "A method on each individual user. `User.findAll()` is on the model class. `user.verifyPassword()` is on ONE specific user. Like 'all dogs bark' vs 'MY dog barks.' In class syntax, instance methods go inside the class body as regular methods — equivalent to `User.prototype.verifyPassword` but cleaner." |
| `this` keyword | New and important | "`this` refers to the specific instance. When you call `user.verifyPassword(pw)`, `this` IS that user. `this.password` is THAT user's hashed password." |
| `function` vs `=>` for `this` | Aha moment | "Arrow functions don't have their own `this`. For instance methods, we NEED `this` to be the user. In class syntax, regular methods (`async verifyPassword()`) work like `function` — they get `this`. An arrow function (`verifyPassword = () => {}`) would break it. Remember Phases 1-2 used `function` everywhere? Now you understand WHY both exist." |
| Salt rounds | New concept | "Hashing is one-way — you can't get the password back. The salt adds randomness so two users with 'hello123' get DIFFERENT hashes." |
| `{ session: false }` | New (API concept) | "Sessions are for browsers with cookies. APIs don't have sessions — each request proves identity independently." |
| Passport `done` callback | New | "`done(err, user, info)` is Node's callback convention — different from Express `(req, res, next)`. First arg is error, second is result (user or `false`), third is extra info. Passport calls YOUR strategy function, you call `done` to tell it the result." |
| Custom callback pattern | New (connects to Phase 4) | "`passport.authenticate('local', opts, cb)(req, res, next)` — a function that returns a function, immediately called. Same higher-order pattern as `validateInput(schema)` from Phase 4, but here we also pass a custom callback to control the response format." |

**Let the student discover:**
- Returning the password hash in the API response (then ask: "Should this be visible?")
- Using arrow function for `verifyPassword` (`this` will be `undefined`)
- Forgetting `await` on `bcrypt.compare` (gets `Promise` instead of `true/false`)
- Trying to sign in before creating a user
- The `done` callback — let the student try `return user` instead of calling `done(null, user)` in the passport strategy and see that passport hangs

**Connect to prior phases:**
- "Remember `validateInput(schema)` from Phase 4? It's a function that returns middleware. `passport.authenticate('local')` does the same thing — returns middleware that checks credentials instead of checking body shape. Same pattern, different purpose."

**Check understanding:**
- "Why do we hash passwords instead of storing them directly?"
- "What happens if you use `=>` for `verifyPassword` instead of `function`?"
- "Why does signup NOT use passport? Why is signin different?"
- "If two users have 'hello123', will their hashes be the same? Why not?"
- "Why `{ session: false }` on `passport.authenticate`?"
- "How is `passport.authenticate('local', { session: false })` similar to `validateInput(schema)`? What pattern do they share?"
- "If you have user1 and user2, and call `user1.verifyPassword('hello')`, which password does it check? Why?"
- "Should passport logic live in the route layer or the business layer? Why might someone argue for either?"

---

## Tools Summary

| Tool | What it does | Phase |
|------|-------------|-------|
| **Express** | HTTP server + routing | 1 |
| **nodemon** | Auto-restart on save | 1 |
| **Express Router** | Split routes into files | 2 |
| **Sequelize** | JS ↔ PostgreSQL mapping (ORM) | 3 |
| **pg** | PostgreSQL driver (used by Sequelize internally) | 3 |
| **sequelize-cli** | Generate models, migrations | 3 |
| **AJV** | Validate requests against JSON Schema | 4 |
| **Docker Compose** | Run PostgreSQL without installing it | 0 |
| **ESLint** | Catches code problems automatically | 5 |
| **eslint-config-airbnb-base** | Airbnb's style rules (Node.js, no React) | 5 |
| **@eslint/eslintrc (FlatCompat)** | Wraps old-format configs for ESLint v9 flat config | 5 |
| **Husky** | Git hooks — blocks bad commits | 5 |
| **Mocha** | Runs test files, reports pass/fail | 6 |
| **expect** | Jest-style assertions (`toBe`, `toEqual`) | 6 |
| **supertest** | HTTP requests to Express app without a running server | 6 |
| **@faker-js/faker** | Generates realistic fake data for tests | 6 |
| **bcrypt** | Hashes passwords (irreversible) | 7 |
| **passport** | Authentication framework (strategy pattern) | 7 |
| **passport-local** | Email + password authentication strategy | 7 |
