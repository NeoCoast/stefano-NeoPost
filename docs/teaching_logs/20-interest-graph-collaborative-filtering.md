# Lesson 20 — Interest Graph Algorithm & Collaborative Filtering

**Date:** 2026-03-17
**Context:** Designing the For You Page (FYP) feed for the Feed feature

---

## Concept Being Taught

How collaborative filtering works as a recommendation algorithm, specifically the "Interest Graph" approach: finding users with similar taste and using their behavior to recommend unseen content.

---

## Key Explanations Given

### What is Collaborative Filtering?

Collaborative filtering is the foundation of most modern recommendation systems (Netflix, Spotify, YouTube). The core idea:

> **People with similar taste tend to like similar things.**

Instead of analyzing the *content* of posts (what they're about), it analyzes *behavior patterns* (who liked what). No metadata required — just the interaction history.

Two types exist:
- **Explicit feedback** — users rate things (1–5 stars). Rich signal, hard to collect.
- **Implicit feedback** — inferred from behavior (likes, watches, purchases). Abundant, slightly noisier. **This is what we use** — likes are implicit feedback.

### The Interest Graph Steps

```
1. Find posts the current user has liked
         ↓
2. Find other users who also liked those same posts
   ("taste neighbors") — count how many posts they share = overlap score
         ↓
3. Find posts those neighbors liked that the current user has NOT liked yet
         ↓
4. Score each candidate post by summing the overlap scores
   of all neighbors who liked it
         ↓
5. Rank by score → apply tiebreakers → assign positions
         ↓
6. Write to FeedItem table (positions 1, 2, 3...)
```

### Why Overlap Score Matters — Worked Example

```
User A liked: [post 1, post 2, post 3]

User B liked: [post 1, post 9, post 10]         → overlap = 1 (weak neighbor)
User C liked: [post 1, post 2, post 8]           → overlap = 2 (moderate neighbor)
User D liked: [post 1, post 2, post 3, post 7]   → overlap = 3 (strong neighbor)
```

Ranking unseen posts for User A:
```
post 7  → liked by User D (overlap 3)  → score: 3   ← ranked 1st
post 8  → liked by User C (overlap 2)  → score: 2   ← ranked 2nd
post 9  → liked by User B (overlap 1)  → score: 1   ← ranked 3rd
post 10 → liked by User B (overlap 1)  → score: 1   ← ranked 4th (tiebreaker needed)
```

The student correctly identified that post 7 should rank first because User D has the strongest overlap, and post 8 second because User C is next. Strong independent reasoning.

### Tiebreaker Stack

When two posts have the same relevance score:

```
Primary:       overlap score DESC         (taste similarity — main signal)
Tiebreaker 1:  commentsCount DESC         (effort-based engagement)
Tiebreaker 2:  likeCount DESC             (passive engagement)
Tiebreaker 3:  createdAt DESC             (recency — always breaks ties)
```

**Why comments rank above likes as a tiebreaker:** Comments require intent and effort — leaving a comment signals deeper engagement than tapping a like button. This is a well-established principle in recommendation systems (implicit feedback confidence weighting).

### The Follow Bonus

The student proposed eliminating the artificial separation between "interest graph posts" and "followed users' posts" — instead of appending followed users' content at the end, the follow relationship should be a scoring signal that competes in the same ranking.

This is the correct approach. A post from a followed author gets an additive bonus to its score:

```
score = sum of neighbor overlap scores
      + follow bonus (if current user follows the post's author)

follow bonus = maxOverlapScore * FOLLOW_BONUS_WEIGHT
```

The follow bonus is expressed as a fraction of the maximum neighbor overlap score for that specific calculation — this ensures it scales proportionally regardless of the absolute overlap values (score normalization).

### Why FOLLOW_BONUS_WEIGHT = 0.1

The follow relationship is a **weak prior** ("this person probably won't hate this"), not a strong evidence-based signal like overlap score. Setting the weight too high (0.5) would make the FYP behave like the Following feed. Setting it too low makes it irrelevant.

**0.1 (10% of max overlap)** is a conservative starting point:
- Strong enough to break ties in favor of followed users
- Weak enough that genuinely relevant content from strangers still surfaces

This is a **hyperparameter** — a tunable constant with no universally correct value. The ML literature (Google's recommendation systems course, Netflix SVD papers) confirms that these weights are determined empirically from real usage data. The right engineering approach: name it clearly as a constant (`FOLLOW_BONUS_WEIGHT`), start conservative, and tune it later.

The student's instinct ("0.25 is too heavy, maybe even less") was directionally correct.

### Cold Start Problem

If a user has no likes yet, there are no taste neighbors to find — the algorithm produces nothing. Solution: fall back to **globally trending posts** (top 200 by likeCount DESC, createdAt DESC as tiebreaker). This gives new users a reasonable feed until they start interacting.

### The FeedItem Table

The algorithm's output is stored in a `FeedItem` table:

```
userId      BigInt   FK → users
postId      BigInt   FK → posts
position    Int      rank in the user's feed (1 = most relevant)
computedAt  DateTime when this feed was last generated
```

**Why position instead of score?** The `GET /api/feed/for-you` endpoint needs to paginate. Storing a pre-computed integer position means the read query is a simple `ORDER BY position ASC OFFSET X LIMIT Y` — no math at read time. The worker does all the scoring work at write time.

The student initially suggested `createdAt` as the ordering mechanism for pagination, which is correct for the Following feed (chronological) but not for FYP (relevance-ranked). Guided to the `position` integer concept.

---

## Questions Asked and Responses

**Q: Which unseen post should rank first for User A, and why?**
A (student): "Post 7 should appear first." ✓ Correct, with sound reasoning about User D's higher overlap.

**Q: Which post should rank second?**
A (student): "Post 8 should be second because User C is the following on most overlapping likes." ✓ Correct, independent reasoning.

**Q: Should the follow relationship be a separate section or part of the unified ranking?**
A (student): "I don't really like to have that separation at all — if A follows User B and he makes a post, and that post is liked by others followed by A, it should rank higher." ✓ Excellent architectural instinct — led to the follow bonus approach.

**Q: What should the follow bonus value be?**
A (student): "I don't really know — it depends on how much the overlaps of likes value." ✓ Correctly identified the normalization problem. Then: "0.25 is way too heavy, maybe even less." ✓ Good conservative instinct, confirmed by research.

**Q: Between like count and comment count as tiebreakers, which is a stronger quality signal?**
A (student): "Comments are more engaging because it takes more time than tapping a like button." ✓ Correct, and matches how production recommendation systems weight engagement signals.

---

## Insights and Aha Moments

- The student independently proposed eliminating the artificial "followed users appended at the end" design, replacing it with a unified scoring system. This is architecturally superior and shows genuine systems thinking.
- The student's intuition on the follow bonus weight (conservative, below 0.25) aligned with what the ML literature recommends for implicit feedback systems.
- The connection between "score at write time, position at read time" and pagination efficiency clicked quickly — the student understood why we store position rather than recomputing rank on every GET.

---

## Sources / References

- [Google ML — Collaborative Filtering](https://developers.google.com/machine-learning/recommendation/collaborative/basics)
- [Towards Data Science — Recommender Systems Complete Guide](https://towardsdatascience.com/recommender-systems-a-complete-guide-to-machine-learning-models-96d3f94ea748)
- Y. Hu et al. (2008) — *Collaborative Filtering for Implicit Feedback Datasets* (confidence weighting for implicit signals)
