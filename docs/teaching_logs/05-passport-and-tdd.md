# Lesson 05: Passport Architecture and TDD Cycle

**Date:** 2026-02-09
**Phase:** 7c-7e (Passport authentication)
**Prior knowledge:** Student knows Express middleware pattern from Phase 4 (`validateInput(schema)`). Knows Mocha test structure from Phase 6.

---

## Concepts Covered

### Passport's Strategy Pattern

Passport itself is just a framework — it doesn't know HOW to authenticate. **Strategies** are plugins:

- `passport-local` — email + password (what we use)
- `passport-google-oauth20` — Google login
- `passport-jwt` — JSON Web Tokens (Phase 8)

The flow:
```
POST /signin → AJV validation → passport.authenticate('local') → route handler
                                        ↓
                               LocalStrategy runs:
                               1. Find user by email (dataaccess)
                               2. Call verifyPassword()
                               3. Pass user to route (or fail with 401)
```

### Connection to Phase 4: Higher-Order Functions

`passport.authenticate('local', { session: false })` returns middleware — exactly like `validateInput(schema)` from Phase 4. Same pattern, different purpose:

| Phase 4 | Phase 7 |
|---------|---------|
| `validateInput(schema)` → returns middleware | `passport.authenticate('local', opts)` → returns middleware |
| Checks request body shape | Checks user credentials |
| Returns 400 on failure | Returns 401 on failure |

### Custom Callback Pattern

Default Passport returns plain text `"Unauthorized"` on failure. Our API returns JSON everywhere. The custom callback pattern:

```js
passport.authenticate('local', { session: false }, (err, user) => {
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  // ...
})(req, res, next);  // IIFE — immediately invoked
```

The `(req, res, next)` at the end is an IIFE (Immediately Invoked Function Expression) — `passport.authenticate` returns a function, and we call it right away. Same higher-order pattern, just with an extra step.

### Why Passport Bypasses the Business Layer

An architectural exception: the LocalStrategy calls `userDataAccess.findByEmail()` directly instead of going through `business/user.js`. This is because:
- Authentication is a **middleware concern** (happens before the route handler)
- The business layer's job is signup logic (duplicate checks, hashing)
- Signin doesn't need business rules — just credential verification

### `usernameField: 'email'`

By default, Passport's LocalStrategy expects a field called `username`. Since we authenticate with email, we tell it: `{ usernameField: 'email' }`.

### TDD Cycle: Red → Green → Refactor

The signin feature was built using TDD:

1. **Red:** Wrote 4 signin tests (200, 401, 401, 400) — all failed with `404` because the route didn't exist
2. **Green:** Implemented passport strategy, route, schema — all 15 tests passed
3. **Refactor:** (minimal — code was clean from the start)

The student explicitly requested TDD going forward. The value: seeing the tests fail for the *right reason* (404 = route missing) confirms the tests are actually testing the right thing.

### Lint Teaching: `global-require`

`require('bcrypt')` inside the `verifyPassword` function body triggered ESLint's `global-require` rule. Fix: move `require` to the top of the file (module level).

**Why:** Node.js caches `require` calls, so putting it inside a function isn't a performance issue. But the convention is top-level requires for readability — a reader should see all dependencies at the top of the file.

---

## Questions & Student Responses

No explicit Q&A for Passport — the student absorbed the explanation and moved straight to requesting TDD implementation. The connection to Phase 4's higher-order function pattern was presented but not probed with a question (could be revisited).

---

## Key Takeaways

1. Passport is a **pluggable** system — strategies are interchangeable. Switching from local to JWT later only changes the strategy, not the route structure.
2. The custom callback pattern (IIFE) gives you control over the response format — essential for JSON APIs.
3. TDD makes the "what should happen" visible before writing "how it happens."
