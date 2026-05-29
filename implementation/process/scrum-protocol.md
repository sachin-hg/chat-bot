# Scrum Protocol

---

## AI-Time Schedule

AI agents operate at **48× human speed**: 1 real hour = 48 human hours ≈ 2 human days.

| Human concept | Human cadence | AI-time equivalent | Scheduled interval |
|---|---|---|---|
| Daily standup | Every 24h | 30 min → **1h** (cron min) | Every hour |
| Sprint planning | Every 7 days | ~3.5h → **4h** | Every 4 hours |
| Sprint review + retro | Every 14 days | ~7h → **8h** | Every 8 hours |
| "Blocked for 2 days" | 48h | **1 standup cycle** = 1 hour | Flag after 1 cycle unresolved |
| Architecture sync | As needed | ~1h AI-time | On demand |

**Sprint duration in AI-time: 8 hours.** Sprint N runs for 8 real hours, then review + retro fires, then Sprint N+1 planning fires.

---

## Ceremonies

| Ceremony | AI-time cadence | Model | Facilitator | Output |
|---|---|---|---|---|
| Daily standup | Every 1h | Haiku | @ananya (PM) | `implementation/sprints/standups/standup-{datetime}.md` |
| Sprint planning | Every 4h | Sonnet | @ananya + @arjun | `implementation/sprints/sprint-{N}.md` |
| Sprint review + retro | Every 8h | Sonnet | @ananya | `implementation/sprints/reviews/review-sprint-{N}.md` |
| Architecture sync | On demand | Sonnet | @arjun + @priya | Decision logged in `pm-tracking.md` |

---

## Daily Standup

### PM/EM responsibility

@ananya opens standup each day by posting in **#chat-bot-standup**:

```
🕘 Standup [DATE] — Sprint [N], Day [D/10]
Please reply with your update by 10am. Format below 👇

@kiran @arjun @priya @dev @rahul @nisha
```

Each agent replies in the thread. @ananya reads all replies and posts a **summary comment** by 10:30am covering:

- Blockers that need unblocking today (who owns unblocking)
- Cross-team dependencies surfaced since yesterday
- Any item that should be pulled into a sync (flags it with ⚡)

### Per-agent update format

```
[AGENT NAME] — [DATE]

✅ Done since yesterday:
- <item>
- <item>

🔄 Doing today:
- <ticket> — <one line>

🚫 Blocked:
- <description> | waiting on @<person> | since <date>

🤝 Need from team (quick question or dependency):
- <item> → @<person>
```

### Rules

- **No-reply by 10am** = PM pings directly; two consecutive no-replies = escalate to EM
- **Blocked item older than 2 days** = automatically added to next standup agenda as ⚡ item
- **"Doing today" items must map to a ticket** (CHAT-A-XXX, CHAT-P-XXX, etc.)
- **Standup is not a design meeting.** Anything requiring > 2 back-and-forths gets timeboxed and moved to an async thread or sync

---

## Inter-Agent Quick Comms

Agents may message each other directly (Slack DM or thread) for **short clarifying questions**. This is encouraged — don't wait for standup to unblock a 2-minute question.

### Allowed topics

| Topic | OK direct? |
|---|---|
| "What does field X mean in the response schema?" | ✅ Yes |
| "Does my implementation of Y match the contract?" | ✅ Yes |
| "Is Z blocked on my ticket or yours?" | ✅ Yes |
| "I found a bug in the spec — minor typo/inconsistency" | ✅ Yes |
| "Should we add a new intent / filter / field?" | ❌ No → standup |
| "The API shape is different from the docs" | ❌ No → standup (affects spec) |
| "I think the architecture should be..." | ❌ No → architecture sync |
| "Can we change the sprint scope?" | ❌ No → PM |

### Exchange limit

**Max 3 exchanges** (question → answer → clarification) before escalating.

If not resolved in 3 exchanges:
1. Add to the **next day's standup** agenda with a one-line summary
2. Tag @ananya with `⚡ needs sync` in the thread

### Who talks to whom

Follow the "Works with" graph from `team-charter.md`. Cross-domain questions go through the relevant lead first.

```
@kiran ←→ @arjun       (infra ↔ BE config)
@arjun ←→ @priya       (adapters, session store, SSE emit)
@arjun ←→ @dev         (API contract, endpoint shapes)
@arjun ←→ @rahul       (contract tests, DB migration)
@priya ←→ @rahul       (node unit tests, model eval runner)
@dev   ←→ @rahul       (E2E golden paths)
@dev   ←→ @priya       (SSE event format, template data shapes)
@nisha → @arjun        (security requirements → BE implementation)
```

**Escalation path:**
direct DM (≤ 3 exchanges) → standup agenda (⚡) → architecture sync (if spec-level)

---

## Standup Agenda Management

@ananya maintains a **running agenda** for the next standup as items surface:

```
## Standup [DATE] agenda
- ⚡ @priya + @arjun: session_state mutation shape disagreement (flagged 2026-05-30)
- ⚡ @rahul: CHAT-Q-005 blocked > 2 days — needs node from @priya
- 📋 Sprint burn-down check (> 50% done?)
```

Items are added when:
- A quick-comms exchange hits the 3-exchange limit
- A blocked item is older than 2 days
- PM identifies a cross-team dependency in the daily summary

---

## Sprint Planning

Inputs: backlog in `implementation/tickets/`, velocity from last sprint, any pivots in `pm-tracking.md`.

Agenda:
1. Retro one-liner from last sprint (2 min)
2. PM presents sprint goal (5 min)
3. Each lead pulls tickets into sprint, confirms SP estimate (20 min)
4. Cross-team dependencies mapped explicitly on the whiteboard / shared doc (10 min)
5. Capacity check: SP vs working days × lead velocity (5 min)
6. Commit (any ticket not fitting is explicitly deferred)

Output: sprint column in `implementation/sprints/sprint-[N].md` updated.

---

## Sprint Review

Each lead demos their increment against the sprint's acceptance criteria. PM checks off ACs live. Items not done stay in backlog with a note.

After review: @ananya updates `implementation/milestones.md` sprint status.

---

## Retrospective

Three questions, strict timebox:
1. **What went well?** (5 min, round-robin, one item per person)
2. **What slowed us down?** (10 min, any order, focus on process not people)
3. **One concrete action item for next sprint** (5 min, owner assigned immediately)

Action item goes into `pm-tracking.md` under the sprint section. If not resolved by next retro, it carries forward with an explanation.

---

## Escalation Matrix

| Situation | Path |
|---|---|
| Quick question between two agents | Direct DM, ≤ 3 exchanges |
| Question unresolved after 3 exchanges | ⚡ standup agenda |
| Spec/contract disagreement | @arjun + @priya sync, @ananya documents decision in pm-tracking.md |
| Scope change request | PM → stakeholder → pm-tracking.md pivot log |
| Production safety concern | @arjun flags immediately, all non-critical work pauses |
| Missing acceptance criteria | @rahul flags in ticket, @ananya clarifies same day |
| Architecture change needed | @priya + @arjun proposal → pm-tracking.md → team alignment in next standup |
