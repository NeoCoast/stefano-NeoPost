# 12 — Generics & Library Type Definitions

**Date:** 2026-03-02
**Concept:** Generics (`<T>`), `unknown` vs `any`, `@types/*` packages, type assertions, non-null assertions, `Awaited<ReturnType<typeof fn>>`

---

## What was taught

### Generics (`<T>`)

A generic is a type placeholder. You define it once, use it with different concrete types:

```typescript
type BusinessResult<T> =
  | { code: 'SUCCESS'; data: T }
  | { code: 'ERROR'; data: unknown }
  | { code: Exclude<ResultCode, 'SUCCESS' | 'ERROR'>; data: null };
```

`<T>` says "I don't know what type `data` will be yet — the caller decides."

```typescript
BusinessResult<Post>   → SUCCESS branch has data: Post
BusinessResult<User>   → SUCCESS branch has data: User
BusinessResult<{ message: string }> → SUCCESS branch has data: { message: string }
```

One type definition, many uses. The same pattern appears everywhere in TypeScript:
- `Promise<boolean>` — "a Promise that contains a boolean"
- `Array<string>` — "an array of strings"
- `Map<string, User>` — "a map from strings to Users"

### `unknown` vs `any`

Both mean "could be anything," but they're fundamentally different:

- **`any`** — turns off type checking. You can do anything with it, TypeScript won't complain. This defeats the purpose of TypeScript.
- **`unknown`** — type-safe "I don't know." You must check the type before using it. TypeScript forces you to narrow it first.

```typescript
// ERROR branch uses unknown — we don't know what the error is
{ code: 'ERROR'; data: unknown }

// To use it, you must check:
if (result.code === 'ERROR') {
  // result.data is unknown — can't call .message on it
  // Must check: if (result.data instanceof Error) { result.data.message }
}
```

Our no-`any` policy: never use `any` as a shortcut. Learn the proper type for every situation. `unknown` is the type-safe alternative when you genuinely don't know.

### `@types/*` Packages

Many JavaScript libraries (written before TypeScript existed) don't include type definitions. The community maintains them in the `@types` namespace:

```
@types/express      → types for Express
@types/bcrypt       → types for bcrypt
@types/jsonwebtoken → types for jsonwebtoken
@types/nodemailer   → types for nodemailer
@types/passport     → types for passport
```

When you `import express from 'express'`, TypeScript looks for types in `@types/express`. These tell TypeScript what functions exist, what parameters they take, and what they return.

Not all libraries need them — Prisma generates its own types, and many modern libraries ship types built-in.

### Non-null Assertion `!`

```typescript
process.env.JWT_SECRET!
req.user!
```

The `!` tells TypeScript "I know this isn't null/undefined." Use sparingly — you're overriding the compiler's safety check. Appropriate when you have external guarantees:
- `process.env.JWT_SECRET!` — you've verified the env var is loaded (dotenv runs first)
- `req.user!` — the `authenticate` middleware guarantees user exists

### Type Assertion `as`

```typescript
const decoded = jwt.decode(token) as jwt.JwtPayload;
req.body as SignupInput;
```

"Treat this value as this type." Safe when you have external validation:
- `req.body as SignupInput` — AJV already validated the body matches the schema
- `jwt.decode(token) as JwtPayload` — you know the token structure

Both `!` and `as` are escape hatches. They're necessary sometimes, but each one is a spot where you're telling TypeScript "trust me" — if you're wrong, you get a runtime error.

### `interface extends`

```typescript
interface TokenPayload extends jwt.JwtPayload {
  userId: number;
}
```

Builds on an existing type — `TokenPayload` has everything `JwtPayload` has (`aud`, `exp`, `iat`), plus `userId`. This is how you extend library types with your application-specific fields.

### `Awaited<ReturnType<typeof fn>>`

```typescript
let user: Awaited<ReturnType<typeof prisma.user.findFirst>>;
// Equivalent to: User | null
```

Derives a type from a function's return value, reading inside out:
1. `typeof prisma.user.findFirst` → the function's type
2. `ReturnType<...>` → what the function returns (`Promise<User | null>`)
3. `Awaited<...>` → unwrap the Promise (`User | null`)

Used in tests to declare variables with the exact type a query returns. Stays in sync if the underlying function changes.

---

## Questions asked and responses

No specific understanding-check questions for this topic — the concepts were introduced alongside the services layer (JWT, email) and the student engaged with them through the code walkthrough.

---

## Key insight

The `!` and `as` assertions create a clear contract: "something external guarantees this." In our codebase, AJV validates bodies (so `as SignupInput` is safe), middleware guarantees `req.user` (so `!` is safe), and dotenv loads env vars (so `process.env.JWT_SECRET!` is safe). The assertions document these guarantees in the type system.

---

## Sources

- [TypeScript Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook — Type Assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [DefinitelyTyped (@types)](https://github.com/DefinitelyTyped/DefinitelyTyped)
