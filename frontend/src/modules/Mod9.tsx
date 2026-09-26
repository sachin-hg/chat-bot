import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

function JWTAnatomyViz() {
  const [activeSection, setActiveSection] = useState<'header'|'payload'|'signature'>('header');

  const sections = {
    header: {
      color: '#f38ba8',
      encoded: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      decoded: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}',
    },
    payload: {
      color: '#89b4fa',
      encoded: 'eyJ1c2VyX2lkIjoiMTIzIn0',
      decoded: '{\n  "user_id": "123",\n  "role": "authenticated",\n  "exp": 1700000000\n}',
    },
    signature: {
      color: '#a6e3a1',
      encoded: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      decoded: 'HMACSHA256(\n  base64url(header) + "." +\n  base64url(payload),\n  secret\n)',
    },
  };

  const active = sections[activeSection];

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow9jwt { to { stroke-dashoffset: -14; } }
        .jwt-dash { animation: dashFlow9jwt 1s linear infinite; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>JWT ANATOMY — HEADER.PAYLOAD.SIGNATURE</div>

      <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
        {(['header','payload','signature'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            background: activeSection === s ? '#89b4fa22' : '#313244',
            color: activeSection === s ? '#89b4fa' : '#cdd6f4',
            border: `1px solid ${activeSection === s ? '#89b4fa' : '#45475a'}`,
            borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor:'pointer',marginRight:'8px'
          }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      <svg viewBox="0 0 560 200" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="JWT structure diagram">
        <defs>
          <marker id="jwt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
        </defs>

        {/* JWT token bar */}
        <rect x="10" y="14" width="160" height="28" rx="6" fill="#f38ba822" stroke={activeSection==='header'?'#f38ba8':'#45475a'} strokeWidth="1.5"/>
        <rect x="176" y="14" width="100" height="28" rx="6" fill="#89b4fa22" stroke={activeSection==='payload'?'#89b4fa':'#45475a'} strokeWidth="1.5"/>
        <rect x="282" y="14" width="160" height="28" rx="6" fill="#a6e3a122" stroke={activeSection==='signature'?'#a6e3a1':'#45475a'} strokeWidth="1.5"/>

        <text x="90" y="32" textAnchor="middle" fontSize="9" fill="#f38ba8" fontFamily="monospace">eyJhbGciOiJIUzI1NiJ9</text>
        <text x="226" y="32" textAnchor="middle" fontSize="9" fill="#89b4fa" fontFamily="monospace">eyJ1c2VyX2lkIn0</text>
        <text x="362" y="32" textAnchor="middle" fontSize="9" fill="#a6e3a1" fontFamily="monospace">SflKxwRJSMeKKF2QT4fw</text>

        <text x="166" y="32" textAnchor="middle" fontSize="13" fill="#6c7086">.</text>
        <text x="274" y="32" textAnchor="middle" fontSize="13" fill="#6c7086">.</text>

        <text x="90" y="56" textAnchor="middle" fontSize="10" fill="#f38ba8">HEADER</text>
        <text x="226" y="56" textAnchor="middle" fontSize="10" fill="#89b4fa">PAYLOAD</text>
        <text x="362" y="56" textAnchor="middle" fontSize="10" fill="#a6e3a1">SIGNATURE</text>

        {/* Animated arrow */}
        <line x1={activeSection==='header'?90:activeSection==='payload'?226:362} y1="62"
              x2={activeSection==='header'?90:activeSection==='payload'?226:362} y2="82"
              stroke="#6c7086" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#jwt-arrow)"
              className="jwt-dash"/>

        {/* Decoded box */}
        <rect x="10" y="88" width="250" height="100" rx="6" fill="#1e1e2e" stroke={active.color} strokeWidth="1.5"/>
        <text x="20" y="104" fontSize="10" fill="#6c7086">ENCODED</text>
        <text x="20" y="118" fontSize="9" fill={active.color} fontFamily="monospace">{active.encoded.slice(0,34) + '…'}</text>

        {/* Arrow from encoded to decoded */}
        <line x1="265" y1="138" x2="295" y2="138" stroke="#6c7086" strokeWidth="1.5" markerEnd="url(#jwt-arrow)"/>
        <text x="266" y="133" fontSize="9" fill="#6c7086">base64</text>
        <text x="266" y="144" fontSize="9" fill="#6c7086">decode</text>

        <rect x="300" y="88" width="250" height="100" rx="6" fill="#1e1e2e" stroke={active.color} strokeWidth="1.5"/>
        <text x="310" y="104" fontSize="10" fill="#6c7086">DECODED</text>
        {active.decoded.split('\n').map((line, i) => (
          <text key={i} x="310" y={118 + i * 14} fontSize="10" fill={active.color} fontFamily="monospace">{line}</text>
        ))}
      </svg>

      <div style={{marginTop:'10px',padding:'8px 12px',background:'#313244',borderRadius:'6px',fontSize:'0.78rem',color:'#f9e2af',borderLeft:'3px solid #f9e2af'}}>
        Never put sensitive data in payload — it is base64 encoded, not encrypted. Anyone can decode it.
      </div>
    </div>
  );
}

function RBACTierViz() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <style>{`
        @keyframes dashFlow9rbac { to { stroke-dashoffset: -14; } }
        .rbac-dash { animation: dashFlow9rbac 1s linear infinite; }
      `}</style>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>RBAC TIER SYSTEM — ROUTE BY PERMISSION AND COST SIMULTANEOUSLY</div>

      <svg viewBox="0 0 560 220" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="RBAC tier routing diagram">
        <defs>
          <marker id="rbac-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/>
          </marker>
          <marker id="rbac-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/>
          </marker>
          <marker id="rbac-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/>
          </marker>
          <marker id="rbac-arr-yellow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/>
          </marker>
          <marker id="rbac-arr-gray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6c7086"/>
          </marker>
        </defs>

        {/* Incoming request */}
        <rect x="6" y="92" width="80" height="36" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1.5"/>
        <text x="46" y="107" textAnchor="middle" fontSize="10" fill="#cdd6f4">Incoming</text>
        <text x="46" y="120" textAnchor="middle" fontSize="10" fill="#cdd6f4">Request</text>

        {/* Arrow to route node */}
        <line x1="86" y1="110" x2="118" y2="110" stroke="#6c7086" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#rbac-arr-gray)" className="rbac-dash"/>

        {/* Route node */}
        <rect x="118" y="86" width="88" height="48" rx="6" fill="#45475a" stroke="#cba6f7" strokeWidth="1.5"/>
        <text x="162" y="106" textAnchor="middle" fontSize="10" fill="#cba6f7" fontWeight="bold">route_node</text>
        <text x="162" y="120" textAnchor="middle" fontSize="9" fill="#bac2de">reads intent tier</text>
        <text x="162" y="131" textAnchor="middle" fontSize="9" fill="#bac2de">from REGISTRY</text>

        {/* Branch lines - horizontal to vertical junction */}
        <line x1="206" y1="110" x2="240" y2="110" stroke="#6c7086" strokeWidth="1.5"/>
        {/* Vertical spine */}
        <line x1="240" y1="30" x2="240" y2="194" stroke="#6c7086" strokeWidth="1.5"/>

        {/* Tier 0 - red */}
        <line x1="240" y1="30" x2="272" y2="30" stroke="#f38ba8" strokeWidth="1.5" markerEnd="url(#rbac-arr-red)"/>
        <rect x="272" y="10" width="272" height="40" rx="6" fill="#f38ba822" stroke="#f38ba8" strokeWidth="1.5"/>
        <text x="284" y="26" fontSize="10" fill="#f38ba8" fontWeight="bold">Tier 0 — auth-gated</text>
        <text x="284" y="40" fontSize="9" fill="#bac2de">contact_seller → requires authenticated JWT claim</text>
        <text x="520" y="26" textAnchor="end" fontSize="9" fill="#f38ba8">$0 (RBAC check)</text>

        {/* Tier 1 - blue */}
        <line x1="240" y1="76" x2="272" y2="76" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#rbac-arr-blue)"/>
        <rect x="272" y="56" width="272" height="40" rx="6" fill="#89b4fa22" stroke="#89b4fa" strokeWidth="1.5"/>
        <text x="284" y="72" fontSize="10" fill="#89b4fa" fontWeight="bold">Tier 1 — structured action</text>
        <text x="284" y="86" fontSize="9" fill="#bac2de">search_properties → any user, structured action</text>
        <text x="520" y="72" textAnchor="end" fontSize="9" fill="#89b4fa">$0.001 (tool call)</text>

        {/* Tier 2 - green */}
        <line x1="240" y1="130" x2="272" y2="130" stroke="#a6e3a1" strokeWidth="1.5" markerEnd="url(#rbac-arr-green)"/>
        <rect x="272" y="110" width="272" height="40" rx="6" fill="#a6e3a122" stroke="#a6e3a1" strokeWidth="1.5"/>
        <text x="284" y="126" fontSize="10" fill="#a6e3a1" fontWeight="bold">Tier 2 — template response</text>
        <text x="284" y="140" fontSize="9" fill="#bac2de">how_emi_works → any user, template response</text>
        <text x="520" y="126" textAnchor="end" fontSize="9" fill="#a6e3a1">$0.0001 (template)</text>

        {/* Tier 3 - yellow */}
        <line x1="240" y1="184" x2="272" y2="184" stroke="#f9e2af" strokeWidth="1.5" markerEnd="url(#rbac-arr-yellow)"/>
        <rect x="272" y="164" width="272" height="40" rx="6" fill="#f9e2af22" stroke="#f9e2af" strokeWidth="1.5"/>
        <text x="284" y="180" fontSize="10" fill="#f9e2af" fontWeight="bold">Tier 3 — LLM response</text>
        <text x="284" y="194" fontSize="9" fill="#bac2de">complex_query → any user, LLM response</text>
        <text x="520" y="180" textAnchor="end" fontSize="9" fill="#f9e2af">$0.005 (LLM)</text>
      </svg>
    </div>
  );
}

