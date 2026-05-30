"""
Shared state for the multi-agent system.
Persisted to SQLite after every tool call so any agent can resume mid-ticket.
"""
import json
import sqlite3
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

STATE_DB = Path(__file__).parent / ".state" / "agents.db"


@dataclass
class AgentProgress:
    """What a single agent is currently doing. Serialised to DB after every step."""
    agent:          str
    ticket:         Optional[str] = None       # e.g. "CHAT-P-001"
    step:           str = "idle"               # idle|reading_spec|implementing|committing|done|blocked
    notes:          str = ""                   # scratch-pad: things the agent has figured out
    history:        List[Dict] = field(default_factory=list)  # full Claude conversation history
    blocked_reason: Optional[str] = None


@dataclass
class BusMessage:
    id:         int
    from_agent: str
    to_agent:   str
    body:       str
    reply:      Optional[str] = None   # None = unread/pending


@dataclass
class SprintState:
    sprint:   int = 1
    cycle:    int = 0           # increments each supervisor loop; standup fires every 8 cycles


def init_db() -> sqlite3.Connection:
    STATE_DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(STATE_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS agent_progress (
            agent      TEXT PRIMARY KEY,
            data       TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS bus (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            from_agent TEXT NOT NULL,
            to_agent   TEXT NOT NULL,
            body       TEXT NOT NULL,
            reply      TEXT
        );
        CREATE TABLE IF NOT EXISTS sprint_state (
            id       INTEGER PRIMARY KEY CHECK (id = 1),
            sprint   INTEGER NOT NULL DEFAULT 1,
            cycle    INTEGER NOT NULL DEFAULT 0
        );
        INSERT OR IGNORE INTO sprint_state (id, sprint, cycle) VALUES (1, 1, 0);
    """)
    conn.commit()
    return conn


# ── Agent progress ────────────────────────────────────────────────────────

def load_progress(conn: sqlite3.Connection, agent: str) -> AgentProgress:
    row = conn.execute("SELECT data FROM agent_progress WHERE agent = ?", (agent,)).fetchone()
    if row:
        return AgentProgress(**json.loads(row["data"]))
    return AgentProgress(agent=agent)


def save_progress(conn: sqlite3.Connection, p: AgentProgress) -> None:
    data = json.dumps(asdict(p))
    conn.execute(
        "INSERT OR REPLACE INTO agent_progress (agent, data) VALUES (?, ?)",
        (p.agent, data),
    )
    conn.commit()


# ── Bus ───────────────────────────────────────────────────────────────────

def post_message(conn: sqlite3.Connection, from_agent: str, to_agent: str, body: str) -> int:
    cur = conn.execute(
        "INSERT INTO bus (from_agent, to_agent, body) VALUES (?, ?, ?)",
        (from_agent, to_agent, body),
    )
    conn.commit()
    return cur.lastrowid


def get_messages(conn: sqlite3.Connection, to_agent: str) -> List[BusMessage]:
    rows = conn.execute(
        "SELECT * FROM bus WHERE to_agent = ? AND reply IS NULL", (to_agent,)
    ).fetchall()
    return [BusMessage(**dict(r)) for r in rows]


def reply_message(conn: sqlite3.Connection, msg_id: int, reply: str) -> None:
    conn.execute("UPDATE bus SET reply = ? WHERE id = ?", (reply, msg_id))
    conn.commit()


def get_pending_replies(conn: sqlite3.Connection, from_agent: str) -> List[BusMessage]:
    rows = conn.execute(
        "SELECT * FROM bus WHERE from_agent = ? AND reply IS NOT NULL", (from_agent,)
    ).fetchall()
    return [BusMessage(**dict(r)) for r in rows]


# ── Sprint state ──────────────────────────────────────────────────────────

def load_sprint(conn: sqlite3.Connection) -> SprintState:
    row = conn.execute("SELECT sprint, cycle FROM sprint_state WHERE id = 1").fetchone()
    return SprintState(sprint=row["sprint"], cycle=row["cycle"])


def save_sprint(conn: sqlite3.Connection, s: SprintState) -> None:
    conn.execute("UPDATE sprint_state SET sprint = ?, cycle = ? WHERE id = 1", (s.sprint, s.cycle))
    conn.commit()
