# 14 — Promises Deep Dive

**Date:** 2026-03-02
**Concept:** How Promises work under the hood — states, await, async functions, caching, `.then()` chains

---

## What was taught

### The Problem

JavaScript is single-threaded but needs to do slow things (database queries, network requests, reading files). If it waited for each one, the server would freeze — no other requests could be handled while waiting for one database query.

Rails comparison: Rails uses threads or processes to handle this — each request gets its own thread. Node.js uses a single thread with an event loop. Instead of blocking, it starts the slow operation, moves on, and comes back when the result is ready.

### The Solution — Promises

A **Promise** is an object representing "this work is happening, I'll have a result eventually."

### Restaurant Analogy

1. You place an order → you get a **receipt** (the Promise)
2. The kitchen starts cooking → Promise is **pending**
3. Food arrives → Promise is **fulfilled** (resolved) with a value
4. Kitchen is out of ingredients → Promise is **rejected** with an error

You can't eat the receipt — you need to wait for the food. The receipt is just a promise that food is coming.

### Three States

```
                ┌──── fulfilled (value)
                │
  pending ──────┤
  (working...)  │
                └──── rejected (error)
```

Once settled (fulfilled or rejected), a Promise never changes. A fulfilled Promise stays fulfilled forever. You can `await` it again later and get the same value instantly.

### `await` vs No `await`

```javascript
// Without await: you get the receipt (Promise)
const promise = prisma.user.findUnique({ where: { email } });
console.log(promise); // Promise { <pending> }

// With await: you get the food (actual value)
const user = await prisma.user.findUnique({ where: { email } });
console.log(user); // { id: 1n, email: 'john@...' }
```

`await` pauses the function until the Promise settles, then gives you the resolved value. Without `await`, you get the Promise object itself — not the data inside it.

### `async` Functions Always Return Promises

```javascript
async function getUser() {
  return { name: 'John' }; // plain object
}
const result = getUser(); // Promise { { name: 'John' } }
```

Even though you return a plain object, `async` wraps it in a Promise. That's why TypeScript return types say `Promise<User>`, not just `User`. To get the actual value, you need `await getUser()`.

### Before `async`/`await`: `.then()` Chains

```javascript
// Old way — callback-based
prisma.user.findUnique({ where: { email } })
  .then((user) => console.log(user.email))
  .catch((error) => console.error(error));

// Modern way — same behavior
try {
  const user = await prisma.user.findUnique({ where: { email } });
  console.log(user.email);
} catch (error) {
  console.error(error);
}
```

`async`/`await` is syntactic sugar over `.then()`. Under the hood, the same thing happens. But `await` reads like synchronous code — easier to follow, especially with multiple steps.

### Promise Caching

In the email service, we cache the transporter Promise:

```typescript
let transporterPromise: Promise<Transporter> | null = null;

const getTransporter = async (): Promise<Transporter> => {
  if (!transporterPromise) {
    transporterPromise = createTransporter(); // stores the Promise, not the result
  }
  return transporterPromise;
};
```

The first call starts creating the transporter and stores the **Promise** (not the result). The second call returns the same Promise. If it already resolved, `await` returns instantly. If it's still pending, both callers wait for the same operation.

This is lazy initialization — don't create expensive resources until they're needed, and don't create them twice.

### Common Bug: Forgetting `await`

```typescript
const transporter = getTransporter(); // ← forgot await!
transporter.sendMail(options); // 💥 TypeError: transporter.sendMail is not a function
```

Without `await`, `transporter` is a `Promise<Transporter>`, not a `Transporter`. Calling `.sendMail()` on a Promise crashes because Promises don't have that method.

TypeScript catches this — it sees you calling `.sendMail()` on `Promise<Transporter>` instead of `Transporter` and flags it at compile time. This is one of the clearest wins of TypeScript over JavaScript: a common async bug becomes a compile error.

---

## Questions asked and responses

**"What would happen if you called `transporter.sendMail()` without awaiting `getTransporter()`?"**
Student answered: "It would crash." Correct — `transporter` would be a Promise, not a Transporter, so `.sendMail()` doesn't exist on it. The student understood that forgetting `await` gives you the Promise object (the receipt) instead of the resolved value (the food).

---

## Key insight

The student initially said they didn't fully understand Promises and asked for a deeper explanation. After the restaurant analogy and the `await` vs no-`await` comparison, the concept clicked. The key realization was that `await` is the bridge between "a reference to future data" (Promise) and "the actual data." Every `async` function returns a Promise, and every Promise needs an `await` to extract its value.

---

## Sources

- [MDN — Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN — async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)
- [JavaScript.info — Promises](https://javascript.info/promise-basics)
