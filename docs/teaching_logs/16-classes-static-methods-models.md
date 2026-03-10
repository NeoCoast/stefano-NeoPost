# 16 — Classes with Static Methods (Models)

**Date:** 2026-03-06
**Concept:** Using classes with static methods to organize data access layers (Models)

## Context

Migrating from function-based `dataaccess/` files (named exports) to class-based `models/` files (static methods). Both approaches provide a namespace for grouping related functions — the question is why prefer classes.

## Key Explanations

### Named exports vs static class methods

Both give you a namespace:
- `import * as userDataAccess` → `userDataAccess.findByEmail()`
- `import UserModel` → `UserModel.findByEmail()`

The class adds:

1. **`private` members** — named exports are all public. Classes can hide internals (`private static someHelper()`). Demonstrated later with `EmailService.transporterPromise`.
2. **Inheritance** — `class UserModel extends BaseModel` for shared behavior (soft-delete, timestamps). Not possible with standalone functions without manual composition.
3. **Industry pattern** — TypeScript Express/NestJS codebases use classes for models, services, controllers. Same as Rails: `User.find_by_email` not `find_by_email` as a standalone function.

### Static-only class = namespace (for now)

With only static methods, you never call `new UserModel()`. The class is a namespace today. But the class structure makes it easy to add `private`, inheritance, or decorators later without refactoring. It's a "namespace with growth potential."

## Student Responses

- Correctly identified that classes give more features (constructors, inheritance, private members)
- When asked whether a static-only class is "just a namespace" or "already different" — answered "both are true": namespace now, but class structure enables future features
- Solid grasp of the spectrum from "just organization" to "real OOP features"

## Connection to Prior Knowledge

- `static` keyword from TypeScript lessons (log 09)
- Rails `User.find_by(email:)` as mental model for class methods
- `private` keyword from TypeScript lessons — first real application comes in EmailService (Task 3)
