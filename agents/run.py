"""
Entry point for the local multi-agent system.

Usage:
  python -m agents.run                         # start fresh, Sprint 1
  python -m agents.run --resume                # resume from last checkpoint
  python -m agents.run --sprint 2              # start a different sprint
  python -m agents.run --agent priya           # run a single agent only (1 cycle)
  python -m agents.run --standup               # print standup summary and exit
  python -m agents.run --bus                   # print all unresolved bus messages
"""
import argparse
import sys

from agents.graph import build_graph
from agents.state import (
    init_db, load_progress, load_sprint, save_sprint,
    get_messages, SprintState,
)
from agents.personas import PERSONAS


def cmd_standup(args):
    conn = init_db()
    sprint = load_sprint(conn)
    print(f"\nStandup — Sprint {sprint.sprint}  Cycle {sprint.cycle}")
    print("-" * 50)
    for name in PERSONAS:
        p = load_progress(conn, name)
        icon = {"done":"✅","implementing":"🔄","blocked":"🚫","paused":"⏸","idle":"💤"}.get(p.step,"?")
        print(f"  @{name:<8} {icon:<2} ticket={p.ticket or '(none)'}  step={p.step}")
        if p.blocked_reason:
            print(f"           ⚡ {p.blocked_reason}")
    print()


def cmd_bus(args):
    conn = init_db()
    rows = conn.execute("SELECT * FROM bus").fetchall()
    if not rows:
        print("Bus is empty.")
        return
    for r in rows:
        status = "✅ replied" if r["reply"] else "⏳ pending"
        print(f"  [{r['id']}] @{r['from_agent']} → @{r['to_agent']}  {status}")
        print(f"       Q: {r['body']}")
        if r["reply"]:
            print(f"       A: {r['reply']}")
    print()


def cmd_run(args):
    conn  = init_db()
    db_sprint = load_sprint(conn)

    sprint = args.sprint or db_sprint.sprint

    # Single-agent mode
    if args.agent:
        if args.agent not in PERSONAS:
            print(f"Unknown agent: {args.agent}. Choose from: {list(PERSONAS)}")
            sys.exit(1)
        from agents.agent import run_agent, RateLimitPause
        print(f"\nRunning @{args.agent} (sprint {sprint}) ...")
        try:
            result = run_agent(args.agent, conn, sprint)
            print(f"\n@{args.agent}: {result}")
        except RateLimitPause:
            print(f"\n@{args.agent}: rate limited — state saved, run with --resume to continue")
        return

    # Full supervisor graph
    graph = build_graph()

    if args.resume:
        # Reload sprint from DB; agents restore their own history from DB
        initial = {
            "sprint":        db_sprint.sprint,
            "cycle":         db_sprint.cycle,
            "agent_results": {},
            "paused_agents": [],
            "standup_due":   False,
            "all_done":      False,
        }
        print(f"\nResuming Sprint {db_sprint.sprint} from cycle {db_sprint.cycle} ...")
    else:
        initial = {
            "sprint":        sprint,
            "cycle":         0,
            "agent_results": {},
            "paused_agents": [],
            "standup_due":   True,
            "all_done":      False,
        }
        save_sprint(conn, SprintState(sprint=sprint, cycle=0))
        print(f"\nStarting Sprint {sprint} ...")

    print("  Ctrl+C to interrupt — progress is saved after every tool call.\n")

    try:
        final = graph.invoke(initial, config={"recursion_limit": 500})
        save_sprint(conn, SprintState(sprint=final["sprint"], cycle=final["cycle"]))
        print(f"\nGraph finished. Sprint {final['sprint']} cycle {final['cycle']}.")
    except KeyboardInterrupt:
        print("\n\nInterrupted — all agent progress is saved. Run with --resume to continue.")


def main():
    parser = argparse.ArgumentParser(description="Housing Chatbot multi-agent runner")
    parser.add_argument("--resume",   action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--sprint",   type=int,            help="Sprint number (default: last saved)")
    parser.add_argument("--agent",    type=str,            help="Run a single agent for one cycle")
    parser.add_argument("--standup",  action="store_true", help="Print standup summary and exit")
    parser.add_argument("--bus",      action="store_true", help="Print bus messages and exit")
    args = parser.parse_args()

    if args.standup:
        cmd_standup(args)
    elif args.bus:
        cmd_bus(args)
    else:
        cmd_run(args)


if __name__ == "__main__":
    main()
