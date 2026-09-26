import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock } from '../components/CodeBlock';

type KeyRow = { key: string; value: string; tenant: 'A' | 'B'; id: number }

function TenantIsolationSimulator() {
  const [bugMode, setBugMode] = useState(false)
  const [keyspace, setKeyspace] = useState<KeyRow[]>([])
  const [formA, setFormA] = useState({ key: 'session', value: 'filters:mumbai,2bhk' })
  const [formB, setFormB] = useState({ key: 'session', value: 'filters:delhi,3bhk' })
  const [flash, setFlash] = useState<number | null>(null)
  const [idCounter, setIdCounter] = useState(0)

  function makeRedisKey(tenant: string, key: string) {
    return bugMode ? key : `tenant:${tenant}:${key}`
  }

  function write(tenant: 'A' | 'B', key: string, value: string) {
    const redisKey = makeRedisKey(tenant, key)
    setKeyspace(prev => {
      const overwritten = prev.findIndex(r => r.key === redisKey && r.tenant !== tenant)
      if (overwritten !== -1 && bugMode) {
        setFlash(prev[overwritten].id)
        setTimeout(() => setFlash(null), 800)
      }
      const filtered = prev.filter(r => r.key !== redisKey)
      const newId = idCounter + 1
      setIdCounter(newId)
      return [...filtered, { key: redisKey, value, tenant, id: newId }]
    })
  }

  const tenantColors = { A: 'var(--accent)', B: 'var(--accent4)' }

  return (
    <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'20px',margin:'24px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--muted)'}}>TENANT ISOLATION SIMULATOR</div>
        <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',cursor:'pointer',color: bugMode ? 'var(--accent3)' : 'var(--muted)'}}>
          <input type="checkbox" checked={bugMode} onChange={e => { setBugMode(e.target.checked); setKeyspace([]); }} style={{accentColor:'var(--accent3)',width:'14px',height:'14px'}}/>
          <span style={{fontWeight:600}}>BUG MODE — omit tenant_id from key</span>
        </label>
      </div>
      {bugMode && <div style={{background:'rgba(247,129,102,.1)',border:'1px solid var(--accent3)',borderRadius:'var(--radius-sm)',padding:'8px 12px',marginBottom:'14px',fontSize:'12px',color:'var(--accent3)',fontWeight:600}}>⚠ Keys written without tenant prefix — writes will overwrite each other's data</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
        {([['A', formA, setFormA], ['B', formB, setFormB]] as const).map(([t, form, setForm]: any) => (
          <div key={t} style={{background:'var(--bg3)',borderRadius:'var(--radius-sm)',padding:'14px',border:`1px solid ${bugMode ? 'var(--accent3)' : tenantColors[t as 'A'|'B']}33`}}>
            <div style={{fontWeight:700,color:tenantColors[t as 'A'|'B'],marginBottom:'10px',fontSize:'13px'}}>Tenant {t}</div>
            <input value={form.key} onChange={(e:any) => setForm((f:any) => ({...f,key:e.target.value}))} placeholder="key" style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'4px',padding:'5px 9px',color:'var(--text)',fontSize:'12px',fontFamily:'monospace',marginBottom:'6px'}}/>
            <input value={form.value} onChange={(e:any) => setForm((f:any) => ({...f,value:e.target.value}))} placeholder="value" style={{width:'100%',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'4px',padding:'5px 9px',color:'var(--text)',fontSize:'12px',fontFamily:'monospace',marginBottom:'8px'}}/>
            <button onClick={() => write(t as 'A'|'B', form.key, form.value)} style={{width:'100%',background:tenantColors[t as 'A'|'B'],color:'#000',border:'none',borderRadius:'4px',padding:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>REDIS SET</button>
          </div>
        ))}
      </div>
      <div style={{background:'var(--bg)',borderRadius:'var(--radius-sm)',padding:'12px',minHeight:'80px'}}>
        <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'8px'}}>REDIS KEYSPACE</div>
        {keyspace.length === 0 && <div style={{color:'var(--muted)',fontSize:'12px',fontStyle:'italic'}}>empty — write some keys above</div>}
        {keyspace.map(row => (
          <div key={row.id} style={{
            display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',marginBottom:'4px',
            borderRadius:'4px',fontFamily:'monospace',fontSize:'11px',
            background: flash===row.id ? 'rgba(247,129,102,.25)' : `${tenantColors[row.tenant]}0f`,
            border: flash===row.id ? '1px solid var(--accent3)' : `1px solid ${tenantColors[row.tenant]}33`,
            transition:'background .2s,border-color .2s'
          }}>
            <span style={{width:'8px',height:'8px',borderRadius:'50%',background:tenantColors[row.tenant],flexShrink:0}}/>
            <span style={{color:'var(--muted)'}}>Tenant {row.tenant}:</span>
            <span style={{color:'var(--text)',fontWeight:600}}>{row.key}</span>
            <span style={{color:'var(--muted)'}}>→</span>
            <span style={{color:'var(--text)'}}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:'10px',fontSize:'11px',color:'var(--muted)',fontStyle:'italic'}}>Enable Bug Mode and have Tenant B write to key "session" after Tenant A — watch Tenant A's data disappear.</div>
    </div>
  )
}

