# Lesson 04: Sessions vs Stateless APIs — Why `{ session: false }`

**Date:** 2026-02-09
**Phase:** 7c-7e (Passport authentication)
**Prior knowledge:** Student knows HTTP requests, Express middleware, API endpoints. Does NOT have clear mental model for sessions.

---

## Concepts Covered

### Browser Apps (with sessions)

1. User logs in via a form
2. Server creates a **session** (a record saying "this user is logged in") and sends a **cookie**
3. Browser automatically sends that cookie with every future request
4. Server reads the cookie, finds the session, knows who the user is
5. User never logs in again until the session expires

### APIs (stateless, no sessions)

1. APIs serve JSON to mobile apps, other backends, frontend SPAs
2. These clients don't use browser cookies
3. Each request includes credentials (or later, a JWT token) to prove identity
4. The server **doesn't remember** anything between requests — verifies each one independently
5. `{ session: false }` tells Passport: "don't try to save user info in a session"

### The Connection

Both answers the student considered were partially right:
- "APIs are stateless" — correct, each request is independent
- "Sessions are for browsers" — correct, cookies are a browser mechanism

These are two sides of the same coin. APIs skip sessions because their clients don't use cookies.

---

## Questions & Student Responses

**Q: Why would an API skip sessions?**
A: "Not sure" — honest response.

After the explanation, the student understood the browser/API distinction. The concept of "stateless" clicked when framed as "the server doesn't remember anything between requests."

---

## Key Takeaway

`{ session: false }` is not just a Passport config option — it reflects a fundamental architectural choice: this API is stateless. Later (Phase 8 with JWT), the student will see how tokens replace sessions for APIs.
