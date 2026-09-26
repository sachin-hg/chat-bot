import { useState } from "react";
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock'

function McpArchViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`@keyframes dashFlowM{to{stroke-dashoffset:-14}}`}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>MCP ARCHITECTURE — ONE PROTOCOL CONNECTING ANY HOST TO ANY SERVER</div>
      <svg viewBox="0 0 560 240" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="MCP architecture showing host, protocol layer, and server with tools resources and prompts">
        <defs>
          <marker id="mcp-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="mcp-arr-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/></marker>
          <marker id="mcp-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
        </defs>

        {/* MCP Host column */}
        <rect x="10" y="30" width="140" height="140" rx="6" fill="#313244" stroke="#89b4fa" strokeWidth="2"/>
        <text x="80" y="52" textAnchor="middle" fontSize="12" fill="#89b4fa" fontWeight="700">MCP Host</text>
        <text x="80" y="68" textAnchor="middle" fontSize="9" fill="#6c7086">Claude, Cursor, VS Code</text>
        <rect x="22" y="78" width="116" height="20" rx="4" fill="#1e1e2e" stroke="#89b4fa" strokeWidth="1"/>
        <text x="80" y="92" textAnchor="middle" fontSize="9" fill="#89b4fa">MCP Client A (stdio)</text>
        <rect x="22" y="104" width="116" height="20" rx="4" fill="#1e1e2e" stroke="#89b4fa" strokeWidth="1"/>
        <text x="80" y="118" textAnchor="middle" fontSize="9" fill="#89b4fa">MCP Client B (SSE)</text>
        <rect x="22" y="138" width="116" height="22" rx="4" fill="#45475a"/>
        <text x="80" y="153" textAnchor="middle" fontSize="9" fill="#cdd6f4">LLM conversation loop</text>

        {/* Protocol column */}
        <rect x="200" y="50" width="160" height="100" rx="6" fill="#313244" stroke="#f9e2af" strokeWidth="2"/>
        <text x="280" y="74" textAnchor="middle" fontSize="12" fill="#f9e2af" fontWeight="700">MCP Protocol</text>
        <text x="280" y="90" textAnchor="middle" fontSize="9" fill="#bac2de">JSON-RPC 2.0</text>
        <text x="280" y="104" textAnchor="middle" fontSize="9" fill="#6c7086">stdio / HTTP+SSE</text>
        <rect x="218" y="112" width="124" height="16" rx="4" fill="#1e1e2e"/>
        <text x="280" y="124" textAnchor="middle" fontSize="8" fill="#f9e2af">initialize → tools/list → tools/call</text>
        <text x="280" y="138" textAnchor="middle" fontSize="8" fill="#6c7086">USB-C for AI: one protocol, any host</text>

        {/* MCP Server column */}
        <rect x="410" y="30" width="140" height="140" rx="6" fill="#313244" stroke="#a6e3a1" strokeWidth="2"/>
        <text x="480" y="52" textAnchor="middle" fontSize="12" fill="#a6e3a1" fontWeight="700">MCP Server</text>
        <text x="480" y="68" textAnchor="middle" fontSize="9" fill="#6c7086">FastMCP / custom</text>
        <rect x="422" y="78" width="116" height="20" rx="4" fill="#1e1e2e" stroke="#94e2d5" strokeWidth="1"/>
        <text x="480" y="92" textAnchor="middle" fontSize="9" fill="#94e2d5">Tools (functions / actions)</text>
        <rect x="422" y="104" width="116" height="20" rx="4" fill="#1e1e2e" stroke="#a6e3a1" strokeWidth="1"/>
        <text x="480" y="118" textAnchor="middle" fontSize="9" fill="#a6e3a1">Resources (data / context)</text>
        <rect x="422" y="130" width="116" height="20" rx="4" fill="#1e1e2e" stroke="#cba6f7" strokeWidth="1"/>
        <text x="480" y="144" textAnchor="middle" fontSize="9" fill="#cba6f7">Prompts (templates)</text>

        {/* Host → Protocol request arrows */}
        <line x1="150" y1="88" x2="200" y2="88" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlowM 1s linear infinite'}} markerEnd="url(#mcp-arr-blue)"/>
        <text x="174" y="83" textAnchor="middle" fontSize="8" fill="#89b4fa">request</text>

        {/* Protocol → Server request arrows */}
        <line x1="360" y1="88" x2="410" y2="88" stroke="#89b4fa" strokeWidth="1.5" strokeDasharray="4 3" style={{animation:'dashFlowM 1s linear infinite'}} markerEnd="url(#mcp-arr-blue)"/>
        <text x="384" y="83" textAnchor="middle" fontSize="8" fill="#89b4fa">tools/call</text>

        {/* Server → Protocol response arrows */}
        <line x1="410" y1="118" x2="360" y2="118" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#mcp-arr-green)"/>
        <text x="384" y="113" textAnchor="middle" fontSize="8" fill="#a6e3a1">result</text>

        {/* Protocol → Host response */}
        <line x1="200" y1="118" x2="150" y2="118" stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#mcp-arr-teal)"/>
        <text x="174" y="113" textAnchor="middle" fontSize="8" fill="#94e2d5">result</text>

        {/* Bottom label */}
        <text x="280" y="200" textAnchor="middle" fontSize="10" fill="#f9e2af" fontWeight="700">USB-C for AI: one protocol, any host, any server</text>
        <text x="280" y="218" textAnchor="middle" fontSize="9" fill="#6c7086">Before MCP: 10 tools × 5 hosts = 50 integrations. With MCP: 15 total.</text>
      </svg>
    </div>
  );
}

