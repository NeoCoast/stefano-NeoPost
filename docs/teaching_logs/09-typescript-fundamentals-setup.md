# 09 — TypeScript Fundamentals & Setup

**Date:** 2026-03-02
**Concept:** What TypeScript is, toolchain (tsc, tsx, @types), tsconfig.json, strict mode, ES modules

---

## What was taught

### What is TypeScript?

TypeScript adds **type annotations** to JavaScript. You tell the compiler "this parameter is a string, this function returns a Promise of boolean." If you accidentally pass the wrong type, TypeScript catches it **before your code runs** — not when a user hits the bug in production.

TypeScript doesn't change runtime behavior. It's a **superset** of JavaScript: all JS is valid TS. The types get erased before execution.

Rails comparison: Ruby has no compile-time types — errors show up at runtime. TypeScript gives you the safety you'd get from a language like Java, but with JavaScript's flexibility.

### The Toolchain

Three key pieces:

- **`tsc`** — the TypeScript compiler. Checks types. With `--noEmit`, it only checks — doesn't produce output files. We use this for CI: `tsc --noEmit` verifies the entire codebase typechecks.
- **`tsx`** — a runtime that executes `.ts` files directly by stripping types at runtime. Replaces `nodemon` + `node` for development. Fast feedback loop without a separate compile step.
- **`@types/*`** — community-maintained type definitions for JS libraries that don't include their own (Express, bcrypt, jsonwebtoken, etc.). Prisma generates its own types, so no `@types/prisma` needed.

### tsconfig.json

Key options we chose and why:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "test/**/*"]
}
```

- **`strict: true`** — enables all strict type checks at once. We learn TypeScript properly from day one — no `any` shortcuts.
- **`module: "ESNext"`** — modern ES module syntax (`import`/`export`). Industry standard for new TypeScript projects.
- **`moduleResolution: "Bundler"`** — tells TypeScript how to find imported files. Bundler mode matches how `tsx` resolves imports.
- **`noEmit: true`** — `tsc` only type-checks, never produces output files. We use `tsx` to run code directly.
- **`esModuleInterop: true`** — allows `import express from 'express'` instead of `import * as express from 'express'` for CommonJS packages.

### ES Modules vs CommonJS

The codebase migrated from CommonJS to ES modules:

```javascript
// CommonJS (old)
const express = require('express');
module.exports = router;

// ES modules (new)
import express from 'express';
export default router;
```

ES modules are the modern standard — what browsers use natively. `import` is statically analyzed (the compiler knows what you're importing at build time), while `require` is a runtime function call (anything could happen).

### CJS/ESM Interop Discovery

During migration, we discovered a real-world interop issue. Tests were still in CommonJS while source files were being converted to TypeScript with ES module syntax. `tsx` handles this interop, but with a catch:

- **Named exports** (`export const prisma`) → `require()` returns `{ prisma }` — works naturally.
- **Default exports** (`export default prisma`) → `require()` returns `{ default: prisma }` — the value is wrapped.

This is correct per the ES module spec: `export default` is technically a named export called `"default"`. During migration, we added temporary named re-exports as bridges (`export { prisma }`), then removed them once all consumers were converted to `import`.

### Basic Type Annotations

```typescript
// Function parameters and return type
const verifyPassword = async (hashedPassword: string, plainPassword: string): Promise<boolean> => (
  bcrypt.compare(plainPassword, hashedPassword)
);
```

Every parameter gets a type. The return type (`Promise<boolean>`) tells callers exactly what they'll get back. TypeScript can often infer the return type, but being explicit makes the contract clear.

---

## Questions asked and responses

**Understanding check about TypeScript, tsc, and tsx:**
Student confirmed it made sense — the mental model of "types exist at write time, get erased at runtime" landed clearly. The distinction between `tsc` (type checker) and `tsx` (runtime) was understood.

---

## Key insight

The CJS/ESM interop discovery was a real teaching moment. The migration plan assumed `tsx` handles everything automatically, but `export default` needed special handling. This taught that migration is never purely mechanical — edge cases surface that the plan didn't predict.

---

## Sources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [tsx](https://tsx.is/) — TypeScript execute
- [Node.js ES module interop](https://nodejs.org/api/esm.html#interoperability-with-commonjs)
