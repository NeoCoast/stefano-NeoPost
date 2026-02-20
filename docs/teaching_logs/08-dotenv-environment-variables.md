# 08 — dotenv and Environment Variables

**Date:** 2026-02-19
**Concept:** Environment variables, dotenv, `.env` / `.env.example` pattern

---

## What was taught

Environment variables are values passed to a process from its environment — the shell or hosting platform — rather than hardcoded in the source code. In Node.js, they're available at `process.env.VARIABLE_NAME`.

### Why env vars?

Three problems they solve:
1. **Secrets out of code** — `JWT_SECRET`, `SMTP_PASS` would be visible in version control if hardcoded
2. **Different values per environment** — dev uses Ethereal, prod uses Brevo; dev uses a local DB, prod uses a hosted one
3. **Easy rotation** — update the value in one place without touching code

Rails comparison: like `config/credentials.yml.enc` but simpler — no encryption, just gitignored. Or like Rails' `ENV['SECRET_KEY_BASE']`.

### dotenv

`dotenv` reads a `.env` file and loads its contents into `process.env`. It's only needed in development — in production, the hosting platform injects env vars directly.

```js
require('dotenv').config(); // must be the FIRST line, before any other require
```

Why first? Because `require('dotenv').config()` populates `process.env`. Any file required after it can access those values. If you load it after requiring other modules, those modules might already have tried to read `process.env.JWT_SECRET` and gotten `undefined`.

### `.env` vs `.env.example`

| File | Gitignored | Contains |
|------|-----------|---------|
| `.env` | Yes | Real secrets (never commit) |
| `.env.example` | No | Variable names with empty/placeholder values |

`.env.example` tells other developers (and future-you): "these are the variables you need to set up." They copy it to `.env` and fill in real values.

### What happens if you commit JWT_SECRET to GitHub?

Anyone who finds the repo (or crawls GitHub) can forge tokens with any payload — `{ userId: 1, aud: 'api' }` — and authenticate as any user. Secrets in code can be found in git history even after deletion.

---

## Questions asked and responses

**"What would happen if you committed your JWT_SECRET to GitHub?"**
Student correctly identified the risk: "anyone can create tokens and impersonate users." Also understood that deleting the file doesn't remove it from git history — rotation (changing the secret) is the only fix.

**"Why does dotenv need to be the first require?"**
Student initially wasn't sure. After explanation, they understood: modules read `process.env` when they load. dotenv needs to populate it before any other module tries to read from it.

---

## Key insight

The student made the connection to Rails' credentials system immediately. The key difference they noted: dotenv is plaintext (gitignored for security), while Rails encrypts credentials and can safely commit the file.

---

## Sources

- [dotenv npm](https://www.npmjs.com/package/dotenv)
- [12-Factor App: Config](https://12factor.net/config) — the principle behind env vars for config
