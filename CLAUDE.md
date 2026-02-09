# nodejs-training

## Session Workflow (MANDATORY)

Every session MUST follow this order:

1. **Read `TEACHING_GUIDE.md`** — understand the student's current level, preferences, and what they already know
2. **Teach before building** — for every new concept, explain WHY it exists, ask questions to probe understanding, and only then write code
3. **Use TDD** — write failing tests first, then implement to make them green
4. **Log teaching sessions** — write a teaching log to `docs/teaching_logs/NN-topic.md` for each concept taught
5. **Update `TEACHING_GUIDE.md`** — after each session, update the "Observed Teaching Insights" and "Concepts the student now owns" sections

The `/teacher` skill should be used for any concept explanation. Teaching is MORE important than implementation.

## Teaching

| Guideline | Detail |
|-----------|--------|
| Explain before building | Student wants to understand *why* before seeing code |
| Don't skip motivations | Always present the problem a concept solves first |
| Ask before assuming style | Student has preferences (file naming, class syntax) — ask early |
| Welcome tangents | Curious learner — side questions (static methods, global classes) deepen understanding |
| External guide matters | Follows hackmd.io/@OzPfQZ70SnuEH0IFk92rSg/r10rD0ADc — match its conventions |
| Build then explain | Prefers code created for them, with walkthrough after |
| Use TDD | Write failing tests first, then implement — the student explicitly requested this |

## Lessons from Past Phases

- Check port conflicts before DB setup (local PostgreSQL on 5432 conflicted with Docker)
- Don't assume naming conventions — student rejected `.routes.js` pattern immediately
- Student asked to learn `class` syntax even when plan avoided it — adapt to curiosity
- Student catches dead code and unused imports — be precise, don't leave loose ends
- Lint errors are teaching opportunities — explain the rule, don't just disable it
- Rails comparisons click fast — map JS concepts to Ruby equivalents when possible

## Files

| File | Read when |
|------|-----------|
| `PLAN.md` | Adding new phases or reviewing learning scope |
| `TEACHING_GUIDE.md` | **EVERY SESSION** — has student profile, per-concept depth guidance, and observed teaching insights |
| `docs/teaching_logs/*.md` | Before teaching a new concept — check what was already covered |
