"""
LangGraph supervisor that orchestrates all agents.

Graph structure:
  START → assign → [arjun|priya|rahul|dev|kiran in parallel] → collect → standup? → END/loop
"""
import asyncio
import concurrent.futures
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from agents.agent import RateLimitPause, run_agent
from agents.personas import PERSONAS
from agents.state import (
    AgentProgress, SprintState,
    get_messages, init_db, load_progress, load_sprint,
    save_progress, save_sprint,
)
from agents.tools import read_file

STANDUP_EVERY = 8   # supervisor cycles between standups

# ── Graph state ───────────────────────────────────────────────────────────

class SupervisorState(TypedDict):
    sprint:        int
    cycle:         int
    agent_results: Dict[str, str]   # agent_name → "done"|"blocked"|"paused"|"skipped"
    paused_agents: List[str]        # rate-limited this cycle
    standup_due:   bool
    all_done:      bool


# ── Nodes ─────────────────────────────────────────────────────────────────

def assign_node(state: SupervisorState) -> SupervisorState:
    """Reset per-cycle bookkeeping."""
    return {
        **state,
        "agent_results": {},
        "paused_agents": [],
        "standup_due":   state["cycle"] % STANDUP_EVERY == 0,
        "all_done":      False,
    }


def _run_one(agent_name: str, conn, sprint: int) -> tuple[str, str]:
    try:
        result = run_agent(agent_name, conn, sprint, verbose=True)
        return agent_name, result
    except RateLimitPause:
        return agent_name, "paused"
    except Exception as e:
        import anthropic as _anthropic
        if isinstance(e, _anthropic.AuthenticationError):
            print(f"  [@{agent_name}] ✗ authentication error — check ANTHROPIC_API_KEY in .env")
        else:
            print(f"  [@{agent_name}] ⚠ unexpected error: {type(e).__name__}: {e}")
        # Save error state so agent resets next cycle rather than re-replaying failed history
        from agents.state import load_progress, save_progress as _save
        p = load_progress(conn, agent_name)
        p.step = "error"
        p.history = []   # clear so next cycle starts fresh
        _save(conn, p)
        return agent_name, "error"


def agents_node(state: SupervisorState) -> SupervisorState:
    """Run all agents in parallel (thread pool — each agent is IO-bound)."""
    conn = init_db()
    sprint = state["sprint"]
    names = list(PERSONAS.keys())

    results: Dict[str, str] = {}
    paused: List[str] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(names)) as pool:
        futures = {pool.submit(_run_one, n, conn, sprint): n for n in names}
        for fut in concurrent.futures.as_completed(futures):
            agent_name, result = fut.result()
            results[agent_name] = result
            if result == "paused":
                paused.append(agent_name)
            icon = {"done": "✅", "blocked": "🚫", "paused": "⏸", "error": "⚠"}.get(result, "?")
            print(f"  [@{agent_name}] {icon} {result}")

    return {**state, "agent_results": results, "paused_agents": paused}


def standup_node(state: SupervisorState) -> SupervisorState:
    """PM/EM standup: read sprint file, write a brief status summary."""
    if not state["standup_due"]:
        return state

    conn = init_db()
    sprint = state["sprint"]
    cycle  = state["cycle"]

    print(f"\n{'='*60}")
    print(f"  STANDUP  Sprint {sprint}  Cycle {cycle}")
    print(f"{'='*60}")

    for name in PERSONAS:
        p = load_progress(conn, name)
        icon = {"done": "✅", "implementing": "🔄", "blocked": "🚫",
                "paused": "⏸", "idle": "💤", "finding": "🔍"}.get(p.step, "?")
        ticket = p.ticket or "(none)"
        blocked = f"  ← {p.blocked_reason}" if p.blocked_reason else ""
        print(f"  @{name:<8} {icon} {ticket}{blocked}")

    # Check bus for unresolved messages > 1 cycle old
    from agents.state import get_messages as get_all
    import sqlite3
    c = conn.execute("SELECT * FROM bus WHERE reply IS NULL").fetchall()
    if c:
        print(f"\n  ⚡ {len(c)} unresolved bus message(s) — may need PM intervention")
        for row in c:
            print(f"     [{row['id']}] @{row['from_agent']} → @{row['to_agent']}: {row['body'][:60]}")

    print()
    return state


def check_done_node(state: SupervisorState) -> SupervisorState:
    """Check if all Sprint 1 tickets are complete."""
    conn = init_db()
    sprint = state["sprint"]

    # Quick heuristic: read milestone tracker
    milestones = read_file("implementation/milestones.md")
    sprint_block_start = milestones.find(f"## Sprint {sprint}")
    sprint_block_end   = milestones.find("## Sprint", sprint_block_start + 1)
    sprint_block = milestones[sprint_block_start:sprint_block_end] if sprint_block_end != -1 else milestones[sprint_block_start:]

    pending = sprint_block.count("⬜")
    in_prog = sprint_block.count("🔄")

    all_done = pending == 0 and in_prog == 0
    if all_done:
        print(f"\n  🎉 Sprint {sprint} complete!")

    return {**state, "all_done": all_done, "cycle": state["cycle"] + 1}


def _should_loop(state: SupervisorState) -> str:
    if state["all_done"]:
        return "end"
    results = state["agent_results"]
    if results and all(v in ("paused", "error") for v in results.values()):
        errors  = [k for k, v in results.items() if v == "error"]
        paused  = [k for k, v in results.items() if v == "paused"]
        if errors:
            print(f"\n  ✗ All agents stopped with errors: {errors}")
            print("  Check ANTHROPIC_API_KEY in .env, then run: make agents-resume")
        else:
            print("\n  All agents paused (rate limits). Run: make agents-resume")
        return "end"
    return "loop"


# ── Build graph ────────────────────────────────────────────────────────────

def build_graph() -> Any:
    g = StateGraph(SupervisorState)

    g.add_node("assign",    assign_node)
    g.add_node("agents",    agents_node)
    g.add_node("standup",   standup_node)
    g.add_node("check",     check_done_node)

    g.add_edge(START,      "assign")
    g.add_edge("assign",   "agents")
    g.add_edge("agents",   "standup")
    g.add_edge("standup",  "check")
    g.add_conditional_edges("check", _should_loop, {"loop": "assign", "end": END})

    return g.compile()
