# 10 — TypeScript & Prisma Types

**Date:** 2026-03-02
**Concept:** Prisma-generated types, nullability, `import type`, typed data access layer

---

## What was taught

### Prisma Generates Its Own Types

Unlike Express or bcrypt (which need `@types/*` packages), Prisma generates types automatically from your schema. After `npx prisma generate`, you get TypeScript types that exactly match your database schema:

```typescript
import type { User, Post } from '@prisma/client';
```

`User` has every field from the `user` table: `id: bigint`, `email: string`, `password: string`, `confirmed: boolean`, `createdAt: Date`, etc. If you change the Prisma schema and regenerate, the types update automatically — no manual sync needed.

Rails comparison: like if ActiveRecord models automatically generated type definitions. In Ruby you just trust the schema; in TypeScript the schema becomes enforceable at compile time.

### `import type`

```typescript
import type { User, Post, Prisma } from '@prisma/client';
```

The `type` keyword means "only import this for type checking — don't include it in runtime code." Types get erased during compilation, so this makes it explicit: we're importing a shape, not a value.

You can mix type-only and value imports. If you need the `PrismaClient` constructor (a value), that's a regular import. If you only need `User` for annotations, use `import type`.

### Nullability

Prisma queries that might not find a row return `T | null`:

```typescript
export const findByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};
```

TypeScript forces you to handle the `null` case. You can't call `user.email` on `User | null` — the compiler says "this might be null, check first." This catches a whole category of bugs that Ruby silently passes through (`undefined method 'email' for nil:NilClass`).

### Prisma Input Types

For creating records, Prisma generates input types:

```typescript
import type { Prisma } from '@prisma/client';

export const create = async (data: Prisma.UserCreateInput): Promise<User> => {
  return prisma.user.create({ data });
};
```

`Prisma.UserCreateInput` knows which fields are required, which are optional, and which have defaults. If you try to create a user without `email`, TypeScript catches it at compile time — not at runtime with a database error.

For posts, we used `Prisma.PostUncheckedCreateInput` because we pass raw `userId` (a foreign key) rather than a Prisma `connect` relation:

```typescript
export const create = async (data: Prisma.PostUncheckedCreateInput): Promise<Post> => {
  return prisma.post.create({ data });
};
```

### Typed Data Access Layer

The complete pattern for a data access function:

```typescript
import type { User, Prisma } from '@prisma/client';
import prisma from '../db/prisma';

export const findById = async (id: bigint): Promise<User | null> => {
  return prisma.user.findFirst({ where: { id } });
};

export const create = async (data: Prisma.UserCreateInput): Promise<User> => {
  return prisma.user.create({ data });
};
```

Every function clearly states: what goes in, what comes out. Anyone reading the code knows the contract without looking at the implementation.

---

## Questions asked and responses

No specific understanding-check questions were asked during data access conversion — the student was already comfortable with Prisma from prior phases and the type additions were natural extensions.

---

## Key insight

Prisma is one of the best TypeScript experiences because the types are auto-generated from the schema. No manual type definitions needed, no risk of types getting out of sync with the database. This is the ideal: the source of truth (the schema) generates the types.

---

## Sources

- [Prisma TypeScript docs](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)
- [Prisma generated types](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client)
