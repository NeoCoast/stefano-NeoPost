# 06 — JWT Authentication

**Date:** 2026-02-19
**Concept:** JSON Web Tokens — anatomy, signing, audience, stateless auth

---

## What was taught

JWT is the standard format for stateless authentication tokens. A JWT is a self-contained string that encodes who the user is and what they're allowed to do — the server doesn't need a database lookup to verify it (the signature does that).

### The three parts

A JWT looks like: `eyJhbGc...header.eyJ1c2Vy...payload.SflKxw...signature`

- **Header** — algorithm used (HS256)
- **Payload** — claims: `userId`, `aud`, `exp`, `iat`
- **Signature** — HMAC of `header.payload` using the secret key

The header and payload are base64-encoded, not encrypted. Anyone can decode them. The signature is what makes them trustworthy — you can't fake it without the secret.

### `jsonwebtoken` API

```js
jwt.sign(payload, secret, options)   // create a token
jwt.verify(token, secret, options)   // verify + return payload (throws on failure)
jwt.decode(token)                    // decode without verifying (no secret needed)
```

### The `aud` (audience) claim

`aud` scopes a token to a specific purpose. A token signed with `audience: 'email-confirmation'` will throw when verified with `audience: 'api'`. This prevents someone from using a confirmation link as an auth token.

We generate two kinds:
- `generateAuthToken(userId)` — `aud: 'api'`, expires in 24h
- `generateConfirmationToken(userId)` — `aud: 'email-confirmation'`, expires in 24h

### Why stateless?

Sessions store identity server-side — every request needs a DB lookup to find the session. JWTs encode identity in the token itself — the server just verifies the signature. No DB needed per request. This makes horizontal scaling simpler (any server can verify any token without sharing session state).

---

## Questions asked and responses

**"If someone decodes a JWT (no secret needed — it's just base64), can they see the payload? Is that a problem?"**
Student understood: yes, anyone can see the payload — it's not encrypted. The problem depends on what's in it. We put `userId`, not passwords or sensitive data, so it's fine. But you wouldn't put a credit card number in a JWT payload.

**"What's the difference between encoding and encrypting?"**
Encoding (base64) is reversible without a key — it's for transport format, not security. Encryption requires a key to reverse. JWT uses encoding for the payload and a signature (HMAC) for integrity — not encryption.

**"What would happen if you committed your JWT_SECRET to GitHub?"**
Anyone who finds the secret can forge tokens with any payload — e.g., `{ userId: 1, aud: 'api' }` to impersonate any user.

**"What's the difference between jwt.verify and jwt.decode?"**
`decode` — just reads the payload, no verification. `verify` — checks the signature and throws on mismatch, expiry, or wrong audience. Always use `verify` in production paths.

---

## Key insight

The student correctly identified that audience mismatch throws (not returns null) on first try — understanding that `jwt.verify` is exception-based, not result-code-based.

---

## Sources

- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)
- [jwt.io](https://jwt.io) — JWT debugger and anatomy
- [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) — JWT standard