const CODE_SESSION_KEYS = `# Namespace ALL Redis keys with tenant_id
SESSION_KEY = "session:{tenant_id}:{session_id}"
GATE_KEY    = "gate:{tenant_id}:count"
PROMPT_KEY  = "prompt:{tenant_id}:{domain}:active"

class SessionStore:
    def _key(self, tenant_id: str, session_id: str) -> str:
        return f"session:{tenant_id}:{session_id}"

    async def get(self, tenant_id: str, session_id: str) -> BotSession | None:
        raw = await self.redis.get(self._key(tenant_id, session_id))
        return BotSession.parse_raw(raw) if raw else None`;

const CODE_CONCURRENCY_GATE = `class LLMConcurrencyGate:
    async def acquire(self, tenant_id: str) -> bool:
        global_count = await self.redis.incr("gate:global:count")
        if global_count == 1:
            await self.redis.expire("gate:global:count", 300)  # safety TTL
        if global_count > self.global_max:
            await self.redis.decr("gate:global:count")
            return False
        tenant_key = f"gate:{tenant_id}:count"
        tenant_count = await self.redis.incr(tenant_key)
        if tenant_count == 1:
            await self.redis.expire(tenant_key, 300)  # safety TTL per-tenant
        tenant_limit = await self._get_tenant_limit(tenant_id)
        if tenant_count > tenant_limit:
            await self.redis.decr(tenant_key)
            await self.redis.decr("gate:global:count")
            return False
        return True

# Production note: the two-key increment above has a TOCTOU race — two
# requests can both read global_count=49 and both proceed. For strict
# enforcement use a Lua script that atomically checks-and-increments both
# counters. The EXPIRE approach above only guards against crash-induced leaks,
# not concurrent over-admission.`;

const CODE_COST_ATTRIBUTION = `{
  "event_type": "llm_call_completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenant_id": "housing_com",
  "user_id": "usr_abc123",
  "plan_tier": "enterprise",          # billing bucket
  "model": "claude-haiku-4-5-20251001",
  "input_tokens": 450,
  "output_tokens": 120,
  "latency_ms": 180,
  "intent": "search_properties"
}
# Analytics: GROUP BY tenant_id, date → daily LLM cost per tenant`;

