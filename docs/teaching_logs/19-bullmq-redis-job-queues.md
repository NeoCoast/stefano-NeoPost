# Lesson 19 — BullMQ, Redis, and Job Queues

**Date:** 2026-03-17
**Context:** Designing the Feed feature (Following feed + For You Page)

---

## Concept Being Taught

Why on-demand computation is expensive for a feed recommendation system, and how job queues (BullMQ + Redis) solve that by decoupling expensive work from the HTTP request cycle.

---

## Key Explanations Given

### Why not compute the FYP on every request?

The Interest Graph algorithm requires multiple heavy database queries (finding likes, scoring neighbors, ranking posts). Running this on every `GET /api/feed/for-you` request would:

1. **Block the thread** — Node.js is single-threaded; expensive computation queues all other requests behind it
2. **Slow the response** — the user waits while the server crunches through queries

### The precomputed feed table approach

Instead of computing on-demand, a background worker recomputes the feed periodically and writes results to a `FeedItem` table. The GET request then just reads from that table — a simple, fast index scan.

### The restaurant analogy

- **Waiter (Express)** — takes the order, writes a ticket, moves on
- **Rail (Redis)** — holds the tickets persistently
- **Cook (Worker)** — picks tickets off the rail and does the actual work

The key insight: the waiter never waits for the food. They hand off the ticket and immediately go serve the next customer.

### Why not an in-memory array instead of Redis?

An in-memory JavaScript array (e.g. `const queue = []`) lives in RAM and disappears when the process restarts. Any pending jobs are lost forever. Redis is a **separate process** that persists data to disk — jobs survive server restarts and deployments.

### BullMQ's role

Redis is just a data store — it holds lists but has no concept of job lifecycle. BullMQ is the rules engine that:

- Writes jobs to Redis in a structured format
- Reads jobs from Redis in the worker and hands them to your code
- Manages the job lifecycle: `waiting → active → completed` (or `failed → retry`)
- Supports delays, concurrency limits, retries — rules Redis knows nothing about

Neither Express nor the worker ever touches Redis directly — BullMQ is the only one that does, from both sides.

### The callback pattern connection

The BullMQ worker API uses the same callback pattern as Express routes:

```
Express:  route registered once → Express calls handler when a REQUEST arrives
BullMQ:   worker registered once → BullMQ calls handler when a JOB arrives
```

Express can also trigger BullMQ to add a job — e.g., when a user likes a post, `LikeService` adds a `recompute-feed` job to the queue.

### The full flow

```
1. Express adds a job to BullMQ         →
2. BullMQ writes it to Redis            →
3. Redis persists it to disk            →
4. BullMQ worker picks it up            →
5. Worker runs the expensive computation →
6. Worker writes results to FeedItem table →
7. GET /api/feed/for-you reads from that table  ← fast
```

### The FeedItem table design

```
userId      BigInt   FK → users
postId      BigInt   FK → posts
position    Int      rank in the user's feed (1 = most relevant)
computedAt  DateTime when this feed was last generated
```

`position` is the key insight for pagination: instead of doing score math at query time, the worker pre-ranks all posts and encodes the result as a simple integer. Page 2 with limit 20 becomes `ORDER BY position ASC OFFSET 20 LIMIT 20`.

---

## Questions Asked and Responses

**Q: Why can't we compute the FYP inside the request/response chain?**
A (student): "It is really expensive in terms of time consuming, it blocks a thread of the CPU with really hard computing and time consuming queries." ✓ Correct on both dimensions.

**Q: What happens to an in-memory array if the server restarts?**
A (student): "I don't really know." → Taught: RAM is ephemeral; Redis persists to disk.

**Q: What is BullMQ's role?**
A (student): "BullMQ's role is to make the rules for Redis." ✓ Accurate high-level model.

**Q: What pattern does the BullMQ worker remind you of?**
A (student): Connected it immediately to Express route callbacks — "it's kinda the same that Express does when you give them the controller actions to the routes." ✓ Strong connection to prior learning.

**Q: What extra piece of information does each FeedItem row need beyond userId and postId, for pagination to work?**
A (student): First guessed `createdAt`, then guided to `position` (integer rank). The createdAt instinct was reasonable — correct for the Following feed — but position is simpler and more direct for a ranked FYP.

---

## Insights and Aha Moments

- The student immediately connected BullMQ's worker pattern to Express route callbacks without prompting — strong pattern recognition across layers.
- The student correctly identified that Express can trigger BullMQ job creation (e.g., on like events), not just a scheduler — shows understanding of event-driven architecture.
- Initial confusion between "score" and "position" for pagination — understandable, as scores are the input to ranking. The key insight is that the worker converts scores into positions at write time, so the read path stays simple.

---

## Sources / References

- [BullMQ Documentation](https://docs.bullmq.io)
- [Redis persistence](https://redis.io/docs/management/persistence/)