function McpComparisonViz() {
  const rows = [
    { label: 'Transport', mcp: 'SSE / stdio', lg: 'in-process', direct: 'HTTP', mcpC: '#89b4fa', lgC: '#94e2d5', dirC: '#fab387' },
    { label: 'Discovery', mcp: 'Dynamic tool list', lg: 'Static registry', direct: 'Hardcoded', mcpC: '#89b4fa', lgC: '#94e2d5', dirC: '#fab387' },
    { label: 'Multi-client', mcp: 'Yes (any AI host)', lg: 'No (single graph)', direct: 'No', mcpC: '#a6e3a1', lgC: '#f38ba8', dirC: '#f38ba8' },
    { label: 'Best for', mcp: 'Shareable tools across AIs', lg: 'Complex agent logic', direct: 'Simple integrations', mcpC: '#cba6f7', lgC: '#f9e2af', dirC: '#fab387' },
  ];
  const colW = 148;

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>MCP vs LANGGRAPH vs DIRECT — WHEN TO USE EACH</div>
      <svg viewBox="0 0 560 160" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Comparison table of MCP, LangGraph, and Direct API approaches">
        {/* Header row */}
        <rect x="100" y="4" width={colW} height="26" rx="4" fill="#45475a"/>
        <text x={100 + colW/2} y="21" textAnchor="middle" fontSize="12" fill="#89b4fa" fontWeight="700">MCP</text>
        <rect x={100 + colW + 4} y="4" width={colW} height="26" rx="4" fill="#45475a"/>
        <text x={100 + colW + 4 + colW/2} y="21" textAnchor="middle" fontSize="12" fill="#94e2d5" fontWeight="700">LangGraph</text>
        <rect x={100 + (colW + 4) * 2} y="4" width={colW} height="26" rx="4" fill="#45475a"/>
        <text x={100 + (colW + 4) * 2 + colW/2} y="21" textAnchor="middle" fontSize="12" fill="#fab387" fontWeight="700">Direct API</text>

        {rows.map((r, i) => {
          const y = 36 + i * 32;
          const isBestFor = r.label === 'Best for';
          return (
            <g key={r.label}>
              {/* Row label */}
              <text x="94" y={y + 18} textAnchor="end" fontSize="10" fill="#6c7086" fontWeight="700">{r.label}</text>

              {/* MCP cell */}
              <rect x="100" y={y} width={colW} height="28" rx="4" fill={isBestFor ? '#89b4fa22' : '#313244'} stroke={isBestFor ? r.mcpC : '#45475a'} strokeWidth={isBestFor ? 1.5 : 1}/>
              <text x={100 + colW/2} y={y + 17} textAnchor="middle" fontSize="10" fill={r.mcpC}>{r.mcp}</text>

              {/* LangGraph cell */}
              <rect x={100 + colW + 4} y={y} width={colW} height="28" rx="4" fill={isBestFor ? '#94e2d522' : '#313244'} stroke={isBestFor ? r.lgC : '#45475a'} strokeWidth={isBestFor ? 1.5 : 1}/>
              <text x={100 + colW + 4 + colW/2} y={y + 17} textAnchor="middle" fontSize="10" fill={r.lgC}>{r.lg}</text>

              {/* Direct cell — FIX 1: best-for highlight uses orange (#fab38722), not teal */}
              <rect x={100 + (colW + 4) * 2} y={y} width={colW} height="28" rx="4" fill={isBestFor ? '#fab38722' : '#313244'} stroke={isBestFor ? r.dirC : '#45475a'} strokeWidth={isBestFor ? 1.5 : 1}/>
              <text x={100 + (colW + 4) * 2 + colW/2} y={y + 17} textAnchor="middle" fontSize="10" fill={r.dirC}>{r.direct}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type BoxKey = 'clientA' | 'clientB' | 'protocol' | 'serverA' | 'serverB';

const BOX_DETAILS: Record<BoxKey, { title: string; body: string; isCode?: boolean }> = {
  clientA: {
    title: 'MCP Client A (stdio)',
    body: 'stdio transport: pipes stdin/stdout. Secure — subprocess cannot access network. Used for local tools like filesystem, git.',
  },
  clientB: {
    title: 'MCP Client B (HTTP/SSE)',
    body: 'HTTP/SSE transport: network-based. Supports remote MCP servers. Requires auth tokens.',
  },
  protocol: {
    title: 'MCP Protocol',
    body: 'JSON-RPC 2.0 over the transport layer. Stateful sessions with capability negotiation.',
  },
  serverA: {
    title: 'MCP Server A (Tools)',
    body: `@mcp.tool()
def search_listings(city: str, max_price: int) -> list[dict]:
    """Search property listings."""
    return property_db.search(city=city, max_price=max_price)`,
    isCode: true,
  },
  serverB: {
    title: 'MCP Server B (Resources)',
    body: 'Resources expose read-only data: files, database rows, API responses. No side effects.',
  },
};

function McpDecompositionViz() {
  const [selected, setSelected] = useState<BoxKey | null>(null);

  const toggle = (key: BoxKey) => setSelected(prev => prev === key ? null : key);

  const detail = selected ? BOX_DETAILS[selected] : null;

  // Layout constants
  // viewBox "0 0 560 160"
  // Column centres: Host=100, Protocol=280, Servers=460
  // Host boxes
  const hx = 16, hw = 148;
  const cAy = 28, cBy = 86;
  const bh = 44;

  // Protocol box
  const px = 206, pw = 148, py = 56, pbh = 48;

  // Server boxes
  const sx = 396, sw = 148;
  const sAy = 28, sBy = 86;

  // Arrow y mid-points
  const arrowAy = cAy + bh / 2;   // 50
  const arrowBy = cBy + bh / 2;   // 108
  const protoMidY = py + pbh / 2; // 80

  const makeClickable = (key: BoxKey) => ({
    style: { cursor: 'pointer' as const },
    onClick: () => toggle(key),
    role: 'button' as const,
    'aria-pressed': selected === key,
  });

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>MCP DECOMPOSITION — HOST / PROTOCOL / SERVERS (click any box)</div>
      <svg viewBox="0 0 560 160" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="MCP decomposition diagram: Host App with two clients, MCP Protocol in the centre, two MCP servers on the right">
        <defs>
          <marker id="dec-arr-fwd" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6c7086"/></marker>
          <marker id="dec-arr-rev" markerWidth="7" markerHeight="7" refX="2" refY="3" orient="auto"><path d="M7,0 L7,6 L0,3 z" fill="#6c7086"/></marker>
        </defs>

        {/* ── Column header labels ── */}
        <text x={hx + hw/2} y="14" textAnchor="middle" fontSize="9" fill="#6c7086" fontWeight="700" letterSpacing="0.06em">HOST APP</text>
        <text x={px + pw/2} y="14" textAnchor="middle" fontSize="9" fill="#6c7086" fontWeight="700" letterSpacing="0.06em">MCP PROTOCOL</text>
        <text x={sx + sw/2} y="14" textAnchor="middle" fontSize="9" fill="#6c7086" fontWeight="700" letterSpacing="0.06em">MCP SERVERS</text>

        {/* ── Client A box ── */}
        <g {...makeClickable('clientA')}>
          <rect x={hx} y={cAy} width={hw} height={bh} rx="5"
            fill={selected === 'clientA' ? '#89b4fa22' : '#1e1e2e'}
            stroke={selected === 'clientA' ? '#89b4fa' : '#45475a'} strokeWidth={selected === 'clientA' ? 1.5 : 1}/>
          <text x={hx + hw/2} y={cAy + 17} textAnchor="middle" fontSize="10" fill="#89b4fa" fontWeight="700">MCP Client A</text>
          <text x={hx + hw/2} y={cAy + 31} textAnchor="middle" fontSize="9" fill="#6c7086">(stdio)</text>
        </g>

        {/* ── Client B box ── */}
        <g {...makeClickable('clientB')}>
          <rect x={hx} y={cBy} width={hw} height={bh} rx="5"
            fill={selected === 'clientB' ? '#89b4fa22' : '#1e1e2e'}
            stroke={selected === 'clientB' ? '#89b4fa' : '#45475a'} strokeWidth={selected === 'clientB' ? 1.5 : 1}/>
          <text x={hx + hw/2} y={cBy + 17} textAnchor="middle" fontSize="10" fill="#89b4fa" fontWeight="700">MCP Client B</text>
          <text x={hx + hw/2} y={cBy + 31} textAnchor="middle" fontSize="9" fill="#6c7086">(HTTP/SSE)</text>
        </g>

        {/* ── Protocol box ── */}
        <g {...makeClickable('protocol')}>
          <rect x={px} y={py} width={pw} height={pbh} rx="5"
            fill={selected === 'protocol' ? '#f9e2af22' : '#1e1e2e'}
            stroke={selected === 'protocol' ? '#f9e2af' : '#45475a'} strokeWidth={selected === 'protocol' ? 1.5 : 1}/>
          <text x={px + pw/2} y={py + 19} textAnchor="middle" fontSize="10" fill="#f9e2af" fontWeight="700">MCP Protocol</text>
          <text x={px + pw/2} y={py + 34} textAnchor="middle" fontSize="9" fill="#6c7086">JSON-RPC 2.0</text>
        </g>

        {/* ── Server A box ── */}
        <g {...makeClickable('serverA')}>
          <rect x={sx} y={sAy} width={sw} height={bh} rx="5"
            fill={selected === 'serverA' ? '#a6e3a122' : '#1e1e2e'}
            stroke={selected === 'serverA' ? '#a6e3a1' : '#45475a'} strokeWidth={selected === 'serverA' ? 1.5 : 1}/>
          <text x={sx + sw/2} y={sAy + 17} textAnchor="middle" fontSize="10" fill="#a6e3a1" fontWeight="700">MCP Server A</text>
          <text x={sx + sw/2} y={sAy + 31} textAnchor="middle" fontSize="9" fill="#6c7086">(Tools)</text>
        </g>

        {/* ── Server B box ── */}
        <g {...makeClickable('serverB')}>
          <rect x={sx} y={sBy} width={sw} height={bh} rx="5"
            fill={selected === 'serverB' ? '#94e2d522' : '#1e1e2e'}
            stroke={selected === 'serverB' ? '#94e2d5' : '#45475a'} strokeWidth={selected === 'serverB' ? 1.5 : 1}/>
          <text x={sx + sw/2} y={sBy + 17} textAnchor="middle" fontSize="10" fill="#94e2d5" fontWeight="700">MCP Server B</text>
          <text x={sx + sw/2} y={sBy + 31} textAnchor="middle" fontSize="9" fill="#6c7086">(Resources)</text>
        </g>

        {/* ── Arrows: Client A ↔ Protocol ↔ Server A ── */}
        {/* Client A → Protocol */}
        <line x1={hx + hw} y1={arrowAy} x2={px} y2={protoMidY} stroke="#6c7086" strokeWidth="1.2" markerEnd="url(#dec-arr-fwd)"/>
        {/* Protocol → Client A (return) */}
        <line x1={px} y1={protoMidY + 4} x2={hx + hw} y2={arrowAy + 4} stroke="#6c7086" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#dec-arr-rev)"/>

        {/* Protocol → Server A */}
        <line x1={px + pw} y1={protoMidY} x2={sx} y2={arrowAy} stroke="#6c7086" strokeWidth="1.2" markerEnd="url(#dec-arr-fwd)"/>
        {/* Server A → Protocol (return) */}
        <line x1={sx} y1={arrowAy + 4} x2={px + pw} y2={protoMidY + 4} stroke="#6c7086" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#dec-arr-rev)"/>

        {/* Client B → Protocol */}
        <line x1={hx + hw} y1={arrowBy} x2={px} y2={protoMidY + 4} stroke="#6c7086" strokeWidth="1.2" markerEnd="url(#dec-arr-fwd)"/>
        {/* Protocol → Client B (return) */}
        <line x1={px} y1={protoMidY + 8} x2={hx + hw} y2={arrowBy + 4} stroke="#6c7086" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#dec-arr-rev)"/>

        {/* Protocol → Server B */}
        <line x1={px + pw} y1={protoMidY + 4} x2={sx} y2={arrowBy} stroke="#6c7086" strokeWidth="1.2" markerEnd="url(#dec-arr-fwd)"/>
        {/* Server B → Protocol (return) */}
        <line x1={sx} y1={arrowBy + 4} x2={px + pw} y2={protoMidY + 8} stroke="#6c7086" strokeWidth="1.2" strokeDasharray="3 2" markerEnd="url(#dec-arr-rev)"/>

        {/* Arrow labels */}
        <text x={(hx + hw + px) / 2} y={((arrowAy + protoMidY) / 2) - 4} textAnchor="middle" fontSize="8" fill="#45475a">stdio</text>
        <text x={(px + pw + sx) / 2} y={((protoMidY + arrowAy) / 2) - 4} textAnchor="middle" fontSize="8" fill="#45475a">tools/call</text>
        <text x={(hx + hw + px) / 2} y={((arrowBy + protoMidY) / 2) + 18} textAnchor="middle" fontSize="8" fill="#45475a">HTTP/SSE</text>
        <text x={(px + pw + sx) / 2} y={((protoMidY + arrowBy) / 2) + 18} textAnchor="middle" fontSize="8" fill="#45475a">resources</text>
      </svg>

      {/* Detail panel */}
      {detail && (
        <div style={{
          marginTop: '12px',
          background: '#1e1e2e',
          border: '1px solid #45475a',
          borderRadius: '6px',
          padding: '12px 16px',
          fontSize: '12px',
          lineHeight: 1.6,
          color: '#cdd6f4',
        }}>
          <div style={{fontWeight: 700, color: '#f9e2af', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em'}}>{detail.title}</div>
          {detail.isCode ? (
            <pre style={{margin: 0, fontFamily: 'monospace', fontSize: '11px', color: '#a6e3a1', whiteSpace: 'pre', overflowX: 'auto'}}>{detail.body}</pre>
          ) : (
            <span>{detail.body}</span>
          )}
        </div>
      )}
    </div>
  );
}

const CODE_1 = `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Housing Property Search")

@mcp.tool()
def search_listings(city: str, max_price: int, bedrooms: int = 2) -> list[dict]:
    """Search property listings by city, price, and bedroom count.
    Args:
        city: City name, e.g. 'Mumbai', 'Bangalore'
        max_price: Maximum price in INR
        bedrooms: Number of bedrooms required (default: 2)
    """
    return property_db.search(city=city, max_price=max_price, bedrooms=bedrooms)

@mcp.resource("listings://{city}/summary")
def city_summary(city: str) -> str:
    """Get a market summary for a city."""
    stats = property_db.get_city_stats(city)
    return f"{city}: {stats['count']} listings, avg ₹{stats['avg_price']:,}"

@mcp.prompt()
def property_advisor(city: str, budget: int) -> str:
    """Property advisor persona for a specific city and budget."""
    return f"""You are a Housing.com advisor for {city}.
    The user's budget is ₹{budget:,}. Focus on value-for-money.
    Always mention price per square foot when comparing properties."""

if __name__ == "__main__":
    mcp.run()               # stdio — default
    # mcp.run(transport="sse", port=8001)  # HTTP+SSE for cloud`;

const CODE_2 = `{"jsonrpc":"2.0","id":1,"method":"initialize",
 "params":{"protocolVersion":"2025-11-25","capabilities":{"tools":{}}}}

{"jsonrpc":"2.0","id":2,"method":"tools/list"}
// → [{"name":"search_listings","inputSchema":{"type":"object","properties":{...}}}]

{"jsonrpc":"2.0","id":3,"method":"tools/call",
 "params":{"name":"search_listings","arguments":{"city":"Mumbai","max_price":20000000}}}`;

const CODE_3 = `// .claude/mcp.json
{
  "mcpServers": {
    "housing-search": {
      "command": "python",
      "args": ["src/mcp/housing_server.py"],
      "env": { "DATABASE_URL": "\${DATABASE_URL}" }
    },
    "housing-remote": {
      "type": "sse",
      "url": "https://mcp.housing.com/sse",
      "headers": { "Authorization": "Bearer \${MCP_TOKEN}" }
    }
  }
}`;

const CODE_4 = `from mcp.server.fastmcp import FastMCP
from sqlalchemy import text
from src.db.engine import get_engine

mcp = FastMCP("Housing.com Agent Tools")

@mcp.tool()
async def search_properties(city: str, bedrooms: int | None = None,
                             max_price: int | None = None, limit: int = 10) -> list[dict]:
    """Search Housing.com listings with optional filters."""
    async with get_engine().connect() as conn:
        q = "SELECT * FROM properties WHERE city = :city"
        p: dict = {"city": city}
        if bedrooms:   q += " AND bedrooms = :bedrooms";  p["bedrooms"] = bedrooms
        if max_price:  q += " AND price <= :max_price";   p["max_price"] = max_price
        q += " ORDER BY price ASC LIMIT :limit"; p["limit"] = limit
        return [dict(r) for r in (await conn.execute(text(q), p)).mappings()]

@mcp.tool()
def calculate_emi(principal: int, annual_rate: float, years: int) -> dict:
    """Calculate monthly EMI, total payment, and total interest for a home loan."""
    r = annual_rate / 100 / 12
    n = years * 12
    emi = principal * r * (1 + r)**n / ((1 + r)**n - 1)
    return {"emi_monthly": round(emi), "total_payment": round(emi * n),
            "total_interest": round(emi * n - principal)}

@mcp.resource("market://{city}/stats")
async def market_stats(city: str) -> str:
    """Real-time market statistics for a city."""
    async with get_engine().connect() as conn:
        row = (await conn.execute(text(
            "SELECT COUNT(*) cnt, AVG(price) avg_price, MIN(price) min_price "
            "FROM properties WHERE city = :city"), {"city": city}
        )).mappings().first()
        return f"{city}: {row['cnt']} listings | Avg ₹{row['avg_price']:,.0f} | From ₹{row['min_price']:,}"

if __name__ == "__main__":
    mcp.run()`;

export function Mod40() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain MCP's three primitives (tools, resources, prompts) and two transport types</li>
          <li>Build a FastMCP server exposing tools with auto-generated JSON schemas</li>
          <li>Register an MCP server in Claude Code's configuration</li>
          <li>Implement the full Housing.com MCP server with property search, EMI calc, and market stats</li>
          <li>Apply MCP security best practices: scoped capabilities, input validation, secret injection</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~75 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 26 (@tool pattern)</span>
        </div>
      </div>

      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com could expose its property search, EMI calculator, and locality data as an MCP server — making it usable from Claude Desktop and Cursor without custom integrations. The SQL injection section directly applies to Housing.com's <code>search_properties</code> parameterised query requirements.
      </div>

      <McpArchViz />
      <h2>43.1 What MCP Is</h2>
      <p>MCP (Model Context Protocol) is the "USB-C for AI": a standard protocol so any LLM host (Claude Desktop, Claude Code, Cursor, VS Code) can connect to any tool server without custom integration code. Before MCP: 10 tools × 5 hosts = 50 custom integrations. With MCP: 10 servers × 5 hosts = 15 total (each writes one adapter).</p>
      <McpDecompositionViz />
      <table>
        <tbody>
          <tr><th>Primitive</th><th>Analogy</th><th>Purpose</th><th>Who calls it?</th></tr>
          <tr><td><strong>Tools</strong></td><td>POST endpoint</td><td>Execute code, cause side effects</td><td>LLM during a conversation turn</td></tr>
          <tr><td><strong>Resources</strong></td><td>GET endpoint</td><td>Load data/context into LLM</td><td>Host application at session start</td></tr>
          <tr><td><strong>Prompts</strong></td><td>Prompt templates</td><td>Reusable LLM prompt patterns</td><td>User explicitly via slash commands</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>Protocol lifecycle — initialize first, always</strong>
        (1) Host always sends <code>initialize</code> first — server responds with its capabilities.
        (2) Client and server agree on a protocol version; if incompatible, the client closes.
        (3) Host calls <code>tools/list</code> to discover tools.
        (4) During conversation, host sends <code>tools/call</code> when the LLM requests a tool.
        <br /><br />
        <strong>Interview pattern:</strong> initialize → negotiate → list → call → list again if server updates (tools can change at runtime in MCP v2025+).
      </div>

      <h2>43.2 Building an MCP Server with FastMCP</h2>
      <CodeBlock title="FastMCP Server — Tools, Resources, and Prompts" language="python" keyLine={4} keyNote="@mcp.tool() auto-generates JSON schema from type hints">{CODE_1}</CodeBlock>

      <h2>43.3 Wire Protocol (JSON-RPC 2.0)</h2>
      <p>MCP uses <strong>JSON-RPC 2.0</strong> as its wire format — a simple RPC protocol where every request and response is a JSON object. REST has many endpoints (one URL per operation). JSON-RPC has one endpoint and the operation name goes inside the JSON body as a <code>"method"</code> field. The <code>"id"</code> field is a correlation ID — responses carry the same <code>"id"</code> so the client can match async responses to their requests.</p>
      <CodeBlock title="JSON-RPC 2.0 Wire Protocol — initialize, list, call" language="json" keyLine={2} keyNote="protocolVersion negotiated on initialize; mismatch closes connection">{CODE_2}</CodeBlock>
      <p>FastMCP handles the entire protocol automatically. Your Python function signature is all the schema you need to write.</p>

      <h2>43.4 Registering in Claude Code</h2>
      <CodeBlock title="MCP Server Registration — .claude/mcp.json" language="json" keyLine={9} keyNote="env injects secrets at runtime; never hardcode in server code">{CODE_3}</CodeBlock>

      <h2>43.5 Housing.com MCP Server</h2>
      <CodeBlock title="Housing.com MCP Server — search, EMI, market stats" language="python" keyLine={13} keyNote="SQLAlchemy named params prevent LLM-controlled SQL injection">{CODE_4}</CodeBlock>

      <h2>43.6 Security Considerations</h2>
      <div className="callout callout-warn">
        <strong>stdio transport security model — runs with HOST permissions</strong>
        stdio transport runs the MCP server as a subprocess of the host application.
        The subprocess <em>inherits the host's OS permissions</em> — it can read files in your home directory,
        access environment variables, and make network calls with your user credentials.
        <br /><br />
        This is intentional: stdio servers are trusted tools you explicitly install. But: (1) never install
        MCP servers from untrusted sources; (2) validate all inputs — an LLM-controlled server could pass
        adversarial args (prompt injection); (3) for production server-to-server use, prefer HTTP+SSE
        transport with explicit auth headers.
      </div>
      <table>
        <tbody>
          <tr><th>Risk</th><th>Mitigation</th></tr>
          <tr><td>LLM sends malformed inputs</td><td>Validate all tool inputs; treat as user input (potential injection)</td></tr>
          <tr><td>Unbounded tool loops</td><td>Rate limit tool calls; add max_calls guard in host config</td></tr>
          <tr><td>Secrets in server code</td><td>Inject via <code>env</code> in mcp.json — never hardcode</td></tr>
          <tr><td>Over-exposed API surface</td><td>Only expose tools needed for the task — not the entire API</td></tr>
          <tr><td>Write side effects without approval</td><td>Claude Code prompts user before calling side-effect tools</td></tr>
          <tr><td>SQL injection via LLM-controlled args</td><td>Use SQLAlchemy <code>text()</code> with named bound parameters — NOT f-strings</td></tr>
        </tbody>
      </table>
      <div className="callout callout-info">
        <strong>Is the Housing.com search_properties SQL safe from injection?</strong>
        Yes. SQLAlchemy's <code>text("... WHERE city = :city")</code> with <code>{'{"city": city}'}</code> as the params dict is
        safe — the driver substitutes values as parameterised bindings at the database protocol level.
        Contrast with <strong>UNSAFE</strong>: <code>{"f\"WHERE city = '{city}'\""}</code> — this IS vulnerable to SQL injection.
        The rule: always use named parameters (<code>:city</code>) or positional parameters (<code>?</code>) — never f-strings.
      </div>

      <McpComparisonViz />

      <h2>43.7 Production Example: Gortex — Codebase Knowledge MCP Server</h2>
      <p><a href="https://gortex.dev" target="_blank" rel="noopener noreferrer"><strong>Gortex</strong></a> (github.com/zzet/gortex) is an open-source MCP server that indexes an entire codebase into an in-memory knowledge graph and exposes it to AI coding agents via 100+ MCP tools. It demonstrates everything in this module applied to a real production tool: tools, resources, JSON-RPC, and stdio transport.</p>
      <p>It is directly relevant to this course: Claude Code uses Gortex to reduce the "10 file reads + 3 searches per task" pattern down to a single structured graph query — their claim is up to <strong>50× token reduction per operation</strong>. Less context = cheaper, faster, and less likely to hit context limits (the 1M-token problem from Module 9).</p>

      <div className="callout callout-info">
        <strong>How Gortex works — the three-tier extraction pipeline</strong>
        <ol>
          <li><strong>Deep parse (30 languages):</strong> Bespoke tree-sitter parsers extract ASTs — functions, classes, imports, types, call graphs, dataflow</li>
          <li><strong>Regex extraction (~60 more languages):</strong> Pattern-based for languages without tree-sitter grammars</li>
          <li><strong>Signature-only (165+ more):</strong> Extracts function signatures and file structure even for unknown file types</li>
        </ol>
        Result: a queryable knowledge graph with edges for "calls", "imports", "inherits", "references". Also includes: <strong>BM25 + GloVe semantic hybrid search</strong>, clone detection (MinHash), LSP bridge (16 language servers), dataflow/taint analysis, and <strong>speculative edits</strong> — preview impact of a change across the codebase without writing to disk.
      </div>

      <table>
        <tbody>
          <tr><th>MCP Primitive</th><th>What Gortex exposes</th></tr>
          <tr><td><strong>Tools</strong></td><td>100+ tools: <code>find_symbol</code>, <code>get_callers</code>, <code>get_callees</code>, <code>search_semantic</code>, <code>get_file_graph</code>, <code>diff_speculative</code>, <code>find_clones</code>, <code>get_dataflow</code>, ...</td></tr>
          <tr><td><strong>Resources</strong></td><td>URI templates: <code>gortex://file/{"{path}"}</code>, <code>gortex://symbol/{"{name}"}</code>, <code>gortex://cluster/{"{id}"}</code></td></tr>
          <tr><td><strong>Transport</strong></td><td>stdio (for local AI coding agents), HTTP + SSE (for remote/multi-user), embedded web UI</td></tr>
          <tr><td><strong>Security</strong></td><td>Read-only by default. Apache 2.0, Sigstore-signed SLSA Level 3 releases. Zero external dependencies — 100% local, no telemetry.</td></tr>
        </tbody>
      </table>

      <CodeBlock title="Gortex Install and Start" language="bash" keyLine={6} keyNote="gortex serve starts MCP on stdio and web UI on :7474">{`# Install (20MB static binary, no runtime deps)
brew install zzet/tap/gortex          # macOS
# or download from gortex.dev/releases

# Start Gortex in your project root
cd /path/to/your/project
gortex serve                          # starts MCP server on stdio + web UI on :7474

# Register in Claude Code (.claude/mcp.json)
# Gortex auto-detects Claude Code, Cursor, Windsurf, Cline on startup`}</CodeBlock>

      <CodeBlock title="Gortex MCP Registration — .claude/mcp.json" language="json" keyLine={4} keyNote="--stdio flag selects stdio transport for local agent use">{`// .claude/mcp.json — register Gortex as an MCP server
{
  "mcpServers": {
    "gortex": {
      "command": "gortex",
      "args": ["serve", "--stdio"],
      "env": {}
    }
  }
}`}</CodeBlock>

      <CodeBlock title="Gortex vs Raw File Reads — 50x Token Reduction" language="python" keyLine={10} keyNote="find_symbol returns callers/callees in one call vs 10+ file reads">{`# What happens when Claude Code uses Gortex vs raw file reads

# WITHOUT Gortex — typical AI coding agent pattern:
# 1. Read file A (2000 tokens)
# 2. Read file B (1500 tokens)
# 3. grep for "classify_node" (500 tokens of context)
# 4. Read file C (800 tokens)
# ... 10+ tool calls, ~15,000 tokens consumed

# WITH Gortex — single MCP tool call:
# Tool: find_symbol("classify_node")
# Returns: {file, line, signature, callers: [...], callees: [...], imports: [...]}
# ~300 tokens, one call — 50× reduction

# Housing.com codebase example: find what calls classify_node
# Gortex MCP call (JSON-RPC):
# {"jsonrpc":"2.0","method":"tools/call","params":{
#   "name":"get_callers",
#   "arguments":{"symbol":"classify_node","depth":2}
# }}
# Returns the full call chain without reading any files`}</CodeBlock>

      <div className="viz-2col" style={{margin:'12px 0'}}>
        <div className="viz-col"><div className="viz-col-title">When Gortex helps most</div>
          Large codebases (10K+ files) where AI agents waste 80% of tokens just finding relevant code · Multi-file refactors where you need to know all callers before changing a signature · Security audits (taint analysis: which inputs reach which sinks) · Architecture reviews (cluster detection, dependency graph visualisation)
        </div>
        <div className="viz-col"><div className="viz-col-title" style={{color:'#f38ba8'}}>Limitations</div>
          In-memory graph — monorepos with millions of files need significant RAM · Not a replacement for reading file contents (it reads symbols, not prose/comments) · Graph quality depends on tree-sitter grammar completeness per language · Web UI on :7474 is read-only — edits still go through the coding agent
        </div>
      </div>

      <div className="callout callout-tip">
        <strong>Why Gortex is a good MCP case study</strong><br/>
        It implements <em>all three MCP primitives</em> (tools + resources + prompts), uses <em>both transport modes</em> (stdio + HTTP SSE), demonstrates <em>hybrid search</em> as a tool (§37.2 pattern), and shows how to expose a complex backend (AST + graph DB) as clean, typed MCP tools. Reading its source is one of the best ways to understand how to design an MCP server at scale.
      </div>

      <div className="callout callout-maang">
        <strong>MAANG Interview: "How do you expose backend APIs to an LLM agent safely?"</strong>
        {" "}→ MCP server with explicit tool definitions. FastMCP auto-generates JSON schema → rejects malformed inputs. Separate read/write tools with different auth scopes. Register only needed tools — not the whole API surface. HITL approval for write operations. Real example: Gortex exposes 100+ read-only codebase tools with no write access — the agent can <em>understand</em> the codebase but only <em>modify</em> it through the IDE's own diff flow.
      </div>

      <QuizSection moduleId={43} title="Module 43: MCP" contentHint="MCP USB-C analogy one connector any host any server, three primitives tools resources prompts, stdio vs HTTP SSE transport types, FastMCP tool decorator auto schema from type hints, resource URI template path parameters, prompt reusable template persona, JSON-RPC 2.0 initialize tools/list tools/call, mcp.json registration command env secrets injection, Housing.com search_properties calculate_emi market_stats, security scoped capabilities input validation no hardcoded keys, Gortex codebase knowledge graph MCP server three-tier extraction tree-sitter BM25+GloVe hybrid search 50x token reduction speculative edits" />
    </>
  );
}
