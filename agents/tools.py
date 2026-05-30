"""
Tools available to every agent. Executed locally; results returned as strings.
"""
import subprocess
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).parent.parent


def _rel(path: str) -> Path:
    p = Path(path)
    return p if p.is_absolute() else REPO_ROOT / p


def bash(command: str, timeout: int = 60) -> str:
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True,
            timeout=timeout, cwd=REPO_ROOT
        )
        out = result.stdout.strip()
        err = result.stderr.strip()
        if result.returncode != 0:
            return f"[exit {result.returncode}]\n{err or out}"
        return out or "[ok, no output]"
    except subprocess.TimeoutExpired:
        return "[timed out]"
    except Exception as e:
        return f"[error] {e}"


def read_file(path: str) -> str:
    try:
        return _rel(path).read_text()
    except FileNotFoundError:
        return f"[not found: {path}]"
    except Exception as e:
        return f"[error reading {path}] {e}"


def write_file(path: str, content: str) -> str:
    try:
        p = _rel(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)
        return f"[written: {path}]"
    except Exception as e:
        return f"[error writing {path}] {e}"


def edit_file(path: str, old_string: str, new_string: str) -> str:
    try:
        p = _rel(path)
        text = p.read_text()
        if old_string not in text:
            return f"[not found] string not in {path}"
        p.write_text(text.replace(old_string, new_string, 1))
        return f"[edited: {path}]"
    except FileNotFoundError:
        return f"[not found: {path}]"
    except Exception as e:
        return f"[error editing {path}] {e}"


# ── Tool schema for Claude ────────────────────────────────────────────────

TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "bash",
        "description": "Run a shell command in the repo root. Use for git, pytest, pip, etc.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to run"},
                "timeout": {"type": "integer", "description": "Seconds before timeout (default 60)"},
            },
            "required": ["command"],
        },
    },
    {
        "name": "read_file",
        "description": "Read a file. Path relative to repo root or absolute.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write (overwrite) a file. Creates parent dirs if needed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "edit_file",
        "description": "Replace the first occurrence of old_string with new_string in a file.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "old_string": {"type": "string"},
                "new_string": {"type": "string"},
            },
            "required": ["path", "old_string", "new_string"],
        },
    },
    {
        "name": "post_message",
        "description": "Send a quick question to another agent via the shared bus.",
        "input_schema": {
            "type": "object",
            "properties": {
                "to_agent": {"type": "string", "description": "arjun | priya | rahul | dev | kiran | pm"},
                "body": {"type": "string", "description": "Your question (keep it short — max 3 exchanges)"},
            },
            "required": ["to_agent", "body"],
        },
    },
    {
        "name": "read_messages",
        "description": "Read unread bus messages addressed to me and any replies to my earlier questions.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "reply_message",
        "description": "Reply to a bus message sent to me.",
        "input_schema": {
            "type": "object",
            "properties": {
                "message_id": {"type": "integer"},
                "reply": {"type": "string"},
            },
            "required": ["message_id", "reply"],
        },
    },
    {
        "name": "done",
        "description": "Signal that the current ticket is complete. Provide a one-line summary.",
        "input_schema": {
            "type": "object",
            "properties": {"summary": {"type": "string"}},
            "required": ["summary"],
        },
    },
    {
        "name": "blocked",
        "description": "Signal that you are blocked and cannot continue without help.",
        "input_schema": {
            "type": "object",
            "properties": {"reason": {"type": "string"}},
            "required": ["reason"],
        },
    },
]


def execute_tool(name: str, inputs: Dict, conn, agent_name: str) -> str:
    from agents.state import (
        get_messages, get_pending_replies, post_message as db_post,
        reply_message as db_reply,
    )

    if name == "bash":
        return bash(inputs["command"], inputs.get("timeout", 60))
    if name == "read_file":
        return read_file(inputs["path"])
    if name == "write_file":
        return write_file(inputs["path"], inputs["content"])
    if name == "edit_file":
        return edit_file(inputs["path"], inputs["old_string"], inputs["new_string"])
    if name == "post_message":
        msg_id = db_post(conn, agent_name, inputs["to_agent"], inputs["body"])
        return f"[message {msg_id} sent to @{inputs['to_agent']}]"
    if name == "read_messages":
        inbox = get_messages(conn, agent_name)
        replies = get_pending_replies(conn, agent_name)
        parts = []
        for m in inbox:
            parts.append(f"[msg {m.id} FROM @{m.from_agent}]: {m.body}")
        for m in replies:
            parts.append(f"[reply to your msg {m.id} FROM @{m.to_agent}]: {m.reply}")
        return "\n".join(parts) if parts else "[no messages]"
    if name == "reply_message":
        db_reply(conn, inputs["message_id"], inputs["reply"])
        return f"[replied to message {inputs['message_id']}]"
    if name in ("done", "blocked"):
        return f"[{name}]"  # handled by caller
    return f"[unknown tool: {name}]"