const CODE_AUTH = `from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def require_auth(token = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=["HS256"])
        return payload  # {"user_id": "...", "role": "authenticated", "tenant_id": "..."}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

@router.post("/chat")
async def chat_endpoint(req: ChatRequest, claims = Depends(require_auth)):
    state = BotState(
        raw_message=req.message,
        session_id=req.session_id,
        user_id=claims["user_id"],    # ← from validated token, NOT from request body
        tenant_id=claims["tenant_id"],
        user_role=claims["role"],
    )`;

const CODE_RBAC = `# route_node enforces RBAC before any action executes
def route_node(state: BotState) -> BotState:
    intent_cfg = INTENT_REGISTRY[state.intent]
    if intent_cfg.tier == 0 and state.user_role != "authenticated":
        return state | {
            "route": "auth_required",
            "response_text": "Please sign in to contact the seller."
        }
    return state | {"route": intent_cfg.tier}`;

const CODE_SECRETS = `class AdapterFactory:
    @staticmethod
    def build_classifier(settings: Settings) -> ClassifierPort:
        if settings.model_provider == "anthropic":
            key = _fetch_from_vault("anthropic/api_key")   # Azure Key Vault / AWS Secrets Manager
            return AnthropicClassifier(api_key=key)
        elif settings.model_provider == "azure_openai":
            return AzureOpenAIClassifier(endpoint=settings.azure_endpoint)
            # Managed Identity — no key to store, no key to rotate

# Hot rotation: call factory, swap the reference
new_classifier = AdapterFactory.build_classifier(settings)
graph = build_graph(classifier=new_classifier)`;

