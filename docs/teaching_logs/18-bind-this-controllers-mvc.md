# 18 — .bind(this) in Controllers and MVC Pattern

**Date:** 2026-03-06
**Concept:** Why Express controllers need `.bind(this)` and the MVC layering pattern

## Context

Controllers use instance methods (like services), but face a unique problem: Express stores handler functions as standalone references, stripping the `this` context.

## Key Explanations

### The problem

```typescript
router.post('/signup', controller.signup);
// Express stores controller.signup as a standalone function
// Later: handler(req, res, next) — no "controller." in front
// Result: `this` is undefined inside signup
```

### The fix: `.bind(this)` in constructor

```typescript
constructor() {
  this.userService = new UserService();
  this.signup = this.signup.bind(this);
}
```

`.bind(this)` returns a **new function** where `this` is permanently locked to the controller instance. It doesn't modify the original method — it creates a bound copy.

Analogy: like putting a return address on a letter. The original method says "whoever calls me, I'll use their `this`." The bound version says "no matter who calls me, `this` is always THIS specific controller."

### Why services DON'T need bind

It depends on **who calls the method and how**:

- **Controller calls service:** `this.userService.signup(data)` — dot notation, `this` works ✅
- **Express calls controller:** `handler(req, res)` — standalone function call, `this` is undefined ❌

**Rule of thumb:** If YOUR code calls `object.method()`, `this` works. If a FRAMEWORK stores and calls it later as a standalone function, you need `.bind(this)`.

### Alternative: arrow function class properties

`signup = async (req, res) => { ... }` auto-binds because arrows capture `this` from definition context. Trade-off: each instance gets its own copy of every method (not shared via prototype). `.bind(this)` in constructor is the conventional pattern.

## Student Responses

- Correctly understood that `.bind()` locks `this` permanently
- Initially unsure what `.bind()` returns (new function vs modifying original) — explained it creates a new function
- Initially unsure why services don't need `.bind()` — key insight was dot notation vs standalone function call

## Connection to Prior Knowledge

- `this` keyword (log 02) — the 4 rules, already well understood
- `function` vs `=>` for instance methods (Phase 7, verifyPassword) — same underlying mechanism, different direction
