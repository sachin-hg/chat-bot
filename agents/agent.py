"""
Generic ReAct agent loop.
- Runs until done(), blocked(), or rate-limited
- Saves conversation history to DB after every tool call (resume support)
- Posts to / reads from the shared message bus
"""
import json
import time
from typing import Optional

import anthropic

from agents.personas import PERSONAS, Persona
from agents.state import AgentProgress, load_progress, save_progress
from agents.tools import TOOL_DEFINITIONS, execute_tool

MAX_STEPS = 40   # safety cap per cycle — prevents infinite loops


class RateLimitPause(Exception):
    """Raised when the API rate-limits us so the runner can save and exit cleanly."""


def _find_next_ticket(backlog_text: str, sprint: int) -> Optional[str]:
    """Naive scan: find first line containing '⬜' and 'Sprint: {sprint}'."""
    in_ticket = False
    ticket_id = None
    for line in backlog_text.splitlines():
        if line.startswith("## CHAT-"):
            in_ticket = True
            ticket_id = line.split(":")[0].lstrip("## ").strip()
        if in_ticket and f"Sprint:** {sprint}" in line and "⬜" in line:
            return ticket_id
        # Alternative format: Status: ⬜ and Sprint: N on separate lines
        if in_ticket and "Status:** ⬜" in line:
            # Look back for sprint in same block
            pass  # ticket_id captured above; caller will verify sprint
    # Fallback: find first ⬜ block
    for line in backlog_text.splitlines():
        if "| ⬜" in line or "Status:** ⬜" in line or "Status: ⬜" in line:
            return None  # let the LLM figure it out
    return None


def run_agent(agent_name: str, conn, sprint: int, verbose: bool = True) -> str:
    """
    Run one work cycle for an agent. Returns 'done', 'blocked', or 'paused'.
    State is checkpointed to DB after every tool call.
    """
    persona: Persona = PERSONAS[agent_name]
    client = anthropic.Anthropic()
    progress = load_progress(conn, agent_name)

    def log(msg: str):
        if verbose:
            print(f"  [@{agent_name}] {msg}")

    # ── Build or restore conversation ────────────────────────────────────
    if progress.history and progress.step not in ("idle", "done", "error"):
        log(f"Resuming ticket {progress.ticket} at step '{progress.step}'")
        messages = progress.history
    else:
        # Fresh start: read backlog and pick next ticket
        backlog = f"agents.tools.read_file('{persona.backlog}')"
        from agents.tools import read_file
        backlog_text = read_file(persona.backlog)

        messages = [
            {
                "role": "user",
                "content": (
                    f"Sprint {sprint} is active.\n\n"
                    f"Your backlog:\n\n{backlog_text}\n\n"
                    "Pick the next ⬜ ticket for this sprint, read its spec from the referenced "
                    "docs, implement it, run any relevant tests, commit to a branch named "
                    f"{agent_name}/{{TICKET-ID}}, then call done(). "
                    "If you need a quick answer from another agent, call post_message() — "
                    "keep it short, max 3 exchanges before calling blocked(). "
                    "If genuinely blocked, call blocked() with the reason."
                ),
            }
        ]
        progress.step = "finding"
        progress.history = messages
        save_progress(conn, progress)

    # ── ReAct loop ───────────────────────────────────────────────────────
    for step in range(MAX_STEPS):
        try:
            response = client.messages.create(
                model=persona.model,
                max_tokens=8192,
                system=persona.system,
                tools=TOOL_DEFINITIONS,
                messages=messages,
            )
        except anthropic.RateLimitError as e:
            log(f"Rate limited at step {step} — saving state")
            progress.step = "paused"
            save_progress(conn, progress)
            raise RateLimitPause(str(e))
        except anthropic.AuthenticationError:
            # Bad key — nothing to retry; surface immediately
            raise
        except anthropic.APIStatusError as e:
            if e.status_code == 529:  # overloaded
                log("API overloaded — waiting 30s then retrying")
                time.sleep(30)
                continue
            raise

        # Append assistant response to history
        messages.append({"role": "assistant", "content": response.content})

        # ── Check stop reason ────────────────────────────────────────────
        if response.stop_reason == "end_turn":
            # No more tool calls — agent thinks it's done but didn't call done()
            log("Finished without explicit done() — treating as done")
            progress.step = "done"
            progress.history = messages
            save_progress(conn, progress)
            return "done"

        # ── Execute tool calls ───────────────────────────────────────────
        tool_results = []
        outcome = None

        for block in response.content:
            if block.type != "tool_use":
                continue

            tool_name = block.name
            tool_input = block.input

            log(f"[step {step}] {tool_name}({json.dumps(tool_input)[:80]})")

            if tool_name == "done":
                log(f"✅ {tool_input.get('summary', '')}")
                progress.step = "done"
                progress.ticket = progress.ticket  # keep
                progress.history = messages
                save_progress(conn, progress)
                outcome = "done"
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": "[acknowledged]",
                })
                break

            if tool_name == "blocked":
                reason = tool_input.get("reason", "unknown")
                log(f"🚫 Blocked: {reason}")
                progress.step = "blocked"
                progress.blocked_reason = reason
                progress.history = messages
                save_progress(conn, progress)
                outcome = "blocked"
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": "[acknowledged]",
                })
                break

            result = execute_tool(tool_name, tool_input, conn, agent_name)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            })

        if outcome:
            return outcome

        # Add tool results to conversation and checkpoint
        if tool_results:
            messages.append({"role": "user", "content": tool_results})
            progress.history = messages
            progress.step = "implementing"
            save_progress(conn, progress)

    log(f"Hit step cap ({MAX_STEPS}) — saving as paused")
    progress.step = "paused"
    progress.history = messages
    save_progress(conn, progress)
    return "paused"
