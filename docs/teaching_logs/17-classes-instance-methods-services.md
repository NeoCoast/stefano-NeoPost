# 17 — Classes with Instance Methods (Services)

**Date:** 2026-03-06
**Concept:** Using instance methods in service classes for dependency injection readiness

## Context

After creating Model classes with static methods (log 16), the next layer — Services — uses instance methods instead. The question: why the difference?

## Key Explanations

### Static vs instance for services

Models use static because they're thin Prisma wrappers at the bottom of the stack — nothing to inject or swap out.

Services use instance methods because:
- Instance methods allow **dependency injection** through the constructor
- Today: `UserModel.findByEmail()` is hard-coded inside UserService
- Tomorrow: `constructor(private userModel: typeof UserModel)` lets you inject a fake model in tests
- No DI framework needed — just constructor parameters

### Connection to Rails

Rails controllers have instance methods (`def create`) — Rails injects `params`, `session`, etc. Same principle: the framework (or your code) creates an instance and calls methods on it.

## Student Responses

- Correctly identified that services might need state/dependencies in the future as the reason for instance methods
- Understood that DI through constructors is the practical benefit

## What's Next

Controllers also use instance methods — but with an extra twist: `.bind(this)` because Express calls handler functions without dot notation, stripping `this`.