const CODE_ERASE_USER = `async def erase_user_data(user_id: str, tenant_id: str):
    # 1. Postgres — durable session logs
    await db.execute("DELETE FROM sessions WHERE user_id=? AND tenant_id=?", user_id, tenant_id)
    # 2. Redis — active sessions
    keys = await redis.keys(f"session:{tenant_id}:*")
    for key in keys:
        data = await redis.get(key)
        if data and json.loads(data).get("user_id") == user_id:
            await redis.delete(key)
    # 3. Kafka tombstone — marks record deleted in compacted topics
    await kafka_producer.send("session-events", key=user_id.encode(), value=None)`;

const CODE_AZURE_OPENAI = `from openai import AsyncAzureOpenAI
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider

class AzureOpenAIClassifier(ClassifierPort):
    def __init__(self, endpoint: str, deployment: str):
        token_provider = get_bearer_token_provider(
            DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
        )
        self._client = AsyncAzureOpenAI(
            azure_endpoint=endpoint,
            azure_ad_token_provider=token_provider,
            api_version="2024-02-01",
        )
        self._deployment = deployment

    async def classify(self, message: str, taxonomy: str) -> ClassificationResult:
        response = await self._client.chat.completions.create(
            model=self._deployment,
            messages=[{"role": "user", "content": f"{taxonomy}\\n\\n{message}"}],
            response_format={"type": "json_object"},
        )
        return ClassificationResult(**json.loads(response.choices[0].message.content))

MODEL_REGISTRY = {
    "anthropic":    AnthropicClassifier,
    "azure_openai": AzureOpenAIClassifier,
}`;

