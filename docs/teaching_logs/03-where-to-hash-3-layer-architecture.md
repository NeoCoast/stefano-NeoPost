# Lesson 03: Where Does Password Hashing Belong in 3-Layer Architecture?

**Date:** 2026-02-09
**Phase:** 7b (bcrypt integration)
**Prior knowledge:** Student knows 3-layer architecture (routes → business → dataaccess) from Phase 2. Knows bcrypt hashing from Lesson 01.

---

## Concepts Covered

### The Decision: Which Layer Hashes the Password?

Four options were presented:
1. **Route layer** — hash as soon as the request arrives
2. **Business layer** — hash in the signup function before calling dataaccess
3. **DataAccess layer** — hash right before the database call
4. **Model hook** — Sequelize `beforeCreate` hook on User model (automatic)

### Why Business Layer Wins

- **Routes** handle HTTP concerns only (status codes, request/response format). Hashing is a *business rule*, not an HTTP concern.
- **DataAccess** is a "dumb" passthrough — it stores what it's given, doesn't transform data.
- **Model hook** (the Rails approach — `has_secure_password` does this) works, but **hides** the hashing. In a 3-layer architecture, business logic should be *visible* in the business layer. Someone reading `business/user.js` should see the full signup flow.
- **Business layer** is where rules about HOW data is processed live. Hashing a password is a business decision.

### Lint Teaching Moment: `no-param-reassign`

The first implementation mutated the input parameter directly:
```js
data.password = await bcrypt.hash(data.password, 10);
```

ESLint's `no-param-reassign` rule flagged this. The fix uses the spread operator to create a new object:
```js
const hashedPassword = await bcrypt.hash(data.password, 10);
const user = await userDataAccess.create({ ...data, password: hashedPassword });
```

**Why the rule exists:** Mutating function parameters can surprise callers who don't expect their data to change. Creating a copy is safer and more predictable.

---

## Questions & Student Responses

**Q: Which layer should call `bcrypt.hash()` before saving the user?**
A: "Business layer" — **correct immediately**.

The student's 3-layer mental model is solid. They instinctively placed hashing in the business layer without hesitation.

---

## Key Takeaway

The 3-layer architecture isn't just about file organization — it's about *where decisions live*. Each layer has a responsibility boundary, and crossing it (even for convenience) undermines the whole pattern.
