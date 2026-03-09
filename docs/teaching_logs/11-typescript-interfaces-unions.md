# 11 — Interfaces, Discriminated Unions & Type Narrowing

**Date:** 2026-03-02
**Concept:** Custom interfaces, `as const`, discriminated unions, `BusinessResult<T>`, type narrowing, `Exclude<>`

---

## What was taught

### `interface` — Describing Object Shapes

```typescript
interface SignupInput {
  email: string;
  username: string;
  password: string;
  birthday?: string; // ? means optional
}
```

An interface describes what fields an object must have and their types. The `?` makes a field optional — it can be present or absent. TypeScript enforces this shape: pass an object missing `email` and you get a compile error.

Rails comparison: like a schema definition, but enforced at compile time instead of runtime validation.

### `as const` — Literal Types

```typescript
const RESULT_CODES = {
  SUCCESS: 'SUCCESS',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  FORBIDDEN: 'FORBIDDEN',
  EDIT_WINDOW_EXPIRED: 'EDIT_WINDOW_EXPIRED',
  ERROR: 'ERROR',
} as const;
```

Without `as const`: `RESULT_CODES.SUCCESS` has type `string` — TypeScript only knows it's some string.
With `as const`: `RESULT_CODES.SUCCESS` has type `'SUCCESS'` — TypeScript knows the **exact value**.

This matters for discriminated unions — TypeScript can narrow based on exact values, not just "some string."

### `typeof` + `keyof` — Deriving Types

```typescript
type ResultCode = typeof RESULT_CODES[keyof typeof RESULT_CODES];
// Result: 'SUCCESS' | 'NOT_FOUND' | 'ALREADY_EXISTS' | ...
```

Instead of manually listing all possible values (which gets out of sync when you add a new code), derive the type from the object itself. Reading right to left:

1. `typeof RESULT_CODES` → the type of the object (`{ SUCCESS: 'SUCCESS', NOT_FOUND: 'NOT_FOUND', ... }`)
2. `keyof typeof RESULT_CODES` → the keys (`'SUCCESS' | 'NOT_FOUND' | ...`)
3. Index into it → the values (`'SUCCESS' | 'NOT_FOUND' | ...`)

Add a new result code to the object → the type updates automatically.

### Discriminated Unions

A discriminated union is a type where each variant has a unique "tag" field. TypeScript uses the tag to determine which variant you're working with:

```typescript
type BusinessResult<T> =
  | { code: 'SUCCESS'; data: T }
  | { code: 'ERROR'; data: unknown }
  | { code: Exclude<ResultCode, 'SUCCESS' | 'ERROR'>; data: null };
```

The "discriminant" is the `code` field — its literal type tells TypeScript which branch you're in.

### Type Narrowing

TypeScript narrows the type as you check the discriminant:

```typescript
if (result.code === 'SUCCESS') {
  result.data.title; // ✅ TypeScript knows data is T (e.g., Post)
}
if (result.code === 'NOT_FOUND') {
  result.data.title; // ❌ TypeScript knows data is null
}
```

In the route layer, we use this pattern with early returns:

```typescript
if (result.code === RESULT_CODES.NOT_FOUND) {
  res.status(404).json({ message: 'Post not found' });
  return;
}
// After this point, TypeScript knows result.code could be SUCCESS, ERROR, etc.

if (result.code !== RESULT_CODES.SUCCESS) {
  res.status(500).json({ message: 'Error' });
  return;
}
// Now TypeScript knows result.code === 'SUCCESS', so result.data is T
const post = result.data; // ✅ fully typed
```

**Important discovery during migration:** checking `=== RESULT_CODES.ERROR` doesn't narrow enough — there are other non-success codes. You need `!== RESULT_CODES.SUCCESS` to tell TypeScript "only the SUCCESS branch remains." This was caught by `tsc` during final type checking.

### `Exclude<>` Utility Type

```typescript
Exclude<ResultCode, 'SUCCESS' | 'ERROR'>
// = 'NOT_FOUND' | 'ALREADY_EXISTS' | 'FORBIDDEN' | 'EDIT_WINDOW_EXPIRED'
```

"All ResultCodes except SUCCESS and ERROR." This groups the non-success/error codes together because they all share the same behavior: `data: null`.

---

## Questions asked and responses

**Understanding check about generics and discriminated unions:**
Student confirmed the concepts made sense. The idea that `<T>` is a placeholder that gets replaced (like `BusinessResult<Post>` gives `data: Post`) clicked immediately.

---

## Key insight

The `tsc` error about `result.data` being possibly null was a real-world demonstration of discriminated unions in action. The code worked at runtime (JavaScript doesn't care about types), but TypeScript proved the logic wasn't airtight. Changing `=== ERROR` to `!== SUCCESS` made the narrowing complete — a better pattern that also handles any future result codes.

---

## Sources

- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook — Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [TypeScript Handbook — Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