export function Mod10() {
  return (
    <>
      <h2>17.1 Multi-Tenancy: Session Isolation</h2>
      <p>In a multi-tenant deployment, multiple customers share the same infrastructure. The hardest rule: Tenant A must never read or write Tenant B's data — not even by accident.</p>
      <CodeBlock title="Redis Session Key Namespacing — Tenant Isolation" language="python" keyLine={4} keyNote="tenant_id prefix prevents cross-tenant key collisions">{CODE_SESSION_KEYS}</CodeBlock>
      <div className="callout callout-warn"><strong>Test for accidental cross-tenant reads</strong>A bug where <code>tenant_id</code> defaults to empty string means all tenants share one keyspace. Test explicitly: a session written with <code>tenant_id=A</code> must not be readable with <code>tenant_id=B</code>.</div>
      <TenantIsolationSimulator />

      <h2>17.2 Per-Tenant Rate Limiting</h2>
      <p>The global LLM concurrency gate has a flaw: one abusive tenant can consume all 50 slots and starve all others. Add a per-tenant sub-limit.</p>
      <CodeBlock title="LLM Concurrency Gate — Global and Per-Tenant Limits" language="python" keyLine={11} keyNote="TOCTOU race: Lua script needed for strict enforcement">{CODE_CONCURRENCY_GATE}</CodeBlock>

      <h2>17.3 Cost Attribution</h2>
      <p>Enterprise customers want per-team LLM spend. Add <code>tenant_id</code>, <code>user_id</code>, and <code>plan_tier</code> to every Kafka event at emission time — analytics consumers aggregate them into cost dashboards.</p>
      <CodeBlock title="Kafka Cost Attribution Event Schema" language="python" keyLine={6} keyNote="plan_tier attached at emission enables billing aggregation">{CODE_COST_ATTRIBUTION}</CodeBlock>

      <h2>17.4 PII, Compliance, and Data Retention</h2>
      <p>Users say things like "my phone is 9876543210" — that's PII, stored verbatim in <code>turn_history</code>. In many jurisdictions, you're legally obligated to handle it carefully.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',margin:'16px 0'}}>
        {/* GDPR card */}
        <div style={{border:'1px solid #0053a0',background:'#0053a022',borderRadius:'8px',padding:'16px'}}>
          <div style={{fontWeight:700,fontSize:'15px',color:'#4a9eff',marginBottom:'12px'}}>GDPR <span style={{fontSize:'12px',fontWeight:400,color:'#a0b8d8'}}>EU</span></div>
          <div style={{fontSize:'12px',marginBottom:'8px'}}>
            <span style={{color:'#8899aa'}}>Retention: </span>
            <span style={{color:'#cdd6f4'}}>Minimum necessary </span>
            <span style={{display:'inline-block',background:'#b8860033',border:'1px solid #b88600',color:'#f5c842',fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:'3px',verticalAlign:'middle'}}>LIMITED</span>
          </div>
          <div style={{fontSize:'12px',marginBottom:'12px'}}>
            <span style={{color:'#8899aa'}}>Erasure right: </span>
            <span style={{color:'#cdd6f4'}}>YES — Article 17 </span>
            <span style={{display:'inline-block',background:'#1a4a2a',border:'1px solid #2d8a4e',color:'#a6e3a1',fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:'3px',verticalAlign:'middle'}}>YES</span>
          </div>
          <div style={{fontSize:'10px',color:'#8899aa',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.06em'}}>Retention timeline</div>
          <svg width="100%" height="22" style={{display:'block'}}>
            <rect x="0" y="6" width="100%" height="10" rx="3" fill="#0a1628"/>
            <rect x="0" y="6" width="30%" height="10" rx="3" fill="#0053a0"/>
            <text x="2" y="17" fontSize="8" fill="#4a9eff" fontFamily="monospace">0</text>
            <text x="28%" y="17" fontSize="8" fill="#4a9eff" fontFamily="monospace">30d</text>
          </svg>
        </div>
        {/* HIPAA card */}
        <div style={{border:'1px solid #cf4444',background:'#cf444422',borderRadius:'8px',padding:'16px'}}>
          <div style={{fontWeight:700,fontSize:'15px',color:'#f38ba8',marginBottom:'12px'}}>HIPAA <span style={{fontSize:'12px',fontWeight:400,color:'#c8a0a8'}}>US Healthcare</span></div>
          <div style={{fontSize:'12px',marginBottom:'8px'}}>
            <span style={{color:'#8899aa'}}>Retention: </span>
            <span style={{color:'#cdd6f4'}}>6 years minimum </span>
            <span style={{display:'inline-block',background:'#4a0a0a',border:'1px solid #cf4444',color:'#f38ba8',fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:'3px',verticalAlign:'middle'}}>NO-ERASURE</span>
          </div>
          <div style={{fontSize:'12px',marginBottom:'12px'}}>
            <span style={{color:'#8899aa'}}>Erasure right: </span>
            <span style={{color:'#cdd6f4'}}>LIMITED — de-identify only </span>
            <span style={{display:'inline-block',background:'#b8860033',border:'1px solid #b88600',color:'#f5c842',fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:'3px',verticalAlign:'middle'}}>LIMITED</span>
          </div>
          <div style={{fontSize:'10px',color:'#8899aa',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.06em'}}>Retention timeline</div>
          <svg width="100%" height="22" style={{display:'block'}}>
            <rect x="0" y="6" width="100%" height="10" rx="3" fill="#1a0808"/>
            <rect x="0" y="6" width="90%" height="10" rx="3" fill="#cf4444"/>
            <text x="2" y="17" fontSize="8" fill="#f38ba8" fontFamily="monospace">0</text>
            <text x="88%" y="17" fontSize="8" fill="#f38ba8" fontFamily="monospace">6yr</text>
          </svg>
        </div>
        {/* CCPA card */}
        <div style={{border:'1px solid #d4a017',background:'#d4a01722',borderRadius:'8px',padding:'16px'}}>
          <div style={{fontWeight:700,fontSize:'15px',color:'#f5c842',marginBottom:'12px'}}>CCPA <span style={{fontSize:'12px',fontWeight:400,color:'#c8b880'}}>California</span></div>
          <div style={{fontSize:'12px',marginBottom:'8px'}}>
            <span style={{color:'#8899aa'}}>Retention: </span>
            <span style={{color:'#cdd6f4'}}>Purpose-limited </span>
            <span style={{display:'inline-block',background:'#b8860033',border:'1px solid #b88600',color:'#f5c842',fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:'3px',verticalAlign:'middle'}}>LIMITED</span>
          </div>
          <div style={{fontSize:'12px',marginBottom:'12px'}}>
            <span style={{color:'#8899aa'}}>Erasure right: </span>
            <span style={{color:'#cdd6f4'}}>YES — with exceptions </span>
            <span style={{display:'inline-block',background:'#1a4a2a',border:'1px solid #2d8a4e',color:'#a6e3a1',fontSize:'10px',fontWeight:700,textTransform:'uppercase',padding:'1px 5px',borderRadius:'3px',verticalAlign:'middle'}}>YES</span>
          </div>
          <div style={{fontSize:'10px',color:'#8899aa',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.06em'}}>Retention timeline</div>
          <svg width="100%" height="22" style={{display:'block'}}>
            <rect x="0" y="6" width="100%" height="10" rx="3" fill="#1a1200"/>
            <rect x="0" y="6" width="50%" height="10" rx="3" fill="#d4a017"/>
            <text x="2" y="17" fontSize="8" fill="#f5c842" fontFamily="monospace">0</text>
            <text x="48%" y="17" fontSize="8" fill="#f5c842" fontFamily="monospace">12mo</text>
          </svg>
        </div>
      </div>
      <CodeBlock title="GDPR Right-to-Erasure — Three-Store Delete" language="python" keyLine={8} keyNote="Kafka tombstone propagates deletion to all consumers">{CODE_ERASE_USER}</CodeBlock>
      <div className="callout callout-gotcha"><strong>Production anti-pattern:</strong> <code>KEYS</code> blocks all other Redis operations for its entire scan duration. In production, use <code>SCAN</code> with a cursor instead: <code>SCAN 0 MATCH user:{'{user_id}'}:* COUNT 100</code> — it iterates in small batches without blocking.</div>

      <h2>17.5 Swapping Anthropic for Azure OpenAI</h2>
      <p>The port/adapter pattern makes this a 1-file change. Azure OpenAI uses the same OpenAI message schema — only auth and endpoint differ.</p>
      <CodeBlock title="Azure OpenAI Classifier — Managed Identity Auth" language="python" keyLine={4} keyNote="DefaultAzureCredential: no API key stored or rotated">{CODE_AZURE_OPENAI}</CodeBlock>
      <div className="callout callout-tip"><strong>Why this works cleanly</strong>Every node calls <code>self.classifier.classify()</code> — it has no idea whether that hits Anthropic or Azure. Switching providers is a config change, not a code change.</div>
      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection — Module 19</strong>
        "How do you prevent one tenant from starving all others in a shared LLM platform?" → Per-tenant concurrency sub-limits on top of a global limit. Two Redis keys. Enterprise tenants get higher caps; free-tier tenants cap at 5 concurrent. The global gate is the hard ceiling.
        <br /><br />
        <strong>Likely follow-up:</strong> "How do you attribute LLM costs to individual tenants for billing?"<br />
        → Every Kafka event includes <code>tenant_id</code>, <code>user_id</code>, <code>input_tokens</code>, <code>output_tokens</code>. A Flink/Spark consumer aggregates by tenant over rolling windows and writes to a cost ledger. Pricing tier is applied at billing time, not event time.
        <br /><br />
        <strong>Likely follow-up:</strong> "If a company acquires a tenant's data, how do you handle GDPR right-to-erasure?"<br />
        → Three stores to erase: Postgres (hard delete), Redis (scan + delete by user_id within tenant namespace), Kafka (tombstone record with null value on compacted topic). The Kafka tombstone propagates to all downstream consumers.
      </div>
      <QuizSection moduleId={19} title="Module 19" contentHint="Redis key namespacing, per-tenant rate limiting, cost attribution Kafka schema, GDPR erasure, AzureOpenAIClassifier port adapter" />
    </>
  );
}
