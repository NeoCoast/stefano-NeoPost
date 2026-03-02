# 13 — TypeScript Express & Middleware Types

**Date:** 2026-03-02
**Concept:** Express types (Request, Response, NextFunction), declaration merging, Express 5 params, higher-order function types, Passport strategy types

---

## What was taught

### Express Types

Express provides three core types for middleware and route handlers:

```typescript
import type { Request, Response, NextFunction } from 'express';

router.post('/signup', async (req: Request, res: Response) => {
  // req.body, req.params, req.query — all typed
  // res.status(), res.json(), res.send() — all typed
});
```

- **`Request`** — the incoming HTTP request (`.body`, `.params`, `.query`, `.user`)
- **`Response`** — the outgoing response (`.status()`, `.json()`, `.send()`)
- **`NextFunction`** — passes control to the next middleware in the chain

### Express 5 Params

Express 5 is stricter with types than Express 4. In Express 5, `req.params` values are typed as `string | string[]` (a param could be a single value or an array), not just `string`:

```typescript
// Express 4: req.params.id is string
// Express 5: req.params.id is string | string[]

// Fix: wrap with String() to satisfy TypeScript
const id = BigInt(String(req.params.id));
```

This was caught by `tsc` during final type checking. The code worked at runtime (params are always strings for single `:id` patterns), but TypeScript can't prove that — Express 5 types account for edge cases like `/users/:id+` which could match multiple segments.

### `declare global` — Declaration Merging

Passport attaches a `user` property to `req` after authentication, but Express's `Request` type doesn't know about it. Declaration merging lets us extend Express's types globally:

```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface User {
      id: bigint;
      email: string;
      username: string;
      birthday: Date | null;
      password: string;
      confirmed: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}
export {};
```

Now `req.user` is typed everywhere — TypeScript knows it's an object with `id`, `email`, etc. The `export {}` makes the file a module (required for `declare global` to work).

Rails comparison: like monkey-patching a class to add methods, but done at the type level. In Ruby you'd open a class; in TypeScript you open an interface.

### Higher-Order Function Types

The validation middleware is a function that returns a function:

```typescript
import Ajv, { type Schema } from 'ajv';

const ajv = new Ajv();

export const validateInput = (schema: Schema) => {
  const validate = ajv.compile(schema);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req.body)) {
      res.status(400).json({ errors: validate.errors });
      return;
    }
    next();
  };
};
```

TypeScript infers the return type automatically — a function that takes `(Request, Response, NextFunction)` and returns `void`. The `Schema` type comes from AJV's own type definitions.

This is the same pattern from Phase 4, now with full type annotations. The outer function configures the validator; the inner function is the Express middleware.

### Passport Strategy Types

Passport strategies have specific type signatures. During migration, `tsc` caught two issues:

**1. `passport-local` import:**
```typescript
// Wrong — @types/passport-local exports Strategy as named, not default
import LocalStrategy from 'passport-local';

// Correct
import { Strategy as LocalStrategy, type IVerifyOptions } from 'passport-local';
```

**2. `done` callback type:**
```typescript
// The done callback in passport-local needs explicit typing in strict mode
async (
  email: string,
  password: string,
  done: (error: unknown, user?: Express.User | false, options?: IVerifyOptions) => void
) => {
  // ...
  return done(null, user);
}
```

The `done` callback follows Node's error-first convention: first arg is error (or null), second is the result. TypeScript needs to know the exact signature because strict mode doesn't allow implicit `any`.

### Passport JWT Strategy

```typescript
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
    audience: 'api',
  },
  async (payload: { userId: number }, done) => {
    const user = await userDataAccess.findById(BigInt(payload.userId));
    if (!user) return done(null, false);
    return done(null, user);
  },
));
```

The `payload` parameter is typed as `{ userId: number }` — matching what we sign in `generateAuthToken`. TypeScript ensures the payload shape matches between signing and verification.

---

## Questions asked and responses

No specific understanding-check questions for Express types — the concepts built on prior understanding of Express middleware (Phase 4) and Passport (Phase 7). The type errors caught by `tsc` served as natural teaching moments.

---

## Key insight

The four type errors caught by `tsc` during final migration cleanup were the best demonstration of TypeScript's value. Every error was code that worked at runtime but had assumptions TypeScript couldn't verify:
1. Import syntax that didn't match the library's type exports
2. Callback parameters TypeScript couldn't infer
3. Discriminated union narrowing that wasn't complete
4. Express 5 params that could theoretically be arrays

None were bugs — they were TypeScript doing its job: catching assumptions that work in practice but aren't provably safe.

---

## Sources

- [Express TypeScript guide](https://expressjs.com/en/5x/api.html)
- [@types/passport-local](https://www.npmjs.com/package/@types/passport-local)
- [@types/passport-jwt](https://www.npmjs.com/package/@types/passport-jwt)
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
