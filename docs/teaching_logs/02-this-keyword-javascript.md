# Lesson 02: `this` in JavaScript — How It Differs from Ruby's `self`

**Date:** 2026-02-08
**Phase:** 7 (User Authentication)
**Prior knowledge:** Student knows Ruby's `self`. Did NOT know JS `this` behaves differently.

---

## Concepts Covered

### The Fundamental Difference
- **Ruby:** `self` always refers to the current object. Determined by **where** the code is written.
- **JavaScript:** `this` depends on **how** the function is called, not where it's defined. Same function, different calls, different `this`.

### The 4 Rules of `this` (priority order)

| Rule | How called | `this` becomes |
|------|-----------|----------------|
| 1. `new` binding | `new User()` | The new object being created |
| 2. Explicit binding | `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)` | Whatever you pass |
| 3. Implicit binding | `user.greet()` | Object before the dot (`user`) |
| 4. Default binding | `greet()` (no dot) | `global` / `undefined` in strict mode |

### Arrow Functions Break All Rules
- Arrow functions do NOT have their own `this`.
- They inherit `this` from the enclosing scope (lexical `this`).
- `.call()`, `.bind()`, etc. cannot change an arrow function's `this`.

### The Classic Gotcha: `this` in Callbacks
```js
showFriends: function() {
  this.friends.forEach(function(friend) {
    console.log(this.name + ' knows ' + friend);  // this.name = undefined!
  });
}
```
- `forEach` calls the inner function as a standalone function (no dot).
- Rule 4 applies — `this` = `global`/`undefined`, NOT the outer object.
- In Ruby, `self` inside a block stays the same. In JS, every `function` creates a new `this` context.

### Three Ways to Fix Lost `this`
1. **Arrow function** (modern, preferred): `(friend) => { this.name }` — inherits from surrounding scope
2. **`const self = this`** (old school): capture `this` before entering callback
3. **`forEach` thisArg**: `.forEach(function() {}, this)` — pass `this` explicitly

### Why This Matters for Phase 7
- `User.prototype.verifyPassword = function() {}` — NEEDS `function` keyword
  - When called as `user.verifyPassword()`, rule 3 gives `this` = user instance
- `User.prototype.verifyPassword = () => {}` — BROKEN
  - Arrow function captures `this` from module scope (not the user instance)
- **Arrow functions for callbacks, `function` keyword for methods that need `this`**

### Alternative Patterns in the Wild
1. `const self = this` — pre-ES6, still seen in older codebases
2. `.bind(this)` — explicit binding
3. Arrow functions — modern callbacks
4. Class fields (`greet = () => {}`) — auto-binds in class syntax

---

## Questions & Student Responses

**Q: What does this code print?** (forEach with regular function callback)
```js
const user = {
  name: 'Stefano',
  friends: ['Alice', 'Bob'],
  showFriends: function() {
    this.friends.forEach(function(friend) {
      console.log(this.name + ' knows ' + friend);
    });
  }
};
user.showFriends();
```

A: Student answered "Stefano knows Alice, Stefano knows Bob" — **incorrect**.
- Actual output: `undefined knows Alice`, `undefined knows Bob`
- This was the intended learning moment: `this` inside `forEach` callback is NOT the user object.
- Student now understands why arrow functions were added to JS (to solve this exact problem).

---

## Sources
- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [javascript.info: Object Methods, "this"](https://javascript.info/object-methods)
- Kyle Simpson's "You Don't Know JS" (reference for the 4 rules model)