const CODE_SAFETY = `# Layer 2 triggers only for borderline Layer 1 confidence
async def safety_node(state: BotState) -> BotState:
    l1 = keyword_check(state.raw_message)
    if l1.confidence == "high_risk":
        return state | {"blocked": True, "block_reason": "layer1_keyword"}
    if l1.confidence == "borderline":
        l2 = await semantic_safety_check(state.raw_message)  # second SLM call
        if l2.is_unsafe:
            return state | {"blocked": True, "block_reason": "layer2_semantic"}
    return state | {"blocked": False}`;

export function Mod9() {
  return (
    <>
      <JWTAnatomyViz />
      <h2>14.1 Auth at the Pipeline Boundary</h2>
      <p>Never let an unauthenticated request enter the LangGraph pipeline. JWT validation happens in the FastAPI layer — before <code>raw_message</code> touches any node.</p>
      <CodeBlock title="JWT Auth Dependency — FastAPI Boundary" language="python" keyLine={5} keyNote="user_id from token, never from request body">{CODE_AUTH}</CodeBlock>
      <div className="callout callout-warn"><strong>Never trust the client body for identity</strong><code>user_id</code> and <code>tenant_id</code> must come from the validated JWT claim. Accepting them from the request body lets any client send <code>{'{"user_id": "admin"}'}</code> and impersonate anyone.</div>
      <div className="callout callout-info">
        <strong>HS256 vs RS256 — which should you use?</strong>
        This code uses <strong>HS256</strong> (HMAC-SHA256): one symmetric secret both signs and verifies tokens. Simple, fast, fine for internal services where the auth server and the API server are the same trust boundary.
        <br /><br />
        Use <strong>RS256</strong> (RSA-SHA256) when multiple services need to verify tokens independently: the auth server holds the private key (signs), all downstream services hold only the public key (verify). If a microservice is compromised, it cannot forge tokens — it only has the public key. Most production OAuth 2.0 / OIDC setups (Auth0, Cognito, Google) issue RS256 tokens. Upgrade: swap <code>settings.jwt_secret</code> for a public key and change <code>algorithms=["HS256"]</code> to <code>algorithms=["RS256"]</code>.
      </div>

      <RBACTierViz />
      <h2>14.2 RBAC Within the Agent — The Tier System</h2>
      <p>The tier system isn't just a cost optimization — it's the RBAC mechanism. Each intent maps to a tier, and each tier enforces a minimum required role.</p>
      <table>
        <tbody>
          <tr><th>Tier</th><th>Description</th><th>Required role</th><th>Example intents</th></tr>
          <tr><td>0</td><td>Auth-gated action</td><td>authenticated</td><td>contact_seller, save_search, schedule_visit</td></tr>
          <tr><td>1</td><td>Structured action</td><td>any</td><td>search_properties, apply_filter, reset_filters</td></tr>
          <tr><td>2</td><td>Template response</td><td>any</td><td>ask_price_guidance, how_emi_works</td></tr>
          <tr><td>3a/3b</td><td>LLM response</td><td>any</td><td>complex_query, general_housing_query</td></tr>
        </tbody>
      </table>
      <CodeBlock title="RBAC Route Node — Tier-0 Auth Gate" language="python" keyLine={3} keyNote="tier 0 blocks before any action executes">{CODE_RBAC}</CodeBlock>

      <h2>14.3 Secrets Management — Rotation Without Restart</h2>
      <p>The adapter factory pattern makes API key rotation clean. Rotate the credential in your secrets manager, re-instantiate the adapter — no code deploy, no restart.</p>
      <CodeBlock title="Adapter Factory — Hot API Key Rotation" language="python" keyLine={4} keyNote="Vault fetch decouples key from code deploy">{CODE_SECRETS}</CodeBlock>
      <div className="callout callout-tip"><strong>Azure Managed Identity</strong>For Azure-hosted deployments, prefer Managed Identity over API keys. The VM/container has a service principal; Key Vault grants it read access. No key to store, rotate, or accidentally commit.</div>

      <h2>14.4 Adversarial Safety — Two-Layer Defense</h2>
      <p>The <code>safety_node</code> keyword blocklist is Layer 1: fast (&lt;1ms) but brittle. "Ignore all previous instructions" is caught. "Please disregard prior context entirely" is not.</p>
      <table>
        <tbody>
          <tr><th>Layer</th><th>Method</th><th>Latency</th><th>Cost</th><th>Catches</th></tr>
          <tr><td>1 — Keyword filter</td><td>Regex / blocklist</td><td>&lt;1ms</td><td>$0</td><td>Known patterns, explicit injection</td></tr>
          <tr><td>2 — Semantic classifier</td><td>Second SLM call</td><td>30–50ms</td><td>~$0.0001</td><td>Obfuscated attacks, novel phrasings</td></tr>
        </tbody>
      </table>
      <CodeBlock title="Two-Layer Safety Node — Semantic Fallback" language="python" keyLine={5} keyNote="Layer 2 only fires on borderline, not every request">{CODE_SAFETY}</CodeBlock>
      <div className="callout callout-info"><strong>Cost math</strong>Layer 2 costs 30–50ms and ~$0.0001. At 1M DAU with 1% borderline rate = 10K Layer 2 calls/day = ~$1/day. Run it on borderline inputs only — not every request.</div>
      <div className="callout callout-info">
        <strong>Module 16 — Reference Answer: Design Exercise</strong>
        <em>Q: You discover the current <code>require_auth</code> uses HS256. The security team asks you to migrate to RS256 for microservice isolation. What changes and what stays the same?</em>
        <br /><br />
        <strong>A:</strong> HS256 uses one symmetric key — anyone who can verify can also forge. RS256 uses an asymmetric key pair: auth server holds the private key (signs), all microservices hold the public key (verify). A compromised microservice cannot forge tokens.
        <br /><br />
        What changes: (1) Auth server generates an RSA key pair; public key exposed at <code>/.well-known/jwks.json</code>. (2) In <code>require_auth</code>: swap <code>settings.jwt_secret</code> for the public key (fetched from JWKS on startup, cached). Change <code>algorithms=["HS256"]</code> to <code>algorithms=["RS256"]</code>. (3) Key rotation: rotate the RSA key pair without touching the verifying services — they fetch the new public key from JWKS.
        <br /><br />
        What stays the same: the <code>require_auth</code> dependency, the claims schema, all downstream nodes that read from claims.
      </div>

      <h2>14.5 Fairness, Bias &amp; Responsible Deployment</h2>
      <p>
        Security is about keeping bad actors out. Responsible deployment is about not harming good users. Both are
        non-negotiable at Housing.com — a platform used for one of the largest financial decisions of a person's life.
      </p>
      <div className="callout callout-info">
        <strong>Hallucination disclosure</strong><br />
        When the retrieval confidence score falls below a threshold, the response node should add a disclaimer rather than
        present uncertain information as fact.
      </div>
      <pre><code className="language-python">{`# In response_node — check retrieval score before finalising the response
CONFIDENCE_THRESHOLD = 0.72   # tune via RAGAS context_precision sweep

async def response_node(state: BotState, llm=None, emit_sse=None) -> dict:
    retrieval_score = state.get("retrieval_score", 1.0)
    response_text = state.get("bot_response", "")

    if retrieval_score < CONFIDENCE_THRESHOLD:
        disclaimer = (
            "\\n\\n*Note: I couldn't find highly relevant listings for this query. "
            "The information above may not fully match your requirements — "
            "please verify details directly with the builder or agent.*"
        )
        response_text = response_text + disclaimer

    return {"bot_response": response_text}`}</code></pre>
      <div className="callout callout-info">
        <strong>Equity audit — RERA coverage by locality</strong><br />
        Housing.com surfaces RERA registration status. If the model's RERA lookup tool is less accurate for certain localities
        (e.g. smaller tier-3 cities with less training data), users there receive lower-quality safety information on the
        biggest purchase of their lives. Run a RAGAS sweep per-locality monthly:
      </div>
      <pre><code className="language-python">{`# Monthly audit script — RAGAS faithfulness per locality cluster
from ragas import evaluate
from ragas.metrics import faithfulness, context_precision
from datasets import Dataset

def run_equity_audit(eval_set: list[dict]) -> dict:
    """eval_set: [{question, answer, contexts, ground_truth, locality_tier}]"""
    results_by_tier = {}
    for tier in ["tier1", "tier2", "tier3"]:
        subset = [r for r in eval_set if r["locality_tier"] == tier]
        if not subset:
            continue
        ds = Dataset.from_list(subset)
        scores = evaluate(ds, metrics=[faithfulness, context_precision])
        results_by_tier[tier] = scores
        if scores["faithfulness"] < 0.80:
            print(f"WARNING: {tier} faithfulness={scores['faithfulness']:.2f} — below 0.80 threshold")
    return results_by_tier`}</code></pre>
      <div className="callout callout-maang">
        <strong>MAANG interview: "How do you ensure your AI system is fair?"</strong><br />
        Frame your answer in three layers: (1) <strong>Data fairness</strong> — representation audit on the training and eval sets; detect and correct imbalance before it becomes model bias. (2) <strong>Output fairness</strong> — per-segment evaluation (city tier, query language) with automated alerts for drift. (3) <strong>Disclosure</strong> — surface uncertainty to users rather than hiding it; hallucination disclaimers and confidence gates. Finish with: "Fairness is not a one-time audit — it's a continuous monitoring loop wired into the same eval flywheel you use for quality."
      </div>

      <QuizSection moduleId={16} title="Module 16" contentHint="JWT at pipeline boundary, RBAC tier system, secrets rotation adapter pattern, two-layer adversarial safety, hallucination disclosure with confidence threshold, per-locality equity audit with RAGAS" />
    </>
  );
}
