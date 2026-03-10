# 15 — Import Organization & Path Aliases

**Date:** 2026-03-03
**Context:** Code review feedback on the `refactor/typescript-migration` branch

---

## Concepts Covered

### 1. Import Organization by Origin

**Problem:** When imports from npm packages and your own project files are mixed together, it's hard to quickly see what external dependencies a file uses.

**Convention:** Group imports into blocks separated by blank lines:
1. External packages (from `node_modules`)
2. *(blank line)*
3. Internal imports (your own project files)

**Before:**
```typescript
import { Router } from 'express';
import passport from '../middlewares/passport';
import { RESULT_CODES } from '../utils/constants';
```

**After:**
```typescript
import { Router } from 'express';

import passport from '@/middlewares/passport';
import { RESULT_CODES } from '@/utils/constants';
```

**Rails parallel:** Same as putting `require 'bcrypt'` (gems) before `require_relative` (own files).

### 2. Path Aliases (`@/` prefix)

**Problem:** Relative imports (`../../src/services/jwt`) are hard to read, fragile when moving files, and inconsistent across different directory depths.

**Solution:** Configure a path alias in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- `baseUrl: "."` — resolve from project root
- `@/*` maps to `src/*` — so `@/services/jwt` resolves to `src/services/jwt`
- The `@` has no special meaning to TypeScript — it's a community convention
- `tsx` v4.x reads `tsconfig.json` and resolves these aliases at runtime automatically

**Key distinction:** `@prisma/client` is a scoped npm package (`@org/package`), while `@/utils/constants` is your path alias (`@/path`). The `/` immediately after `@` distinguishes them visually.

**Benefit:** The import path is always the same regardless of where the importing file lives:
```typescript
// From src/routes/ OR test/routes/ — same import
import { RESULT_CODES } from '@/utils/constants';
```

---

## Student Responses

- Correctly identified the gems-first-then-own-files convention from Ruby as analogous to the import organization pattern
- Was unfamiliar with how `@/` maps to `src/` — needed the mapping table explanation
- Correctly identified `express` as external and `@/utils/constants` as internal when tested

---

## Sources

- [Better Stack: Getting Started with TSX](https://betterstack.com/community/guides/scaling-nodejs/tsx-explained/) — confirms tsx respects tsconfig.json paths
- [TypeScript docs: tsconfig paths](https://www.typescriptlang.org/tsconfig/#paths)
