import{r as v,j as e}from"./index-D4pJPyGz.js";import{Q as I}from"./QuizSection-BedG7s-t.js";import{C as t}from"./CodeBlock-dJ_hHYfw.js";const k=[{id:"retry",label:"retry",color:"#f9e2af"},{id:"cache",label:"cache",color:"#94e2d5"},{id:"router",label:"router",color:"#cba6f7"}];function T(){const s=[{id:"prompt",label:"prompt_template",color:"#89b4fa"},{id:"llm",label:"llm",color:"#a6e3a1"},{id:"parser",label:"output_parser",color:"#f9e2af"},{id:"valid",label:"validator",color:"#cba6f7"}],[o,r]=v.useState(s),[a,u]=v.useState(-1),[d,n]=v.useState(!1),[i,x]=v.useState(0);function c(){d||(n(!0),u(0),o.forEach((l,p)=>{setTimeout(()=>{u(p),p===o.length-1&&setTimeout(()=>{u(-1),n(!1)},500)},p*600)}))}function A(){i>=k.length||(r(l=>[...l,k[i]]),x(l=>l+1))}const L=o.map(l=>l.label).join(" | "),y=560,h=Math.min(100,Math.floor((y-40-(o.length-1)*20)/o.length)),f=46,_=20,E=o.length*h+(o.length-1)*_,P=(y-E)/2;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("style",{children:"@keyframes dashFlowLcel{to{stroke-dashoffset:-14}}"}),e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"LCEL — COMPOSABLE CHAIN BUILDING WITH THE PIPE OPERATOR"}),e.jsxs("div",{style:{marginBottom:"10px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"},children:[e.jsx("button",{onClick:c,disabled:d,style:{background:"#313244",color:"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px",opacity:d?.5:1},children:"Run chain"}),i<k.length&&e.jsxs("button",{onClick:A,style:{background:"#313244",color:"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:["+ Add step (",k[i].label,")"]})]}),e.jsxs("svg",{viewBox:`0 0 ${y} 180`,width:"100%","aria-label":"LCEL chain animation",style:{display:"block",margin:"0 auto"},children:[e.jsx("defs",{children:e.jsx("marker",{id:"lcel-arrow",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#6c7086"})})}),e.jsx("text",{x:"10",y:"18",fontSize:"10",fill:"#6c7086",fontFamily:"monospace",children:"{question:"}),e.jsx("text",{x:"10",y:"30",fontSize:"10",fill:"#89b4fa",fontFamily:"monospace",children:'  "What is RAG?"}'}),o.map((l,p)=>{const g=P+p*(h+_),j=a===p,S=l.label.split("_"),C=S.length>1,R=C?S[0]+"_":l.label,M=C?S.slice(1).join("_"):"";return e.jsxs("g",{children:[e.jsx("rect",{x:g,y:36,width:h,height:f,rx:"6",fill:j?l.color+"33":"#313244",stroke:j?l.color:"#45475a",strokeWidth:j?2:1,style:{transition:"all 0.3s"}}),e.jsx("text",{x:g+h/2,textAnchor:"middle",fontFamily:"monospace",fontSize:"10",fill:j?l.color:"#cdd6f4",style:{transition:"fill 0.3s"},children:C?e.jsxs(e.Fragment,{children:[e.jsx("tspan",{x:g+h/2,y:36+f/2-5,children:R}),e.jsx("tspan",{x:g+h/2,dy:"13",children:M})]}):e.jsx("tspan",{x:g+h/2,y:36+f/2+4,children:l.label})}),p<o.length-1&&e.jsxs(e.Fragment,{children:[e.jsx("line",{x1:g+h,y1:36+f/2,x2:g+h+_-2,y2:36+f/2,stroke:a===p?l.color:"#6c7086",strokeWidth:"1.5",strokeDasharray:"4 3",style:{animation:"dashFlowLcel 1s linear infinite"},markerEnd:"url(#lcel-arrow)"}),e.jsx("text",{x:g+h+_/2,y:36+f/2-5,fontSize:"11",fill:"#6c7086",textAnchor:"middle",children:"|"})]})]},l.id)}),e.jsx("text",{x:y-10,y:18,fontSize:"10",fill:"#6c7086",fontFamily:"monospace",textAnchor:"end",children:'{answer: "RAG is...",'}),e.jsx("text",{x:y-10,y:30,fontSize:"10",fill:"#a6e3a1",fontFamily:"monospace",textAnchor:"end",children:"valid: true}"}),e.jsx("text",{x:y/2,y:120,fontSize:"11",fill:"#6c7086",textAnchor:"middle",children:"LCEL code:"}),e.jsx("text",{x:y/2,y:136,fontSize:"11",fill:"#cdd6f4",textAnchor:"middle",fontFamily:"monospace",children:L.length>60?L.slice(0,57)+"...":L})]})]})}const w="Mumbai's real estate market in 2025 has seen strong demand in Bandra, Powai, and Andheri. Bandra West commands a premium of 15-20% for sea-facing properties. Average 2BHK prices hover around 2.5 Cr. Powai benefits from IT hub proximity with rental yields of 3.5%. Andheri East offers metro connectivity and competitive pricing at 1.6 Cr for 2BHK.",N=`# Mumbai Property Guide

## Bandra West
Average price: 2.5Cr. Sea-facing premiums add 15-20%. Strong demand from HNIs.

## Powai
Average price: 1.8Cr. IT hub — strong rental demand. 3.5% yield.

### Hiranandani Estate
Premium gated township. Prices 20% above Powai average.`,b=["#89b4fa","#a6e3a1","#f9e2af","#cba6f7","#94e2d5","#fab387","#f5c2e7","#f38ba8"];function B(){const[s,o]=v.useState("recursive");function r(){if(s==="recursive"){const x=[];let c=0;for(;c<w.length&&(x.push({text:w.slice(c,c+200)}),!(c+200>=w.length));)c+=180;return x}return s==="semantic"?w.split(". ").filter(Boolean).reduce((n,i,x)=>{if(x===0)return[{text:i+"."}];const c=n[n.length-1].text;return c.length+i.length<150&&x%2===1?n[n.length-1]={text:c+" "+i+"."}:n.push({text:i+"."}),n},[]):N.split(`

`).filter(n=>n.trim()).map(n=>({text:n.trim()}))}const a=r(),u=Math.round(a.reduce((n,i)=>n+i.text.length,0)/a.length),d=[{key:"recursive",label:"RecursiveCharacter"},{key:"semantic",label:"Semantic"},{key:"markdown",label:"MarkdownHeader"}];return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"TEXT SPLITTING — CHUNK SIZE VS SEMANTIC COHERENCE TRADEOFF"}),e.jsx("div",{style:{marginBottom:"10px",display:"flex",gap:"6px",flexWrap:"wrap"},children:d.map(n=>e.jsx("button",{onClick:()=>o(n.key),style:{background:s===n.key?"#89b4fa22":"#313244",color:s===n.key?"#89b4fa":"#cdd6f4",border:`1px solid ${s===n.key?"#89b4fa":"#45475a"}`,borderRadius:"6px",padding:"5px 12px",fontSize:"0.78rem",cursor:"pointer",marginRight:"8px"},children:n.label},n.key))}),e.jsxs("div",{style:{fontSize:"0.75rem",color:"#6c7086",marginBottom:"10px"},children:[a.length," chunks  ·  avg size ",u," chars",s==="recursive"&&e.jsx("span",{style:{color:"#f9e2af"},children:"  ·  overlap=20 chars highlighted"})]}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px"},children:a.map((n,i)=>e.jsxs("div",{style:{background:b[i%b.length]+"18",border:`1px solid ${b[i%b.length]}55`,borderRadius:"6px",padding:"6px 8px",maxWidth:"100%",flex:"1 1 200px"},children:[e.jsxs("div",{style:{fontSize:"0.68rem",color:b[i%b.length],marginBottom:"3px",fontWeight:600},children:["chunk ",i+1,"  ·  ",n.text.length," chars"]}),e.jsx("div",{style:{fontSize:"0.75rem",color:"#bac2de",fontFamily:"monospace",lineHeight:1.4,wordBreak:"break-word"},children:s==="recursive"&&i>0?e.jsxs(e.Fragment,{children:[e.jsx("span",{style:{background:"#f9e2af22",borderRadius:"2px",color:"#f9e2af"},children:n.text.slice(0,20)}),n.text.slice(20)]}):n.text})]},i))}),s==="markdown"&&e.jsx("div",{style:{marginTop:"10px",fontSize:"0.72rem",color:"#6c7086"},children:"Each h2/h3 section becomes a separate chunk with header context propagated to metadata."})]})}function D(){const s=[{model:"text-embedding-3-small",provider:"OpenAI",dims:"1536",cost:"$0.02",mteb:"62.3",bestFor:"English Q&A, default",hosted:!1},{model:"text-embedding-3-large",provider:"OpenAI",dims:"3072",cost:"$0.13",mteb:"64.6",bestFor:"High recall, large corp",hosted:!1},{model:"BAAI/bge-m3",provider:"HuggingFace",dims:"1024",cost:"Free",mteb:"63.1",bestFor:"Multilingual, GDPR",hosted:!0},{model:"voyage-3",provider:"Voyage AI",dims:"1024",cost:"$0.06",mteb:"65.1",bestFor:"Code + long docs",hosted:!1},{model:"embed-multilingual-v3",provider:"Cohere",dims:"1024",cost:"$0.10",mteb:"64.0",bestFor:"Non-English corpora",hosted:!1}],o=r=>({display:"inline-block",padding:"2px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700,background:r?"#a6e3a122":"#f38ba822",color:r?"#a6e3a1":"#f38ba8",border:`1px solid ${r?"#a6e3a144":"#f38ba844"}`});return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"EMBEDDING MODEL COMPARISON — DIMENSIONS, COST, AND HOSTING OPTIONS"}),e.jsx("div",{style:{overflowX:"auto"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"13px"},children:[e.jsx("thead",{children:e.jsx("tr",{style:{background:"var(--bg3, #313244)"},children:["Model","Provider","Dims","Cost/1M tokens","MTEB Score","Best For","Self-hosted"].map(r=>e.jsx("th",{style:{padding:"8px 12px",textAlign:"left",color:"var(--muted, #6c7086)",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:"1px solid var(--border, #313244)",whiteSpace:"nowrap"},children:r},r))})}),e.jsx("tbody",{children:s.map((r,a)=>e.jsxs("tr",{style:{background:a%2===0?"var(--bg2, #1e1e2e)":"var(--bg, #181825)"},children:[e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)",fontFamily:"monospace",color:"#89b4fa",whiteSpace:"nowrap"},children:r.model}),e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)",color:"#cdd6f4"},children:r.provider}),e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)",color:"#cdd6f4"},children:r.dims}),e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)",color:r.cost==="Free"?"#a6e3a1":"#f9e2af",fontFamily:"monospace"},children:r.cost}),e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)",color:"#cdd6f4"},children:r.mteb}),e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)",color:"#bac2de"},children:r.bestFor}),e.jsx("td",{style:{padding:"8px 12px",borderBottom:"1px solid var(--border, #313244)"},children:e.jsx("span",{style:o(r.hosted),children:r.hosted?"Yes":"No"})})]},r.model))})]})})]})}const O=`# ── Vanilla Python pipeline (no LangChain) ────────────────────────────────────
import anthropic, json

client = anthropic.Anthropic()

def classify_property_query(message: str) -> dict:
    prompt = f"""You are a property search classifier.
Message: {message}
Respond ONLY with JSON: {{"intent": "property_search"|"general"|"off_topic",
                         "confidence": 0.0-1.0}}"""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=64,
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(response.content[0].text)

result = classify_property_query("show 2BHK in Bandra under 2Cr")
print(result)  # {"intent": "property_search", "confidence": 0.97}

# ── Identical result with LCEL (LangChain Expression Language) ────────────────
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

prompt = ChatPromptTemplate.from_template("""You are a property search classifier.
Message: {message}
Respond ONLY with JSON: {{"intent": "property_search"|"general"|"off_topic",
                         "confidence": 0.0-1.0}}""")
llm    = ChatAnthropic(model="claude-haiku-4-5-20251001", max_tokens=64)
chain  = prompt | llm | JsonOutputParser()

result = chain.invoke({"message": "show 2BHK in Bandra under 2Cr"})
print(result)  # {"intent": "property_search", "confidence": 0.97}
# Same output. LangChain saved: format_messages(), client.messages.create(),
# response.content[0].text, json.loads(). 4 lines → 1.`,F=`from langchain_core.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel

prompt = ChatPromptTemplate.from_template("Classify: {text}")
llm   = ChatAnthropic(model="claude-haiku-4-5-20251001")
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"text": "I want a 2BHK in Bandra"})

# Parallel: both chains run concurrently (like Promise.all)
parallel = RunnableParallel(intent=intent_chain, sentiment=sentiment_chain)
result = parallel.invoke({"text": user_input})
# {"intent": "property_search", "sentiment": "neutral"}`,H=`from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain_anthropic import ChatAnthropic

llm    = ChatAnthropic(model="claude-haiku-4-5-20251001")
memory = ConversationBufferMemory()
chain  = ConversationChain(llm=llm, memory=memory)

chain.predict(input="My name is Raj. Looking for a 2BHK in Bandra.")
chain.predict(input="Budget is 2Cr. Must have parking.")
chain.predict(input="What was my budget?")

print(memory.load_memory_variables({}))
# {'history': 'Human: My name is Raj. Looking for a 2BHK in Bandra.\\n'
#             'AI: Got it, Raj — 2BHK in Bandra. Any budget in mind?\\n'
#             'Human: Budget is 2Cr. Must have parking.\\n'
#             'AI: Noted — under 2Cr with parking in Bandra.\\n'
#             'Human: What was my budget?\\n'
#             'AI: You mentioned 2Cr.'}
# ↑ All turns verbatim. At turn 25 (~10K tokens) this overflows an 8K context window.
# When it overflows: LangChain truncates silently — early turns disappear with no warning.`,W=`from langchain.memory import ConversationBufferWindowMemory

memory = ConversationBufferWindowMemory(k=3)  # keep only the last 3 Human+AI pairs
chain  = ConversationChain(llm=llm, memory=memory)

chain.predict(input="Turn 1: My name is Raj.")
chain.predict(input="Turn 2: Looking for 2BHK.")
chain.predict(input="Turn 3: Budget 2Cr.")
chain.predict(input="Turn 4: Need parking.")   # turn 1 is now evicted
chain.predict(input="Turn 5: Sea view please.") # turns 1 and 2 gone

print(memory.load_memory_variables({}))
# {'history': 'Human: Turn 3: Budget 2Cr.\\nAI: ...\\n'
#             'Human: Turn 4: Need parking.\\nAI: ...\\n'
#             'Human: Turn 5: Sea view please.\\nAI: ...'}
# Raj's name is now gone. If turn 6 asks "what's my name?" → the LLM will say "I don't know."`,q=`from langchain.memory import ConversationSummaryMemory

# The llm YOU PASS HERE is the summarizer — it runs on every single turn
summary_llm = ChatAnthropic(model="claude-haiku-4-5-20251001")
memory = ConversationSummaryMemory(llm=summary_llm)
chain  = ConversationChain(llm=llm, memory=memory)

chain.predict(input="My name is Raj. Looking for a 2BHK in Bandra under 2Cr.")
# ↑ After this turn: summary_llm is called ONCE to produce initial summary

chain.predict(input="Must have parking. Near a school.")
# ↑ After this turn: summary_llm is called AGAIN with (old_summary + new_turn) → new_summary

chain.predict(input="Actually budget can stretch to 2.5Cr for the right place.")
# ↑ summary_llm called AGAIN — 3 LLM calls for 3 turns just for memory

print(memory.load_memory_variables({}))
# {'history': 'The human is Raj, looking for a 2BHK in Bandra with a flexible budget
#             around 2-2.5Cr. Requirements: parking, proximity to a school.'}
# ↑ Looks clean. But: "flexible budget around 2-2.5Cr" — Raj never said "flexible".
# That's the model inlining its interpretation. This is the hallucination risk.`,z=`from langchain.memory import ConversationSummaryBufferMemory

# llm = the model that writes the summary (only called when buffer EXCEEDS max_token_limit)
# max_token_limit = how many tokens of verbatim recent turns to keep before summarising
summary_llm = ChatAnthropic(model="claude-haiku-4-5-20251001")
memory = ConversationSummaryBufferMemory(llm=summary_llm, max_token_limit=200)
chain  = ConversationChain(llm=llm, memory=memory)

chain.predict(input="My name is Raj. Looking for a 2BHK in Bandra.")   # ~30 tokens
chain.predict(input="Budget 2Cr. Need parking.")                         # +25 tokens
chain.predict(input="Prefer sea view. Not above 10th floor.")            # +30 tokens
chain.predict(input="Should be in a gated community.")                   # +20 tokens
# Buffer now ~105 tokens — still under 200. No summarisation yet.

chain.predict(input="I'd also like a gym and a pool in the building.")   # +25 tokens
chain.predict(input="School proximity is important — I have kids.")       # +25 tokens
chain.predict(input="Can you show me what I've asked for so far?")       # +20 tokens
# Buffer now ~175 tokens — still under 200. No summarisation yet.

chain.predict(input="One more thing: east-facing preferred.")             # +20 tokens
# Buffer now ~195 — still under. But next turn will push it over.

chain.predict(input="And within 2km of a metro station.")                # pushes to ~220 tokens
# THRESHOLD EXCEEDED. summary_llm is called NOW with this prompt:
#
#   Progressively summarize the conversation, adding onto the previous summary.
#   Current summary: (empty on first call)
#   New lines:
#     Human: My name is Raj... [turns 1–7, the overflow portion]
#     AI: ...
#   New summary:
#
# summary_llm produces: "Raj wants a 2BHK in Bandra under 2Cr, sea-facing, below 10th
#   floor, gated community, gym+pool, school nearby, east-facing."
# Turns 8–9 stay verbatim in the buffer.

print(memory.load_memory_variables({}))
# {'history':
#   'System: Raj wants a 2BHK in Bandra under 2Cr, sea-facing, below 10th floor,
#            gated community, gym+pool, school nearby, east-facing.   ← LLM-written summary
#    Human: One more thing: east-facing preferred.                     ← verbatim (recent)
#    AI: Noted.
#    Human: And within 2km of a metro station.                        ← verbatim (recent)
#    AI: ...'}`,G=`# session_store.py — the production pattern
async def get_session(session_id: str) -> dict:
    raw = await redis.get(f"session:{session_id}")
    return json.loads(raw) if raw else {"turn_history": [], "active_filters": {}}

async def update_session(session_id: str, state: BotState) -> None:
    session = {
        "turn_history": state["turn_history"][-20:],   # hard cap: never more than 20 turns
        "active_filters": state["active_filters"],
        "last_seen_properties": state.get("last_seen_properties", [])[-5:],
    }
    # SETEX: atomic write with 1-hour TTL — one call, no race condition
    await redis.setex(f"session:{session_id}", 3600, json.dumps(session))`,U=`# Two windows over the same history — both extracted in enrich_context_node
state["last_3_turns"]  = state["turn_history"][-3:]   # for classifier (Haiku): recency only
state["turn_history"]  = state["turn_history"][-20:]  # for LLM (Sonnet/Haiku): full context

# Why not send all 20 turns to the classifier?
# Haiku classifier input: ~400 tokens. Adding 17 extra turns = ~1700 more tokens.
# Cost delta: $0.00017 per turn × 1M DAU × 3 turns = $510/day in wasted tokens.
# The classifier only needs "what did the user just say in context" — not the full arc.`,V=`from langchain_community.document_loaders import PyPDFLoader, UnstructuredPDFLoader

# --- Basic: text-based PDFs (scanned PDFs return empty content) ---
loader = PyPDFLoader("product_manual.pdf")
docs = loader.load()
# Returns: one Document per page
# docs[0].page_content  → "Chapter 1: Installation\\n\\nBefore installing..."
# docs[0].metadata      → {'source': 'product_manual.pdf', 'page': 0}  ← 0-indexed!

# Production trap: scanned PDFs (images of text) return empty page_content
for doc in docs:
    if not doc.page_content.strip():
        print(f"WARNING: page {doc.metadata['page']} has no text — likely scanned image")
# If this fires: switch to UnstructuredPDFLoader which runs OCR (requires tesseract)

# --- Production: handles text + scanned + mixed PDFs ---
loader = UnstructuredPDFLoader("mixed_document.pdf", mode="elements")
# mode="elements" gives one Document per semantic element (title, paragraph, table, image)
# mode="single"   gives one Document for the entire PDF (default, less granular)
# Requires: pip install unstructured[pdf] tesseract

# --- Enrich metadata before storing in vector DB ---
docs = PyPDFLoader("rera_docs/MH2024-0012.pdf").load()
for doc in docs:
    doc.metadata["tenant_id"]   = "housing_com"
    doc.metadata["doc_type"]    = "rera_filing"
    doc.metadata["doc_id"]      = "MH2024-0012"
    # Now you can filter: retriever.get_relevant_documents(q, filter={"doc_id": "MH2024-0012"})`,K=`from langchain_community.document_loaders import WebBaseLoader

# --- Basic: static HTML pages ---
loader = WebBaseLoader("https://housing.com/locality/bandra-west-mumbai")
docs   = loader.load()
# docs[0].page_content → stripped plain text of the page (BeautifulSoup bs4 under the hood)
# docs[0].metadata     → {'source': 'https://...', 'title': '...', 'description': '...'}

# Batch load multiple URLs concurrently
loader = WebBaseLoader(["https://housing.com/about", "https://housing.com/blog"])
docs   = loader.load()  # two Documents, one per URL

# Production trap: JavaScript-rendered pages return empty or near-empty content
# React/Next.js/Angular apps render in the browser, not on the server.
# WebBaseLoader uses requests (no JS engine) → gets the pre-render HTML shell only.
from langchain_community.document_loaders import PlaywrightURLLoader
# Requires: pip install playwright && playwright install chromium
loader = PlaywrightURLLoader(
    urls=["https://app.housing.com/dashboard"],
    remove_selectors=["nav", "footer", ".cookie-banner"],  # strip chrome
    headless=True,
)
docs = loader.load()   # full JS-rendered content

# When to use which:
# WebBaseLoader   → static sites, blogs, docs, Wikipedia, news sites
# PlaywrightURLLoader → SPAs, dashboards, anything built with React/Vue/Angular
# Check: curl the URL and see if the response has real content — if not, use Playwright`,Q=`# Two very different loaders — don't confuse them

# --- Option A: NotionDirectoryLoader — from a local Notion export (no API key needed) ---
# In Notion: Settings → Export → "Markdown & CSV" → extract the ZIP
from langchain_community.document_loaders import NotionDirectoryLoader
loader = NotionDirectoryLoader("./notion_export/")
docs   = loader.load()
# Each page becomes one Document; metadata: {'source': 'Page Title.md'}
# Limitation: export is a point-in-time snapshot — stale the moment someone edits Notion

# --- Option B: NotionDBLoader — live Notion API (always fresh) ---
from langchain_community.document_loaders import NotionDBLoader
# Requires: pip install notion-client + an integration token
loader = NotionDBLoader(
    integration_token=os.environ["NOTION_TOKEN"],
    database_id="abc123def456",  # from the Notion URL
    request_timeout_sec=30,
)
docs = loader.load()
# Each database row becomes one Document with all property values in metadata
# docs[0].metadata → {'id': 'abc...', 'Name': 'Sprint 42', 'Status': 'In Progress', ...}

# When to use which:
# NotionDirectoryLoader → one-off RAG setup, offline use, no API key available
# NotionDBLoader        → production knowledge base that needs to stay in sync with Notion`,Y=`from langchain_community.document_loaders import GitLoader

# --- Load a local git repo by file extension ---
loader = GitLoader(
    repo_path="./chat-bot",
    branch="main",
    file_filter=lambda path: path.endswith((".py", ".md")),  # skip .json, .lock, images
)
docs = loader.load()
# One Document per file (not per commit — use GitHubIssuesLoader for commits/issues)
# docs[0].metadata → {
#   'source':    'src/pipeline/graph.py',
#   'file_path': 'src/pipeline/graph.py',
#   'file_name': 'graph.py',
#   'file_type': '.py'
# }

# Production use: internal code search, doc generation, codebase Q&A
# Production trap: large repos (100K+ files) — always filter by extension AND path
loader = GitLoader(
    repo_path="./monorepo",
    file_filter=lambda p: p.startswith("services/chat/") and p.endswith(".py"),
)

# Clone directly from remote (slower but no local checkout needed):
loader = GitLoader(
    clone_url="https://github.com/your-org/chat-bot",
    repo_path="/tmp/chat-bot-clone",  # where to clone to
    branch="main",
)`,J=`from langchain_community.document_loaders import CSVLoader

# --- Basic: each row → one Document, entire row as page_content ---
loader = CSVLoader("property_listings.csv")
docs   = loader.load()
# docs[0].page_content → "property_id: P1001\\ncity: Mumbai\\nbhk: 3\\nprice_cr: 2.5\\n..."
# docs[0].metadata     → {'source': 'property_listings.csv', 'row': 0}

# --- Production: use a specific column as content, rest as filterable metadata ---
loader = CSVLoader(
    "property_listings.csv",
    source_column="property_id",      # use property_id as the metadata source key
    csv_args={
        "delimiter": ",",
        "fieldnames": ["property_id", "city", "bhk", "price_cr", "description"],
    },
)
docs = loader.load()
# docs[0].page_content → full row text
# docs[0].metadata     → {'source': 'P1001', 'row': 0}
# Now you can filter vector search by property_id: filter={"source": "P1001"}

# Production trap: large CSVs (100K+ rows) — .load() reads everything into RAM
# Use lazy_load() instead:
for doc in loader.lazy_load():
    vectorstore.add_documents([doc])  # stream to vector DB row-by-row`,$=`# Production patterns that apply to ALL loaders

# 1. lazy_load() — iterator, not list — avoids loading 10K pages into RAM at once
from langchain_community.document_loaders import PyPDFLoader
import asyncio

loader = PyPDFLoader("large_document.pdf")
for doc in loader.lazy_load():             # processes one page at a time
    vectorstore.add_documents([doc])

# 2. Error handling — don't let one bad file fail the whole ingestion pipeline
import glob
results = {"success": 0, "failed": []}
for path in glob.glob("documents/**/*.pdf", recursive=True):
    try:
        docs = PyPDFLoader(path).load()
        vectorstore.add_documents(docs)
        results["success"] += 1
    except Exception as e:
        results["failed"].append({"path": path, "error": str(e)})
        # log and continue — don't crash the ingestion job

# 3. Metadata enrichment — always add scoping metadata before indexing
def load_with_metadata(path: str, tenant_id: str, doc_type: str):
    docs = PyPDFLoader(path).load()
    for doc in docs:
        doc.metadata.update({"tenant_id": tenant_id, "doc_type": doc_type})
    return docs

# Then at retrieval time, scope by tenant:
results = vectorstore.similarity_search(
    query, k=5,
    filter={"tenant_id": "housing_com", "doc_type": "rera_filing"}
)

# 4. Deduplication — track which files have been ingested to avoid re-indexing
ingested = set(redis.smembers("ingested_docs"))   # Set[str] of file hashes
file_hash = hashlib.md5(open(path, "rb").read()).hexdigest()
if file_hash not in ingested:
    vectorstore.add_documents(PyPDFLoader(path).load())
    redis.sadd("ingested_docs", file_hash)`,X=`# The LangChain loader ecosystem — 100+ loaders, all in langchain-community
# pip install langchain-community
# Full list: python.langchain.com/docs/integrations/document_loaders/

# Every loader shares the same interface:
#   .load()        → List[Document]        — loads everything into memory
#   .lazy_load()   → Iterator[Document]   — streams one Document at a time (use for large files)
#   .alazy_load()  → AsyncIterator[Document] — async version

# Core categories:
# Files:          PyPDFLoader, Docx2txtLoader, UnstructuredExcelLoader, UnstructuredPPTXLoader
# Web:            WebBaseLoader, PlaywrightURLLoader, SitemapLoader, RecursiveUrlLoader
# Cloud storage:  S3FileLoader, GCSFileLoader, AzureBlobStorageFileLoader
# Databases:      SQLDatabaseLoader, MongodbLoader, FirestoreLoader
# APIs:           SlackDirectoryLoader, DiscordChatLoader, GitHubIssuesLoader, JiraLoader,
#                 ConfluenceLoader, HubSpotLoader, ZendeskLoader
# Productivity:   NotionDirectoryLoader, NotionDBLoader, GoogleDriveLoader,
#                 OneDriveLoader, DropboxLoader
# Code:           GitLoader, SourceCodeLoader

from langchain_community.document_loaders import S3FileLoader
loader = S3FileLoader(bucket="housing-docs", key="rera/MH2024-0012.pdf")
docs = loader.load()  # streams from S3, same Document interface`,Z=`from langchain_text_splitters import RecursiveCharacterTextSplitter

# Separator hierarchy (tried in order): ["\\n\\n", "\\n", " ", ""]
# It starts with the coarsest separator (paragraph break \\n\\n) and recurses
# to finer ones only when a piece still exceeds chunk_size.
# This is why it "respects" paragraph → sentence → word boundaries by default.

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,       # max characters per chunk
    chunk_overlap=50,     # characters shared between adjacent chunks (bridges boundary)
    length_function=len,  # default: character count
    separators=["\\n\\n", "\\n", " ", ""],  # explicit default hierarchy
)
chunks = splitter.split_documents(raw_docs)

# chunk_overlap explained:
# doc = "A B C D E F G" (simplified)
# chunk 1: "A B C D"
# chunk 2: "C D E F"  ← last 2 tokens of chunk 1 repeated as the bridge
# Without overlap: if the answer spans the boundary, neither chunk has it fully.

# Token-aware splitter — controls token count instead of character count
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4")
token_splitter = RecursiveCharacterTextSplitter(
    chunk_size=256,   # 256 tokens ≈ 190 English words ≈ ~1100 chars
    chunk_overlap=20,
    length_function=lambda t: len(enc.encode(t)),
)
# Use when: you need precise token budgeting (256 tokens × 5 chunks = 1280 context tokens)`,ee=`from langchain_text_splitters import MarkdownHeaderTextSplitter

# What it does: splits on headings AND propagates heading context into chunk metadata.
# Without it: a chunk "Average price: 2.5Cr" has no idea it's about "Bandra West".
# With it: metadata["Header 2"] = "Bandra West" is attached to every sub-chunk.

splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#",   "Header 1"),
        ("##",  "Header 2"),
        ("###", "Header 3"),
    ],
    strip_headers=True,   # remove heading text from page_content (it's in metadata)
)

md = """
# Housing Guide Mumbai

## Bandra West
Average price: 2.5Cr. Sea-facing premiums add 15-20%.

### Transport
3 metro stations within 2km. Western Railway 5 min walk.

## Powai
Average price: 1.8Cr. IT hub — strong rental demand.
"""

chunks = splitter.split_text(md)
# chunks[0].page_content → "Average price: 2.5Cr. Sea-facing premiums add 15-20%."
# chunks[0].metadata     → {"Header 1": "Housing Guide Mumbai", "Header 2": "Bandra West"}
# chunks[1].page_content → "3 metro stations within 2km. Western Railway 5 min walk."
# chunks[1].metadata     → {..., "Header 2": "Bandra West", "Header 3": "Transport"}

# Combine with RecursiveCharacterTextSplitter for very large sections:
from langchain_text_splitters import RecursiveCharacterTextSplitter
md_splitter   = MarkdownHeaderTextSplitter(headers_to_split_on=[("#","h1"),("##","h2")])
char_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)

header_chunks = md_splitter.split_text(large_md)
final_chunks  = char_splitter.split_documents(header_chunks)
# Preserves heading metadata; only oversized sections get further split`,te=`from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

# Language enum: PYTHON JS TS JAVA GO RUBY CPP C SCALA SWIFT RUST HTML MARKDOWN SOL PHP

# Each language gets a custom separator hierarchy that matches its syntax:
# Python:  ["\\nclass ", "\\ndef ", "\\n\\t", "\\n", " ", ""]  → class first, then function
# JS/TS:   ["\\nfunction ", "\\nconst ", "\\nclass ", "\\n", " ", ""]
# Go:      ["\\nfunc ", "\\nvar ", "\\ntype ", "\\n", " ", ""]

python_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,    # functions are larger than prose paragraphs
    chunk_overlap=100,  # overlap so the function signature appears at the start of the next chunk
)

code = """
class PropertyFilter:
    def __init__(self, city: str):
        self.city = city

    def apply(self, listings: list) -> list:
        return [l for l in listings if l["city"] == self.city]

def search_properties(query: str, filters: dict) -> list:
    # implementation
    ...
"""
chunks = python_splitter.split_text(code)
# chunk 0: entire class (fits in 1000 chars)
# chunk 1: def search_properties + body
# Without from_language(), a random char-split may cut mid-function body.

# TypeScript — same principle for frontend codebases:
ts_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.TS, chunk_size=800, chunk_overlap=80
)

# When to use: codebase Q&A, PR review tools, doc generation from source.
# Never use the default character splitter on code — it cuts inside function bodies.`,re=`from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings  # any LangChain embeddings work

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# How it works:
# 1. Splits text into sentences using NLTK
# 2. Embeds every sentence individually
# 3. Computes cosine distance between adjacent sentence embeddings
# 4. Splits where the distance exceeds the threshold (topic shift detected)
# Result: chunks that contain exactly one topic, regardless of character count.

# Three threshold strategies:
# "percentile"        — split when distance > Nth percentile across all pairs (default: 95)
# "standard_deviation"— split when distance > mean + N × std (default: 3)
# "interquartile"     — split when distance > Q3 + 1.5 × IQR

semantic = SemanticChunker(
    embeddings=embeddings,
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=90,  # lower = more splits; higher = fewer splits
)

text = """
Bandra West is one of Mumbai's most sought-after residential localities.
Average 2BHK prices hover around 2.5Cr with sea-facing premiums of 15-20%.
The area has excellent metro connectivity — 3 stations within 2km.

Machine learning is a subset of artificial intelligence.
Neural networks use layers of neurons to process information.
"""
chunks = semantic.split_text(text)
# chunk 0: Bandra West paragraph (real estate topic)
# chunk 1: ML paragraph (tech topic)
# ← split at the topic boundary, not at a character count

# Cost warning: SemanticChunker embeds EVERY SENTENCE before splitting.
# A 100-page PDF ≈ 5000 sentences → 5000 embedding API calls just to index one document.
# Use RecursiveCharacterTextSplitter as default. Switch to SemanticChunker only
# when RAGAS context_precision stays low despite chunk size tuning.`,ne=`from langchain_text_splitters import TokenTextSplitter

# Uses tiktoken — the same tokenizer OpenAI and Anthropic count tokens with.
# chunk_size and chunk_overlap are in TOKENS, not characters.
splitter = TokenTextSplitter(
    encoding_name="cl100k_base",  # used by GPT-4, Claude, text-embedding-3-*
    chunk_size=256,               # 256 tokens ≈ 190 words ≈ ~1100 characters (English)
    chunk_overlap=20,
)

# Practical token-to-character mapping (cl100k_base, English prose):
# 128 tokens  ≈  550  chars ≈  90 words  — fine-grained fact extraction
# 256 tokens  ≈  1100 chars ≈ 190 words  — good default for Q&A chunks
# 512 tokens  ≈  2200 chars ≈ 380 words  — document sections, technical content
# 1024 tokens ≈  4400 chars ≈ 750 words  — full code files, long narratives

# When to use:
# - You need a hard token cap because your retrieval budget is fixed
#   (e.g., 3 chunks × 256 tokens = 768 context tokens, leaving room for the answer)
# - You're embedding with OpenAI and want predictable API costs per chunk
# - You're inserting chunks directly into an 8K context window and need to guarantee fit

# When NOT to use:
# TokenTextSplitter does NOT respect sentence or paragraph boundaries.
# It will cut in the middle of a sentence if the token count says so.
# For prose, RecursiveCharacterTextSplitter is almost always better.`,se=`# Production: how to pick and tune chunk size
# Step 1: Start with RecursiveCharacterTextSplitter, chunk_size=512, chunk_overlap=50
# Step 2: Index 100 representative documents, run RAGAS evaluation

from ragas import evaluate
from ragas.metrics import context_precision, context_recall, answer_relevancy
from datasets import Dataset

data = {
    "question":     ["What is the average price in Bandra?", ...],
    "answer":       ["2.5 Cr", ...],
    "contexts":     [retrieved_chunks_for_q1, ...],  # what your retriever found
    "ground_truth": ["2.5 Cr sea-facing...", ...],
}
result = evaluate(Dataset.from_dict(data), metrics=[context_precision, context_recall])
# result["context_precision"] →  0.72  (72% of retrieved chunks are actually relevant)
# result["context_recall"]    →  0.68  (68% of ground truth facts are covered)

# Step 3: Interpret scores and tune
# context_precision LOW (< 0.7):  chunks too large — noise dominates
#   → decrease chunk_size (try 256)
# context_recall LOW (< 0.7):     chunks too small — answers split across boundaries
#   → increase chunk_size (try 1024) OR increase chunk_overlap (try 100)
# Both LOW:                        wrong splitter — try SemanticChunker

# Step 4: Production checklist
# ✓ Store chunk metadata: doc_id, page/section number, source file path
# ✓ Use deterministic IDs so you can delete-and-reindex one document without rebuilding
# ✓ Log chunk count per document — sudden drops mean the loader is failing silently
# ✓ Cache splitter instance (creating it is cheap; the separators list is compiled once)`,ie=`# LangChain's Embeddings base interface — all embedders implement these two methods:
# .embed_documents(texts: List[str]) → List[List[float]]   # batch indexing
# .embed_query(text: str)            → List[float]          # single query

# Critical distinction: many providers use asymmetric embeddings —
# the document head and the query head are different (different prompts, different weights).
# embed_query() optimises for "find documents that answer this"
# embed_documents() optimises for "be findable by queries like this"
# Mixing them (using embed_documents for queries) silently degrades retrieval quality.`,oe=`from langchain_openai import OpenAIEmbeddings
# pip install langchain-openai

# Model comparison (2025):
# text-embedding-3-small  1536 dims  $0.02/1M tokens  production default, excellent value
# text-embedding-3-large  3072 dims  $0.13/1M tokens  ~15% better than small on MTEB
# text-embedding-ada-002  1536 dims  $0.10/1M tokens  legacy — don't use for new projects

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Dimensionality reduction: text-embedding-3-large supports truncation
# Useful when your vector DB has a dimension cap or you want smaller index size
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=512,   # reduce 3072 → 512; OpenAI applies Matryoshka training
)   # ~10× smaller index than 3-large at 3072 dims, ~5% quality drop

# Async batch embedding (embed_documents handles batching internally)
# OpenAI hard limit: 2048 texts per API call
doc_vectors = embeddings.embed_documents([d.page_content for d in docs])
# Returns: List[List[float]], one 1536-dim vector per doc

# Async version — use inside FastAPI async handlers
doc_vectors = await embeddings.aembed_documents([d.page_content for d in docs])

# Decision guide:
# text-embedding-3-small: default for English text, best $/quality ratio
# text-embedding-3-large: when RAGAS context_recall < 0.7 with 3-small (investigate splitter first)
# text-embedding-3-large with dimensions=256: large-corpus search where index RAM is the bottleneck`,ae=`# Local embeddings — no API key, zero per-token cost, data never leaves your infra

# Option A: langchain-huggingface (sentence-transformers backend)
from langchain_huggingface import HuggingFaceEmbeddings
# pip install langchain-huggingface sentence-transformers

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-m3",                          # top open-source multilingual model
    model_kwargs={"device": "cpu"},                    # or "cuda" for GPU
    encode_kwargs={"normalize_embeddings": True},      # required for cosine similarity
)

# Popular open-source models on HuggingFace Hub (all free):
# BAAI/bge-m3                       1024 dims  multilingual, top MTEB (dense+sparse+ColBERT)
# BAAI/bge-large-en-v1.5            1024 dims  English-only, top MTEB English leaderboard
# sentence-transformers/all-mpnet-base-v2  768 dims  English, fast, well-known baseline
# nomic-ai/nomic-embed-text-v1.5    768 dims  Apache 2.0, strong on long documents
# thenlper/gte-large                1024 dims  strong multilingual, compact

# Option B: FastEmbedEmbeddings (Qdrant's ONNX-based runner — 2-5× faster on CPU)
from langchain_community.embeddings import FastEmbedEmbeddings
# pip install fastembed
embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
# ONNX quantised model — runs fast even on t3.medium; no GPU needed

# When to use local embeddings:
# Cost:       10M docs × 200 tokens = 2B tokens = $40 (OpenAI) vs $0 (local + compute)
# Compliance: GDPR / HIPAA — data cannot leave your infrastructure
# Latency:    batch indexing without network round-trips
# When NOT:   if you need peak quality and can afford API cost (test with RAGAS first)`,le=`from langchain_cohere import CohereEmbeddings
# pip install langchain-cohere

# Cohere embed-v3 is commercially the best multilingual embedding model (2025)
# Use for non-English or mixed-language corpora where OpenAI 3-small underperforms

embeddings = CohereEmbeddings(
    model="embed-english-v3.0",         # English only, 1024 dims
    # model="embed-multilingual-v3.0",  # 100+ languages, 1024 dims
    cohere_api_key=os.environ["COHERE_API_KEY"],
    input_type="search_document",       # REQUIRED when indexing documents
)

# For query embedding — Cohere v3 requires a DIFFERENT input_type:
query_embeddings = CohereEmbeddings(
    model="embed-english-v3.0",
    cohere_api_key=os.environ["COHERE_API_KEY"],
    input_type="search_query",          # REQUIRED for queries — different embedding head
)

# Critical: mixing input_type="search_document" for queries silently degrades quality.
# LangChain handles this automatically if you call embed_query() vs embed_documents()
# on the SAME CohereEmbeddings instance — but only in langchain-cohere >= 0.1.4.

# Cost: $0.10/1M tokens (same as OpenAI ada-002 legacy)
# When to choose Cohere over OpenAI:
# - Non-English content: embed-multilingual-v3 consistently beats 3-small on MTEB multilingual
# - Hindi/Arabic/Japanese/mixed-language corpora: 20-40% better recall on tested benchmarks`,de=`# Production embedding patterns

# 1. Cache embeddings to avoid paying for the same text twice
from langchain.embeddings import CacheBackedEmbeddings
from langchain.storage import LocalFileStore

underlying = OpenAIEmbeddings(model="text-embedding-3-small")
fs = LocalFileStore("./cache/embeddings/")
embeddings = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings=underlying,
    document_embedding_cache=fs,
    namespace=underlying.model,  # prevents collision when switching models
)
# First call for a text: hits OpenAI API, stores SHA-256 keyed result in ./cache/
# Subsequent calls: sub-millisecond cache lookup — no API call
# Production: swap LocalFileStore for RedisStore or S3ByteStore

from langchain_community.storage import RedisStore
redis_store = RedisStore(redis_url="redis://localhost:6379", key_prefix="embeddings:")
embeddings = CacheBackedEmbeddings.from_bytes_store(underlying, redis_store)

# 2. Async batch embedding — use aembed_documents in FastAPI async handlers
async def index_documents(docs: list, vectorstore) -> int:
    texts = [d.page_content for d in docs]
    vectors = await embeddings.aembed_documents(texts)  # single batched API call
    vectorstore.add_embeddings(list(zip(texts, vectors)), metadatas=[d.metadata for d in docs])
    return len(docs)

# 3. Monitor embedding quality: log cosine similarity of top-1 result
# If average drops below 0.55, your embedding model may be off-domain
import numpy as np
def top1_similarity(query_vec, retrieved_vecs) -> float:
    q = np.array(query_vec)
    return float(max(np.dot(q, np.array(v)) for v in retrieved_vecs))`,ce=`# Vector index algorithms — what's inside the database

# Flat / Exact scan
# Algorithm: compute cosine distance between query and EVERY vector.
# Recall: 100% (never misses). Latency: O(n) — slow above 50K vectors.
# Use for: dev/testing, very small corpora, when recall must be exact (medical, legal).

# HNSW (Hierarchical Navigable Small World) — DEFAULT in most vector stores
# Algorithm: builds a multi-layer proximity graph. Query traverses from coarse to fine layer.
# Recall: 95-99% (configurable). Latency: O(log n) — fast even at 100M vectors.
# Memory: stores the full graph in RAM — 1M × 1536-dim × 4 bytes ≈ 6 GB.
# Used by: Chroma, Weaviate, Qdrant, pgvector (v0.5+), Pinecone.
# Parameters: m (graph edges per node, default 16) and ef_construction (build quality, 64-200).

# IVF (Inverted File Index) — for RAM-constrained large corpora
# Algorithm: k-means clusters vectors into nlist buckets. At query time, searches nprobe buckets.
# Recall: lower than HNSW (~85-95%) but uses much less RAM than HNSW at scale.
# Used by: FAISS (IVFFlat), pgvector (pre-0.5).
# Parameters: nlist (number of clusters, typical 100-4096), nprobe (clusters to search, 10-100).

# IVF-PQ (Product Quantization) — billion-scale
# Combines IVF with vector compression: each 1536-dim vector → 64 bytes (24× compression).
# Recall drops ~5-10% vs IVFFlat, but 1B vectors fit in 64 GB instead of 6 TB.
# Used by: FAISS IVFPQIndex, Qdrant with scalar quantization.`,he=`from langchain_chroma import Chroma
# pip install langchain-chroma chromadb

# Persistent local (SQLite + HNSW graph stored on disk)
vectorstore = Chroma(
    collection_name="property_listings",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
)
vectorstore.add_documents(docs)

# Add with stable IDs (required for later update/delete)
vectorstore.add_documents(docs, ids=["prop_001", "prop_002", "prop_003"])

# Delete and re-add to "update" (Chroma has no native update)
vectorstore.delete(ids=["prop_001"])
vectorstore.add_documents([updated_doc], ids=["prop_001"])

# Retriever with score threshold
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7, "k": 5},
)

# Run Chroma as a server (multi-process access):
# docker run -p 8001:8000 chromadb/chroma
import chromadb
client = chromadb.HttpClient(host="localhost", port=8001)
vectorstore = Chroma(client=client, collection_name="listings", embedding_function=embeddings)

# When to use: local dev, prototyping, single-node deployments.
# Limitation: no built-in horizontal scaling — one Chroma server, one disk.`,me=`from langchain_community.vectorstores import FAISS
# pip install langchain-community faiss-cpu  (or faiss-gpu for CUDA)

# Create and save
vectorstore = FAISS.from_documents(docs, embeddings)
vectorstore.save_local("faiss_index")  # writes faiss_index.faiss + faiss_index.pkl

# Load (fast — FAISS memory-maps the .faiss file)
vectorstore = FAISS.load_local(
    "faiss_index", embeddings, allow_dangerous_deserialization=True
)

# Incremental add (FAISS supports in-place addition)
vectorstore.add_documents(new_docs)

# Search types:
# 1. Similarity (cosine / L2 depending on index type)
results = vectorstore.similarity_search("2BHK near metro", k=5)

# 2. With score — returns (Document, float) tuples; lower L2 = more similar
results_scored = vectorstore.similarity_search_with_score("2BHK near metro", k=5)

# 3. MMR — diversified results; avoids returning 5 nearly-identical chunks
results_mmr = vectorstore.max_marginal_relevance_search(
    "2BHK near metro", k=5, fetch_k=20,  # fetch 20, return diverse 5
)

# Atomic index swap (avoid serving a partial rebuild)
import shutil
vectorstore_new = FAISS.from_documents(all_docs, embeddings)
vectorstore_new.save_local("faiss_index_new")
shutil.move("faiss_index_new.faiss", "faiss_index.faiss")   # atomic on POSIX
shutil.move("faiss_index_new.pkl",   "faiss_index.pkl")

# When to use: self-hosted, full control, 10K–10M vectors, no infra overhead.
# Memory sizing: 1M vectors × 1536 dims × 4 bytes = 6 GB RAM. Size your instance.`,ue=`from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
# pip install langchain-pinecone pinecone-client

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

# One-time index creation
pc.create_index(
    name="property-listings",
    dimension=1536,          # must match your embedding model's output dimension
    metric="cosine",         # cosine | euclidean | dotproduct
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

# Namespace isolation — logical partitions within a single index (free feature)
vectorstore_mumbai = PineconeVectorStore(
    index=pc.Index("property-listings"),
    embedding=embeddings,
    namespace="mumbai",   # isolated from "delhi" namespace; no cross-namespace queries
)
vectorstore_delhi = PineconeVectorStore(
    index=pc.Index("property-listings"),
    embedding=embeddings,
    namespace="delhi",
)

# Upsert (add or replace by ID)
vectorstore_mumbai.add_documents(docs)

# Delete by ID
vectorstore_mumbai.delete(ids=["prop_001", "prop_002"])

# Production traps:
# Free tier: 1 index, 100K vectors — exceeding limit evicts oldest vectors silently.
# Monitor: pc.Index("property-listings").describe_index_stats() → vector count
# Dimension mismatch: if your embeddings change model (1536 → 3072 dims), you MUST
# delete and recreate the index — there is no in-place resize.`,pe=`from langchain_postgres import PGVector
# pip install langchain-postgres psycopg[binary]

CONNECTION = "postgresql+psycopg://user:pass@localhost:5432/housing_db"

vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="property_docs",
    connection=CONNECTION,
    use_jsonb=True,   # stores metadata as JSONB for efficient SQL filtering
)
vectorstore.add_documents(docs)

# Metadata filtering — translated to SQL WHERE by LangChain
results = vectorstore.similarity_search(
    "sea facing apartment in Bandra",
    k=5,
    filter={"city": "Mumbai", "bhk": 3},
    # Executes: WHERE metadata->>'city' = 'Mumbai' AND (metadata->>'bhk')::int = 3
)

# Switch from IVFFlat (default) to HNSW for faster queries (pgvector >= 0.5):
# Run once in SQL:
# CREATE INDEX ON langchain_pg_embedding
#   USING hnsw (embedding vector_cosine_ops)
#   WITH (m = 16, ef_construction = 64);
# DROP INDEX IF EXISTS langchain_pg_embedding_embedding_idx;  -- remove the old IVFFlat

# Combined vector + SQL query — unique to pgvector (not possible in Pinecone/Weaviate)
# SELECT *, embedding <=> $1 AS similarity
# FROM langchain_pg_embedding
# JOIN properties ON properties.id = (metadata->>'property_id')::uuid
# WHERE properties.city = 'Mumbai' AND properties.listed_at > NOW() - INTERVAL '30 days'
# ORDER BY similarity LIMIT 5;

# When to use: already on Postgres, need ACID (vector search + SQL in one transaction),
# corpus < 5M vectors.
# Memory: pgvector loads the HNSW graph via shared_buffers — set to >= 2 GB in production.`,ge=`# Vector store production patterns

# 1. Incremental ingestion — skip already-indexed documents
import hashlib

def get_doc_hash(doc) -> str:
    return hashlib.md5(doc.page_content.encode()).hexdigest()

async def ingest_documents(docs: list, vectorstore) -> dict:
    indexed_hashes = set(redis.smembers("indexed_hashes"))
    new_docs = [d for d in docs if get_doc_hash(d) not in indexed_hashes]
    if not new_docs:
        return {"indexed": 0, "skipped": len(docs)}
    vectorstore.add_documents(new_docs)
    for d in new_docs:
        redis.sadd("indexed_hashes", get_doc_hash(d))
    return {"indexed": len(new_docs), "skipped": len(docs) - len(new_docs)}

# 2. Multi-tenant isolation — namespace per tenant (Pinecone) or collection per tenant (Chroma/FAISS)
def get_vectorstore(tenant_id: str) -> FAISS:
    index_path = f"./indexes/{tenant_id}"
    if Path(index_path).exists():
        return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
    return FAISS.from_documents([], embeddings)

# 3. Monitor retrieval quality — log cosine similarity of top result per query
results = vectorstore.similarity_search_with_score(query, k=1)
if results:
    top_score = results[0][1]
    metrics.gauge("vectorstore.top1_similarity", top_score, tags={"tenant": tenant_id})
    if top_score < 0.5:
        log.warn("low_vector_similarity", query=query, score=top_score)
        # Possible causes: stale index, wrong embedding model, query out of domain

# 4. Rebuild safety — never serve a partially-rebuilt index
# Build to temp path → atomic rename (FAISS) or use blue/green collections (Chroma/Pinecone)
vectorstore_new = FAISS.from_documents(all_docs, embeddings)
vectorstore_new.save_local("faiss_index_tmp")
shutil.move("faiss_index_tmp.faiss", "faiss_index.faiss")
shutil.move("faiss_index_tmp.pkl",   "faiss_index.pkl")`,xe=`from langchain.retrievers import ContextualCompressionRetriever, MultiQueryRetriever, EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# Hybrid: keyword + semantic (best default for production)
bm25 = BM25Retriever.from_documents(docs); bm25.k = 5
vector = vectorstore.as_retriever(search_kwargs={"k": 5})
hybrid = EnsembleRetriever(retrievers=[bm25, vector], weights=[0.4, 0.6])

# Multi-query: LLM generates 3 query variations, deduplicates results
# Use when user query vocabulary doesn't match document vocabulary
multi_query = MultiQueryRetriever.from_llm(retriever=vector, llm=llm)

# Contextual compression: strips irrelevant sentences from each chunk
# More expensive (extra LLM call) but dramatically improves context relevance
from langchain.retrievers.document_compressors import LLMChainExtractor
compressor = LLMChainExtractor.from_llm(llm)
compressed = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=hybrid)`,ye=`from langchain_community.vectorstores import FAISS

vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# 1. Basic similarity — top-k by cosine distance
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5},
)

# 2. MMR (Maximum Marginal Relevance) — diversified results
# Problem: similarity alone returns 5 chunks from the same paragraph (repetitive context)
# MMR: fetch 20 candidates, return the 5 that maximise relevance AND diversity
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,
        "fetch_k": 20,       # candidate pool
        "lambda_mult": 0.7,  # 0=max diversity, 1=max relevance (default 0.5)
    },
)

# 3. Score threshold — return nothing rather than low-quality context
# Better for Q&A: an empty context forces the LLM to say "I don't know"
# rather than hallucinating from irrelevant chunks
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7, "k": 10},  # 0–10 results
)

# When to use each:
# similarity:               default for most use cases
# mmr:                      when k results are repetitive (same paragraph, same doc)
# score_threshold:          Q&A where "no answer" is safer than a wrong answer`,fe=`from langchain.retrievers import SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo
from langchain_anthropic import ChatAnthropic

# SelfQueryRetriever: the LLM parses the user query into (semantic_query, metadata_filter)
# User: "3BHK in Bandra under 2Cr with parking"
# LLM:  query="3BHK with parking", filter={"city": "Bandra", "price_cr": {"lt": 2.0}}
# Result: vectorstore.similarity_search("3BHK with parking", filter=filter_dict)

metadata_field_info = [
    AttributeInfo(name="city",        description="City or locality", type="string"),
    AttributeInfo(name="bhk",         description="Number of bedrooms", type="integer"),
    AttributeInfo(name="price_cr",    description="Price in Crores INR", type="float"),
    AttributeInfo(name="has_parking", description="Whether parking is included", type="boolean"),
]

retriever = SelfQueryRetriever.from_llm(
    llm=ChatAnthropic(model="claude-haiku-4-5-20251001"),
    vectorstore=vectorstore,
    document_contents="Real estate property listing",
    metadata_field_info=metadata_field_info,
    enable_limit=True,   # allows "show me 3 properties" to set k=3 dynamically
    verbose=True,        # logs the generated structured query — essential for debugging
)

# results = retriever.invoke("sea view 3BHK in Bandra under 2.5 Cr")
# Internal flow:
#   1. LLM call (~50ms): "3BHK sea view", filter={"city":"Bandra","bhk":3,"price_cr":{"lt":2.5}}
#   2. vectorstore.similarity_search("3BHK sea view", k=4, filter=filter_dict)

# When to use: structured metadata (city, price, bedroom count) that filter reduces candidates dramatically.
# When NOT: free-text metadata or when the query rarely benefits from filtering.`,be=`from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryByteStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Problem: small chunks give precise retrieval, but the LLM needs surrounding context.
# ParentDocumentRetriever: index SMALL child chunks, return LARGE parent chunks.

parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)  # large context
child_splitter  = RecursiveCharacterTextSplitter(chunk_size=200)   # small search target

docstore   = InMemoryByteStore()   # stores parent chunks; use RedisStore in production
retriever  = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=docstore,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)

retriever.add_documents(docs)
# Internally:
#   1. Splits each doc into parent chunks (2000 chars) → saves in docstore with UUID
#   2. Splits each parent into child chunks (200 chars) → embeds + stores with parent_id metadata

results = retriever.invoke("sea facing with gym")
# 1. Embed query, find top-k similar CHILD chunks (precise retrieval)
# 2. Look up each child's parent_id → fetch full PARENT chunk from docstore
# 3. Return parent chunks (much richer context for the LLM)

# Production: use RedisStore so parent chunks survive process restarts
from langchain_community.storage import RedisStore
docstore = RedisStore(redis_url="redis://localhost:6379", key_prefix="parents:")
# All other code stays the same — docstore is hot-swappable`,ve=`from langchain.retrievers import ContextualCompressionRetriever
from langchain_anthropic import ChatAnthropic

# Option A: LLMChainExtractor — LLM reads each chunk and extracts only relevant sentences
# Quality: high. Cost: 1 LLM call per retrieved chunk (5 chunks = 5 extra Haiku calls)
from langchain.retrievers.document_compressors import LLMChainExtractor

extractor = LLMChainExtractor.from_llm(
    llm=ChatAnthropic(model="claude-haiku-4-5-20251001")  # use cheapest model
)
retriever = ContextualCompressionRetriever(
    base_compressor=extractor,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
)
# Flow: retrieve 5 chunks → extract relevant sentences from each → LLM gets clean context
# Cost: +5 Haiku calls ≈ +$0.0015 per query at k=5

# Option B: EmbeddingsFilter — no LLM, uses cosine similarity instead
# Quality: slightly lower than LLMChainExtractor. Cost: just embedding computation.
from langchain.retrievers.document_compressors import EmbeddingsFilter

ef = EmbeddingsFilter(
    embeddings=embeddings,
    similarity_threshold=0.76,  # sentences with cosine_sim < 0.76 to query are dropped
)
retriever = ContextualCompressionRetriever(
    base_compressor=ef,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
)

# Decision:
# EmbeddingsFilter: when you want compression without LLM cost (~2× cheaper, ~5% lower quality)
# LLMChainExtractor: when context quality is the priority (add-on MAANG interviews:
#   "how do you reduce hallucination from retrieved context?" → this is the answer)`,_e=`from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

class PropertyIntent(BaseModel):
    intent: str
    city: str | None
    bhk: int | None
    max_price_cr: float | None

parser = PydanticOutputParser(pydantic_object=PropertyIntent)
prompt = ChatPromptTemplate.from_messages([
    ("system", "Extract property search intent.\\n{format_instructions}"),
    ("user", "{query}"),
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser
result: PropertyIntent = chain.invoke({"query": "2BHK in Bandra under 2Cr"})
# result.city == "Bandra", result.bhk == 2, result.max_price_cr == 2.0`,je=`from langchain.callbacks.base import BaseCallbackHandler

class CostTrackingCallback(BaseCallbackHandler):
    def __init__(self): self.total_tokens = 0
    def on_llm_end(self, response, **kwargs):
        usage = response.llm_output.get("token_usage", {})
        self.total_tokens += usage.get("total_tokens", 0)
    def on_chain_error(self, error, **kwargs):
        log.error("chain_error", error=str(error))

tracker = CostTrackingCallback()
chain.invoke({"query": "..."}, config={"callbacks": [tracker]})
print(f"Tokens used: {tracker.total_tokens}")`;function m({id:s,title:o,open:r,onToggle:a,children:u}){return e.jsxs(e.Fragment,{children:[e.jsxs("h2",{onClick:a,style:{cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",userSelect:"none"},children:[e.jsx("span",{style:{fontSize:"0.85em",color:"#6c7086",minWidth:"1em"},children:r?"▼":"▶"}),o]}),e.jsx("div",{style:{overflow:"hidden",maxHeight:r?"none":"0",transition:"max-height 0.3s ease"},children:u})]})}function Se(){const[s,o]=v.useState(new Set(["22.1","22.2"]));function r(a){o(u=>{const d=new Set(u);return d.has(a)?d.delete(a):d.add(a),d})}return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Explain what LangChain is and is not — and why LCEL replaced the old chain API"}),e.jsx("li",{children:"Write LCEL pipelines using the pipe operator and run them in parallel"}),e.jsx("li",{children:"Choose the right text splitter for prose, markdown, code, and semantic content and tune chunk size using RAGAS"}),e.jsx("li",{children:"Select the right embedding model (OpenAI, HuggingFace, Cohere) and cache embeddings in production"}),e.jsx("li",{children:"Choose a vector store (Chroma, FAISS, Pinecone, pgvector) based on scale, cost, and infra constraints"}),e.jsx("li",{children:"Build hybrid retrievers (BM25 + vector), SelfQueryRetriever, ParentDocumentRetriever, and contextual compression pipelines"}),e.jsx("li",{children:"Use PydanticOutputParser to guarantee structured output from any LLM"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~120 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★☆☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 2"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Context"}),e.jsx("br",{}),"Housing.com uses LCEL-style chains in its classifier and response nodes — ",e.jsx("code",{children:"ChatPromptTemplate | llm | JsonOutputParser"})," is the backbone of the two-stage SLM flow. This module teaches the full LangChain breadth beyond what Housing.com needed, covering the complete RAG stack: load → split → embed → store → retrieve."]}),e.jsx(T,{}),e.jsx("h2",{children:"§22.0 What LangChain Is Doing — 3 Lines vs 20 Lines"}),e.jsx("p",{children:"Before the abstractions: here is the same pipeline written twice. The LCEL version is 3 lines. The vanilla Python version is what LangChain is actually executing inside those 3 lines."}),e.jsx(t,{title:"LCEL vs Vanilla Python — What LangChain Hides",language:"python",keyLine:8,keyNote:"pipe operator builds a lazy RunnableSequence",children:`# ── LCEL version — 3 lines ────────────────────────────────────────────────────
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

chain = (
    ChatPromptTemplate.from_template("Classify: {message}. Reply as JSON: {{'intent': str}}")
    | ChatAnthropic(model="claude-haiku-4-5-20251001", max_tokens=64)
    | JsonOutputParser()
)
result = chain.invoke({"message": "show 2BHK in Bandra"})

# ── What LangChain is actually doing (vanilla Python equivalent) ───────────────
import anthropic, json

def classify(message: str) -> dict:
    # 1. ChatPromptTemplate.format_messages() builds a list of message dicts
    messages = [{"role": "user", "content": f"Classify: {message}. Reply as JSON: {{'intent': str}}"}]

    # 2. ChatAnthropic.invoke() calls the Anthropic API
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=64,
        messages=messages,
    )

    # 3. The AIMessage wraps the response text
    text = response.content[0].text

    # 4. JsonOutputParser.parse() runs json.loads()
    return json.loads(text)

result = classify("show 2BHK in Bandra")
# → {"intent": "property_search"}
# Both versions produce identical output.`}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"The invariant:"})," Every LangChain abstraction has an equivalent vanilla Python implementation. When something breaks, write the vanilla version in a scratch file, compare outputs, and the LCEL version will make sense. The next section covers each abstraction with its vanilla equivalent."]}),e.jsxs(m,{id:"22.1",title:"22.1 What LangChain Actually Is",open:s.has("22.1"),onToggle:()=>r("22.1"),children:[e.jsxs("p",{children:["LangChain is a ",e.jsx("strong",{children:"composability layer"})," over LLMs — not a framework. It provides LCEL (a standard interface for chaining components), 200+ integrations, and abstractions like ",e.jsx("code",{children:"Runnable"}),", ",e.jsx("code",{children:"Retriever"}),", ",e.jsx("code",{children:"Memory"}),", and ",e.jsx("code",{children:"OutputParser"}),"."]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What LangChain is NOT"})," ","It doesn't host models, doesn't manage agent state (that's LangGraph), and isn't required — but it dramatically reduces boilerplate for common patterns."]}),e.jsx(t,{title:"LangChain vs Vanilla Python — Identical Output",language:"python",keyLine:8,keyNote:"LCEL chain: same result in 3 lines vs 20",children:O}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"The equivalence principle:"}),' Once you see that LCEL maps 1-to-1 onto vanilla Python, you can debug any LangChain abstraction by asking: "what Python is this hiding?" Confused by a retriever? Write the same logic in 5 lines of Python, compare outputs, and the LangChain version will make sense.']})]}),e.jsxs(m,{id:"22.2",title:"22.2 LCEL — LangChain Expression Language",open:s.has("22.2"),onToggle:()=>r("22.2"),children:[e.jsxs("p",{children:["LCEL uses ",e.jsx("code",{children:"|"})," (pipe) to compose ",e.jsx("code",{children:"Runnable"})," objects. Every component — prompt, model, parser, retriever — implements the same interface."]}),e.jsx(t,{title:"LCEL Pipe and RunnableParallel",language:"python",keyLine:6,keyNote:"pipe operator composes Runnables lazily",children:F}),e.jsxs("p",{children:["Every ",e.jsx("code",{children:"Runnable"})," supports ",e.jsx("code",{children:".invoke()"}),", ",e.jsx("code",{children:".ainvoke()"}),", ",e.jsx("code",{children:".batch()"}),", ",e.jsx("code",{children:".stream()"}),", and ",e.jsx("code",{children:".astream()"}),". Writing ",e.jsx("code",{children:"LLMChain(...)"})," in an interview signals outdated LangChain knowledge — LCEL is the current API."]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"What LCEL actually does at runtime"})," ","The ",e.jsx("code",{children:"|"})," operator builds a ",e.jsx("code",{children:"RunnableSequence"})," object — it is ",e.jsx("strong",{children:"lazy"})," (no execution at pipe-time, like building an RxJS observable). Execution starts only when you call ",e.jsx("code",{children:".invoke()"})," or ",e.jsx("code",{children:".ainvoke()"}),".",e.jsx("br",{}),e.jsx("br",{}),e.jsx("code",{children:".invoke()"})," is ",e.jsx("strong",{children:"sequential"}),": calls each step in order, passing the output of step N as input to step N+1. No parallelism. If step 2 (LLM call) throws a ",e.jsx("code",{children:"RateLimitError"}),", the exception propagates immediately — LangChain wraps it as an ",e.jsx("code",{children:"openai.RateLimitError"})," (or Anthropic equivalent) so you see the provider's original exception type, not a LangChain wrapper. Add retry at the chain level with ",e.jsx("code",{children:"chain.with_retry(stop_after_attempt=3, wait_exponential_jitter=True)"}),".",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"RunnableParallel concurrency model:"})," when called with ",e.jsx("code",{children:".invoke()"})," (sync), it uses a thread pool executor. When called with ",e.jsx("code",{children:".ainvoke()"})," (async), it uses ",e.jsx("code",{children:"asyncio.gather"}),". ",e.jsx("strong",{children:"Fail-fast"}),": if one branch raises, the exception propagates and other branches may still be running — use ",e.jsx("code",{children:".ainvoke()"})," inside FastAPI and wrap individual branches in try/except if you need partial results."]})]}),e.jsxs(m,{id:"22.3",title:"22.3 Memory & Conversation History",open:s.has("22.3"),onToggle:()=>r("22.3"),children:[e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"Production verdict: do not use LangChain Memory in production."}),e.jsx("br",{}),"These four classes are useful for understanding concepts and for local prototyping. Every production system replaces them with explicit external state. This section explains why, and shows what the replacement looks like — including exactly how this codebase does it."]}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Memory type"}),e.jsx("th",{children:"How it works"}),e.jsx("th",{children:"LLM call per turn?"}),e.jsx("th",{children:"Breaks when"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ConversationBufferMemory"})}),e.jsx("td",{children:"Entire conversation verbatim, in-process"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"~20+ turns overflows context; restart wipes it"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ConversationBufferWindowMemory(k=5)"})}),e.jsx("td",{children:"Last k turns only, in-process"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Loses early context; still process-local"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ConversationSummaryMemory"})}),e.jsx("td",{children:"LLM rewrites summary after every turn"}),e.jsx("td",{children:e.jsx("strong",{children:"Yes — every turn"})}),e.jsx("td",{children:"Hallucination in summary; slow; expensive"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"ConversationSummaryBufferMemory"})}),e.jsx("td",{children:"Summary for old turns, verbatim for recent; LLM only called when buffer overflows"}),e.jsxs("td",{children:["Only when buffer exceeds ",e.jsx("code",{children:"max_token_limit"})]}),e.jsx("td",{children:"Most robust of the four — still process-local"})]})]})}),e.jsx("h3",{children:"22.3.0 Examples — what each type actually does"}),e.jsxs("p",{children:[e.jsx("strong",{children:"ConversationBufferMemory"})," — all turns verbatim until context overflow:"]}),e.jsx(t,{title:"ConversationBufferMemory — All Turns Verbatim",language:"python",keyLine:16,keyNote:"silently truncates early turns at 8K context overflow",children:H}),e.jsxs("p",{children:[e.jsx("strong",{children:"ConversationBufferWindowMemory"})," — sliding window, early context silently lost:"]}),e.jsx(t,{title:"ConversationBufferWindowMemory — Sliding k-Turn Window",language:"python",keyLine:4,keyNote:"evicts early turns silently; name is gone at turn 4",children:W}),e.jsxs("p",{children:[e.jsx("strong",{children:"ConversationSummaryMemory"})," — LLM rewrites a summary after every single turn:"]}),e.jsx(t,{title:"ConversationSummaryMemory — LLM Rewrites Summary Every Turn",language:"python",keyLine:3,keyNote:"summarizer LLM fires on every single turn",children:q}),e.jsxs("p",{children:[e.jsx("strong",{children:"ConversationSummaryBufferMemory"})," — hybrid: verbatim buffer for recent turns, summary for everything older. The LLM only fires when the buffer overflows ",e.jsx("code",{children:"max_token_limit"}),":"]}),e.jsx(t,{title:"ConversationSummaryBufferMemory — Hybrid Verbatim and Summary",language:"python",keyLine:6,keyNote:"LLM only fires when buffer exceeds max_token_limit",children:z}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"ConversationSummaryBufferMemory — who summarizes and how"}),e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Who:"})," the ",e.jsx("code",{children:"llm"})," parameter you pass to the constructor. You should pass a cheap fast model (Haiku) rather than your main LLM — the summarization prompt is simple and doesn't need the expensive model.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"When:"})," not every turn. Only when the verbatim buffer exceeds ",e.jsx("code",{children:"max_token_limit"})," tokens. If your limit is 200 tokens and a turn pushes the buffer to 220, the summarizer fires ",e.jsx("em",{children:"once"})," — it compresses the oldest turns into a new summary and the recent turns stay verbatim.",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"The prompt:"})," LangChain calls the summarizer with a fixed template — ",e.jsx("em",{children:'"Progressively summarize the lines of conversation provided, adding onto the previous summary. Current summary: {summary} New lines: {new_lines} New summary:"'}),' — the model is instructed to add, never to verify. This is why hallucination happens: it inlines interpretation ("flexible budget") without any grounding constraint.',e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"Output shape:"})," the summary is stored as a ",e.jsx("code",{children:"SystemMessage"})," prepended to the verbatim buffer. The LLM prompt your main chain sees looks like: ",e.jsx("code",{children:"[System: <summary>, Human: <recent turn>, AI: <response>, ...]"})]}),e.jsx("h3",{children:"22.3.1 Why all four fail in production"}),e.jsxs("p",{children:["Every LangChain Memory type shares the same fundamental flaw: ",e.jsx("strong",{children:"state lives in the process that created it"}),"."]}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"No horizontal scaling."})," If request 1 hits server A and request 2 hits server B, server B has no memory of turn 1. You're forced into sticky sessions, which breaks your load balancer and makes deploys cause user-visible errors."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"No persistence."})," Restart the process — all conversation history is gone. Rolling deployments wipe every active session mid-conversation."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"No TTL."})," Abandoned sessions accumulate in RAM until the process dies. At 10K concurrent users each carrying 20 turns, that's ~200MB of strings just sitting in memory with no cleanup path."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"No atomic writes."})," If two requests from the same user arrive simultaneously (e.g., mobile retry + desktop), both read the same state and race to write back. LangChain Memory has no locking — the last write wins and you lose a turn."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"LangGraph supersedes it."})," ",e.jsx("code",{children:"BotState"})," + a checkpointer (",e.jsx("code",{children:"SqliteSaver"})," for dev, ",e.jsx("code",{children:"RedisSaver"})," for prod) is the current pattern. LangChain Memory predates LangGraph and solves the same problem worse."]})]}),e.jsx("h3",{children:"22.3.2 What production conversation history looks like"}),e.jsxs("p",{children:["This codebase stores all conversation state in Redis, keyed by session ID. Here's the core pattern from ",e.jsx("code",{children:"session_store.py"}),":"]}),e.jsx(t,{title:"Redis Session Store — Production Conversation State",language:"python",keyLine:7,keyNote:"SETEX: atomic write with TTL, no race condition",children:G}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Property"}),e.jsx("th",{children:"LangChain BufferWindowMemory(k=5)"}),e.jsx("th",{children:"This codebase (Redis)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Where state lives"}),e.jsx("td",{children:"Python object in the process"}),e.jsx("td",{children:"Redis — shared across all servers"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Survives restart?"}),e.jsx("td",{children:"No"}),e.jsx("td",{children:"Yes (Redis AOF/RDB persistence)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Auto-expiry"}),e.jsx("td",{children:"No — leaks until process dies"}),e.jsxs("td",{children:["Yes — ",e.jsx("code",{children:"SETEX"})," TTL of 1 hour"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Race condition?"}),e.jsx("td",{children:"Yes — no locking"}),e.jsxs("td",{children:["No — ",e.jsx("code",{children:"SETEX"})," is atomic"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Horizontally scalable?"}),e.jsx("td",{children:"No — sticky sessions required"}),e.jsx("td",{children:"Yes — any server reads the same Redis key"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Window size"}),e.jsx("td",{children:"Constructor param, invisible at callsite"}),e.jsxs("td",{children:[e.jsx("code",{children:"[-20:]"})," slice — visible in the code, easy to audit"]})]})]})}),e.jsx("h3",{children:"22.3.3 Two windows — why the repo splits turn_history and last_3_turns"}),e.jsx("p",{children:"Not every pipeline stage needs the full conversation history. This codebase maintains two explicit windows:"}),e.jsx(t,{title:"Dual Turn-History Windows — Classifier vs Response Node",language:"python",keyLine:1,keyNote:"classifier gets last 3 turns; response node gets 20",children:U}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"The pattern: give each stage only what it needs"}),e.jsx("br",{}),"The classifier (Haiku, ~400 token budget) gets ",e.jsx("code",{children:"last_3_turns"})," — it only needs recent context to classify intent. The LLM response node (Sonnet, ~1200 token budget) gets ",e.jsx("code",{children:"turn_history[-20:]"})," — it needs the full arc to produce a coherent response. Sending 20 turns to Haiku would cost ~$510/day extra at 1M DAU for zero quality improvement."]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"When LangChain Memory is fine"}),e.jsx("br",{}),"Local prototyping, single-process CLI tools, offline scripts, Jupyter notebooks. If you're running on one machine and never need to scale, ",e.jsx("code",{children:"ConversationBufferWindowMemory"})," is fine — it's less code. The moment you add a second server, or need state to survive a deployment, switch to Redis."]})]}),e.jsxs(m,{id:"22.4",title:"22.4 Document Loaders",open:s.has("22.4"),onToggle:()=>r("22.4"),children:[e.jsxs("p",{children:["Every LangChain loader returns ",e.jsx("code",{children:"List[Document]"})," — objects with ",e.jsx("code",{children:".page_content"})," (string) and ",e.jsx("code",{children:".metadata"})," (dict). That uniform interface means your RAG pipeline doesn't care whether it loaded from a PDF, a Slack channel, or an S3 bucket."]}),e.jsx(t,{title:"LangChain Loader Ecosystem — 100+ Loaders, One Interface",language:"python",keyLine:5,keyNote:"lazy_load streams one Document at a time",children:X}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Loader"}),e.jsx("th",{children:"Under the hood"}),e.jsx("th",{children:"One Document per"}),e.jsx("th",{children:"Production trap"}),e.jsx("th",{children:"When to use"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"PyPDFLoader"})}),e.jsx("td",{children:"pypdf"}),e.jsx("td",{children:"Page"}),e.jsx("td",{children:"Scanned PDFs return empty content — no OCR"}),e.jsxs("td",{children:["Text-based PDFs only. Mixed/scanned → ",e.jsx("code",{children:"UnstructuredPDFLoader"})]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"WebBaseLoader"})}),e.jsx("td",{children:"requests + BeautifulSoup"}),e.jsx("td",{children:"URL"}),e.jsx("td",{children:"JS-rendered pages (React/Next.js) return shell HTML only"}),e.jsxs("td",{children:["Static sites, blogs, Wikipedia. SPAs → ",e.jsx("code",{children:"PlaywrightURLLoader"})]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"NotionDirectoryLoader"})}),e.jsx("td",{children:"Parses local Notion export"}),e.jsx("td",{children:"Markdown file"}),e.jsx("td",{children:"Point-in-time snapshot — stale after any edit"}),e.jsxs("td",{children:["One-off RAG setup. Live sync → ",e.jsx("code",{children:"NotionDBLoader"})," (API)"]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"GitLoader"})}),e.jsx("td",{children:"gitpython"}),e.jsx("td",{children:"File"}),e.jsx("td",{children:"No extension filter → loads .png, .lock, node_modules"}),e.jsx("td",{children:"Codebase Q&A, doc generation. Always filter by extension + path"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"CSVLoader"})}),e.jsx("td",{children:"Python csv module"}),e.jsx("td",{children:"Row"}),e.jsxs("td",{children:[e.jsx("code",{children:".load()"})," reads entire file into RAM — 100K rows = crash"]}),e.jsxs("td",{children:["Small datasets. Large CSVs → use ",e.jsx("code",{children:".lazy_load()"})]})]})]})}),e.jsx("h3",{children:"22.4.1 PyPDFLoader — text PDFs vs scanned PDFs"}),e.jsx(t,{title:"PyPDFLoader — Text PDFs vs Scanned PDFs",language:"python",keyLine:8,keyNote:"scanned PDFs return empty content; use UnstructuredPDFLoader",children:V}),e.jsx("h3",{children:"22.4.2 WebBaseLoader — static pages vs JS-rendered SPAs"}),e.jsx(t,{title:"WebBaseLoader — Static Pages vs JS-Rendered SPAs",language:"python",keyLine:13,keyNote:"JS-rendered React/Next.js pages need PlaywrightURLLoader",children:K}),e.jsx("h3",{children:"22.4.3 Notion — export snapshot vs live API"}),e.jsx(t,{title:"Notion Loaders — Export Snapshot vs Live API",language:"python",keyLine:10,keyNote:"export is stale after any edit; NotionDBLoader stays in sync",children:Q}),e.jsx("h3",{children:"22.4.4 GitLoader — codebase ingestion"}),e.jsx(t,{title:"GitLoader — Codebase Ingestion with Extension Filter",language:"python",keyLine:6,keyNote:"always filter by extension to skip binaries and lock files",children:Y}),e.jsx("h3",{children:"22.4.5 CSVLoader — row-per-document with filterable metadata"}),e.jsx(t,{title:"CSVLoader — Row-per-Document with Filterable Metadata",language:"python",keyLine:18,keyNote:"use lazy_load() for large files to avoid RAM exhaustion",children:J}),e.jsx("h3",{children:"22.4.6 Production patterns: lazy loading, error handling, deduplication"}),e.jsx(t,{title:"Document Loader Production Patterns — Lazy Load, Error Handling, Dedup",language:"python",keyLine:6,keyNote:"lazy_load processes one page at a time, avoids OOM",children:$}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"The metadata rule"}),e.jsx("br",{}),"Always add ",e.jsx("code",{children:"tenant_id"}),", ",e.jsx("code",{children:"doc_type"}),", and a stable ",e.jsx("code",{children:"doc_id"})," to every document's metadata before indexing. Without these, you can't scope retrieval to a tenant, you can't delete-and-reindex a single document, and you can't tell the LLM where the answer came from. Adding metadata costs nothing at index time; missing it means rebuilding the entire index."]})]}),e.jsx(B,{}),e.jsxs(m,{id:"22.5",title:"22.5 Text Splitters — The Decision That Determines RAG Quality",open:s.has("22.5"),onToggle:()=>r("22.5"),children:[e.jsx("p",{children:"The choice of splitter and chunk size is the single biggest lever on RAG quality. A chunk is what gets embedded and retrieved — if a chunk contains the answer plus five unrelated paragraphs, the LLM gets noise. If the chunk splits the answer across two boundaries, neither chunk contains it fully."}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Splitter"}),e.jsx("th",{children:"Best for"}),e.jsx("th",{children:"Key parameters"}),e.jsx("th",{children:"When to choose"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"RecursiveCharacterTextSplitter"})}),e.jsx("td",{children:"General prose, unknown format"}),e.jsx("td",{children:e.jsx("code",{children:"chunk_size=512, chunk_overlap=50"})}),e.jsx("td",{children:"Default — start here"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"MarkdownHeaderTextSplitter"})}),e.jsx("td",{children:"Markdown docs, wikis"}),e.jsx("td",{children:e.jsx("code",{children:"headers_to_split_on"})}),e.jsx("td",{children:"When heading context must be in metadata"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"HTMLHeaderTextSplitter"})}),e.jsx("td",{children:"Web pages, HTML docs"}),e.jsx("td",{children:e.jsx("code",{children:"headers_to_split_on"})}),e.jsx("td",{children:"Scraped HTML with semantic heading structure"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"from_language(Language.PYTHON)"})}),e.jsx("td",{children:"Code — respects class/function boundaries"}),e.jsx("td",{children:e.jsx("code",{children:"chunk_size=1000, chunk_overlap=100"})}),e.jsx("td",{children:"Codebase Q&A, PR review tools"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"SemanticChunker"})}),e.jsx("td",{children:"Dense prose where topic shifts mid-section"}),e.jsx("td",{children:e.jsx("code",{children:"embeddings, breakpoint_threshold_type"})}),e.jsx("td",{children:"When RAGAS context_precision is low despite tuning"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"TokenTextSplitter"})}),e.jsx("td",{children:"When you need exact token counts"}),e.jsxs("td",{children:[e.jsx("code",{children:"chunk_size=256"})," (tokens)"]}),e.jsx("td",{children:"Fixed token budget per retrieved chunk"})]})]})}),e.jsx("h3",{children:"22.5.1 RecursiveCharacterTextSplitter — the universal default"}),e.jsx(t,{title:"RecursiveCharacterTextSplitter — Universal Default",language:"python",keyLine:6,keyNote:"separator hierarchy ensures paragraph before word splits",children:Z}),e.jsx("h3",{children:"22.5.2 MarkdownHeaderTextSplitter — preserve section context as metadata"}),e.jsx(t,{title:"MarkdownHeaderTextSplitter — Section Context in Metadata",language:"python",keyLine:6,keyNote:"heading context propagated into every sub-chunk metadata",children:ee}),e.jsx("h3",{children:"22.5.3 Code splitter — respects class and function boundaries"}),e.jsx(t,{title:"Language-Aware Code Splitter — Respects Class and Function Boundaries",language:"python",keyLine:11,keyNote:"from_language uses syntax-aware separators per language",children:te}),e.jsx("h3",{children:"22.5.4 SemanticChunker — topic-aware splitting"}),e.jsx(t,{title:"SemanticChunker — Topic-Aware Splitting via Embedding Distance",language:"python",keyLine:19,keyNote:"splits where cosine distance between sentences exceeds threshold",children:re}),e.jsx("h3",{children:"22.5.5 TokenTextSplitter — exact token control"}),e.jsx(t,{title:"TokenTextSplitter — Exact Token Budget Control",language:"python",keyLine:3,keyNote:"chunk_size is tokens not characters; cuts mid-sentence",children:ne}),e.jsx("h3",{children:"22.5.6 Production: picking chunk size with RAGAS feedback"}),e.jsx(t,{title:"Chunk Size Tuning with RAGAS Feedback Loop",language:"python",keyLine:12,keyNote:"context_precision low = chunks too large; recall low = too small",children:se}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:'"Why not just send the whole document?"'})," ","With 200K token context window, a 100-page PDF (~50K tokens) fits in a single prompt. For one document, ",e.jsx("strong",{children:"long-context inference is simpler and correct"})," — skip RAG entirely.",e.jsx("br",{}),e.jsx("br",{}),"RAG exists for ",e.jsx("strong",{children:"corpora too large to fit in context"}),": 10,000 property listings, a company knowledge base with 50,000 pages, a code repository with 1M lines. You cannot stuff all 10,000 listings into every prompt — you retrieve the 5 most relevant chunks for ",e.jsx("em",{children:"this specific query"}),".",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"chunk_overlap prevents answers from spanning boundaries without a bridge:"}),e.jsx("br",{}),'Without overlap: chunk 1 ends "price ₹2.5Cr" — chunk 2 starts "possession Q2 2026" — the answer "2.5Cr with Q2 2026 possession" is split. With overlap=50, the last 50 characters of chunk 1 repeat at the start of chunk 2, so either chunk contains the full answer.']})]}),e.jsx(D,{}),e.jsxs(m,{id:"22.6",title:"22.6 Embeddings — Turning Text Into Vectors",open:s.has("22.6"),onToggle:()=>r("22.6"),children:[e.jsx("p",{children:"After splitting, every chunk must be converted to a dense vector so it can be stored in and retrieved from a vector database. The embedding model's quality sets a hard ceiling on retrieval quality — no retrieval strategy compensates for poor embeddings."}),e.jsx(t,{title:"Embeddings Base Interface — embed_documents vs embed_query",language:"python",keyLine:6,keyNote:"asymmetric embeddings: mixing heads silently degrades retrieval",children:ie}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Provider"}),e.jsx("th",{children:"Model"}),e.jsx("th",{children:"Dims"}),e.jsx("th",{children:"Cost / 1M tokens"}),e.jsx("th",{children:"When to use"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"OpenAI"}),e.jsx("td",{children:e.jsx("code",{children:"text-embedding-3-small"})}),e.jsx("td",{children:"1536"}),e.jsx("td",{children:"$0.02"}),e.jsx("td",{children:"Default for English — best value for quality"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"OpenAI"}),e.jsx("td",{children:e.jsx("code",{children:"text-embedding-3-large"})}),e.jsx("td",{children:"3072"}),e.jsx("td",{children:"$0.13"}),e.jsx("td",{children:"When RAGAS recall stays low with 3-small"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Cohere"}),e.jsx("td",{children:e.jsx("code",{children:"embed-multilingual-v3"})}),e.jsx("td",{children:"1024"}),e.jsx("td",{children:"$0.10"}),e.jsx("td",{children:"Non-English or mixed-language corpora"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"HuggingFace"}),e.jsx("td",{children:e.jsx("code",{children:"BAAI/bge-m3"})}),e.jsx("td",{children:"1024"}),e.jsx("td",{children:"Free (local)"}),e.jsx("td",{children:"No external calls, GDPR/HIPAA compliance"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"FastEmbed"}),e.jsx("td",{children:e.jsx("code",{children:"BAAI/bge-small-en-v1.5"})}),e.jsx("td",{children:"384"}),e.jsx("td",{children:"Free (local)"}),e.jsx("td",{children:"Fastest CPU inference — dev and edge deployment"})]})]})}),e.jsx("h3",{children:"22.6.1 OpenAI — production default"}),e.jsx(t,{title:"OpenAI Embeddings — Production Default with Dimensionality Reduction",language:"python",keyLine:7,keyNote:"dimensions param truncates 3072 to 512 via Matryoshka training",children:oe}),e.jsx("h3",{children:"22.6.2 HuggingFace — free local embeddings"}),e.jsx(t,{title:"HuggingFace Local Embeddings — Zero Cost, GDPR-Safe",language:"python",keyLine:5,keyNote:"normalize_embeddings=True required for correct cosine similarity",children:ae}),e.jsx("h3",{children:"22.6.3 Cohere — best multilingual embeddings"}),e.jsx(t,{title:"Cohere Multilingual Embeddings — Asymmetric input_type",language:"python",keyLine:8,keyNote:"search_document vs search_query use different embedding heads",children:le}),e.jsx("h3",{children:"22.6.4 Production: caching, async batching, quality monitoring"}),e.jsx(t,{title:"Embedding Cache, Async Batching, and Quality Monitoring",language:"python",keyLine:5,keyNote:"CacheBackedEmbeddings uses SHA-256 key; swap to RedisStore for prod",children:de}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"The embedding cost calculation"}),e.jsx("br",{}),"Before committing to an embedding provider, calculate total ingestion cost:",e.jsx("br",{}),e.jsx("code",{children:"documents × avg_tokens_per_doc × cost_per_token"}),e.jsx("br",{}),"Example: 100K property listings × 300 tokens × $0.02/1M = ",e.jsx("strong",{children:"$0.60 total"})," with OpenAI 3-small.",e.jsx("br",{}),"At that scale, the cost is negligible — but at 10M listings with nightly reindexing, it's $60/night, which tips the decision toward local embeddings."]})]}),e.jsxs(m,{id:"22.7",title:"22.7 Vector Stores & Index Algorithms",open:s.has("22.7"),onToggle:()=>r("22.7"),children:[e.jsx("p",{children:"A vector store is a database that stores embeddings and supports nearest-neighbour queries. The internal algorithm determines the tradeoff between recall, latency, and RAM usage."}),e.jsx(t,{title:"Vector Index Algorithms — Flat, HNSW, IVF, IVF-PQ",language:"python",keyLine:9,keyNote:"HNSW: O(log n) latency, 6 GB RAM per 1M 1536-dim vectors",children:ce}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Store"}),e.jsx("th",{children:"Algorithm"}),e.jsx("th",{children:"Scale"}),e.jsx("th",{children:"Hosting"}),e.jsx("th",{children:"When to use"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Chroma"})}),e.jsx("td",{children:"HNSW (SQLite)"}),e.jsx("td",{children:"Up to ~500K vectors"}),e.jsx("td",{children:"In-process or Docker server"}),e.jsx("td",{children:"Local dev, prototypes, single-node"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"FAISS"})}),e.jsx("td",{children:"Flat / HNSW / IVF (configurable)"}),e.jsx("td",{children:"10K – 100M vectors"}),e.jsx("td",{children:"Self-hosted (process library)"}),e.jsx("td",{children:"Self-hosted, full control, no network"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Pinecone"})}),e.jsx("td",{children:"HNSW (managed)"}),e.jsx("td",{children:"Unlimited (auto-scale)"}),e.jsx("td",{children:"Cloud SaaS"}),e.jsx("td",{children:"Zero infra, enterprise SLAs, unpredictable growth"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Weaviate"})}),e.jsx("td",{children:"HNSW"}),e.jsx("td",{children:"10M+ vectors"}),e.jsx("td",{children:"Self-hosted or cloud"}),e.jsx("td",{children:"Hybrid search built-in, GraphQL API, multi-modal"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Qdrant"})}),e.jsx("td",{children:"HNSW + IVF-PQ"}),e.jsx("td",{children:"1B+ vectors (with quantization)"}),e.jsx("td",{children:"Self-hosted or cloud"}),e.jsx("td",{children:"Large scale with filtered search, Rust performance"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"pgvector"})}),e.jsx("td",{children:"HNSW (v0.5+) or IVFFlat"}),e.jsx("td",{children:"Up to ~5M vectors"}),e.jsx("td",{children:"Your Postgres server"}),e.jsx("td",{children:"Already on Postgres, ACID + SQL joins + vectors"})]})]})}),e.jsx("h3",{children:"22.7.1 Chroma — dev-first local store"}),e.jsx(t,{title:"Chroma Vector Store — Local Dev and Single-Node",language:"python",keyLine:11,keyNote:"no native update; delete then re-add with stable IDs",children:he}),e.jsx("h3",{children:"22.7.2 FAISS — self-hosted with full algorithm control"}),e.jsx(t,{title:"FAISS Vector Store — Self-Hosted with Full Algorithm Control",language:"python",keyLine:20,keyNote:"atomic index swap via shutil.move prevents partial-rebuild serving",children:me}),e.jsx("h3",{children:"22.7.3 Pinecone — managed cloud with namespace isolation"}),e.jsx(t,{title:"Pinecone Vector Store — Managed Cloud with Namespace Isolation",language:"python",keyLine:13,keyNote:"namespace isolates tenants; dimension mismatch requires full index rebuild",children:ue}),e.jsx("h3",{children:"22.7.4 pgvector — vector search inside Postgres"}),e.jsx(t,{title:"pgvector — Vector Search Inside Postgres",language:"python",keyLine:12,keyNote:"combined vector + SQL query impossible in Pinecone or Weaviate",children:pe}),e.jsx("h3",{children:"22.7.5 Production patterns: incremental ingestion, multi-tenant, atomic rebuilds"}),e.jsx(t,{title:"Vector Store Production Patterns — Incremental Ingestion and Rebuilds",language:"python",keyLine:2,keyNote:"hash-based dedup skips already-indexed documents",children:ge}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Vector store selection decision tree"}),e.jsx("br",{}),"1. Already on Postgres and corpus < 5M vectors? → ",e.jsx("strong",{children:"pgvector"})," (one less service)",e.jsx("br",{}),"2. Local dev / prototype? → ",e.jsx("strong",{children:"Chroma"})," (in-process, zero setup)",e.jsx("br",{}),"3. Self-hosted, 10K–50M vectors, full control? → ",e.jsx("strong",{children:"FAISS"})," (no server, process library)",e.jsx("br",{}),"4. Zero infra management, unpredictable scale? → ",e.jsx("strong",{children:"Pinecone"}),e.jsx("br",{}),"5. Multi-modal or built-in hybrid search (BM25 + vector)? → ",e.jsx("strong",{children:"Weaviate"}),e.jsx("br",{}),"6. Billion-scale with heavy metadata filtering? → ",e.jsx("strong",{children:"Qdrant"})]})]}),e.jsxs(m,{id:"22.8",title:"22.8 Retrievers",open:s.has("22.8"),onToggle:()=>r("22.8"),children:[e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"BM25 explained for non-search engineers"})," ","BM25 (Best Match 25) is keyword-based search — same family as Elasticsearch and Postgres full-text search (",e.jsx("code",{children:"tsvector"}),"). It counts how often your query terms appear in each document, weighted by how rare those terms are across all documents.",e.jsx("br",{}),e.jsx("br",{}),'Where it beats vector search: a user types "HOM-9873" (a specific property ID). Vector search finds "properties in Bandra" (semantic match) and misses the exact ID. BM25 finds it because it does exact keyword matching.',e.jsx("br",{}),e.jsx("br",{}),'Where vector search beats BM25: user types "seaside apartment" but the listing says "sea-facing flat." BM25 scores zero (no keyword match). Vector search finds it because "seaside" and "sea-facing" are semantically close.',e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"EnsembleRetriever weights:"})," weights=[0.4, 0.6] means final_score = 0.4 × bm25_score + 0.6 × cosine_similarity. Both retrievers fetch k=5 results each; the ensemble deduplicates and re-ranks — you get k=5 total, not 10."]}),e.jsx(t,{title:"Hybrid Retriever Stack — BM25, Multi-Query, and Contextual Compression",language:"python",keyLine:5,keyNote:"EnsembleRetriever: 0.4 BM25 + 0.6 vector is the production default",children:xe}),e.jsx("h3",{children:"22.8.1 VectorStoreRetriever — similarity, MMR, and score threshold"}),e.jsx(t,{title:"VectorStoreRetriever — Similarity, MMR, and Score Threshold",language:"python",keyLine:13,keyNote:"score_threshold returns nothing rather than low-quality context",children:ye}),e.jsx("h3",{children:"22.8.2 SelfQueryRetriever — LLM parses query into semantic + metadata filter"}),e.jsx(t,{title:"SelfQueryRetriever — LLM Parses Query into Semantic and Metadata Filter",language:"python",keyLine:10,keyNote:"enable_limit lets 'show me 3 properties' set k=3 dynamically",children:fe}),e.jsx("h3",{children:"22.8.3 ParentDocumentRetriever — precise retrieval, full context"}),e.jsx(t,{title:"ParentDocumentRetriever — Precise Retrieval with Full Context",language:"python",keyLine:13,keyNote:"index small child chunks, return large parent chunks to LLM",children:be}),e.jsx("h3",{children:"22.8.4 ContextualCompressionRetriever — strip irrelevant sentences"}),e.jsx(t,{title:"ContextualCompressionRetriever — Strip Irrelevant Sentences",language:"python",keyLine:15,keyNote:"EmbeddingsFilter: no LLM cost; LLMChainExtractor: higher quality",children:ve}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Retriever selection guide"}),e.jsx("br",{}),e.jsx("strong",{children:"Default:"})," ",e.jsx("code",{children:"EnsembleRetriever(bm25 + vector, weights=[0.4, 0.6])"})," — hybrid search wins in nearly every production domain.",e.jsx("br",{}),e.jsx("strong",{children:"Repetitive results?"})," Switch vector retriever to ",e.jsx("code",{children:'search_type="mmr"'}),".",e.jsx("br",{}),e.jsx("strong",{children:"Structured metadata (city, price, bedrooms)?"})," Add ",e.jsx("code",{children:"SelfQueryRetriever"})," — the LLM generates the filter automatically.",e.jsx("br",{}),e.jsx("strong",{children:"Small index chunks, but LLM needs context?"})," Use ",e.jsx("code",{children:"ParentDocumentRetriever"}),".",e.jsx("br",{}),e.jsx("strong",{children:"Context still noisy after hybrid?"})," Add ",e.jsx("code",{children:"ContextualCompressionRetriever"})," with ",e.jsx("code",{children:"EmbeddingsFilter"})," (cheaper) or ",e.jsx("code",{children:"LLMChainExtractor"})," (higher quality)."]})]}),e.jsxs(m,{id:"22.9",title:"22.9 Output Parsers",open:s.has("22.9"),onToggle:()=>r("22.9"),children:[e.jsx(t,{title:"PydanticOutputParser — Structured Output with Type Validation",language:"python",keyLine:8,keyNote:"format_instructions injected into prompt via .partial()",children:_e}),e.jsxs("p",{children:["For small models trained to output JSON directly (like this codebase's Haiku classifier), skip the parser and use the raw JSON. For larger general-purpose models, ",e.jsx("code",{children:"PydanticOutputParser"})," is cleaner and self-documenting."]})]}),e.jsxs(m,{id:"22.10",title:"22.10 Callbacks",open:s.has("22.10"),onToggle:()=>r("22.10"),children:[e.jsx(t,{title:"Cost Tracking Callback — Token Usage and Error Alerting",language:"python",keyLine:4,keyNote:"on_llm_end fires after every LLM response with token counts",children:je}),e.jsx("p",{children:"Callbacks fire at chain/LLM/tool/retriever start and end. Use them for cost tracking, custom logging, and error alerting when LangSmith is not available."}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"})," ",'"Design a RAG pipeline for 10M property listings." → Walk through each layer: splitter decision (format-aware for structured docs, recursive for general prose), embedding model selection (cost vs quality tradeoff with RAGAS as the feedback signal), vector store choice (FAISS for self-hosted, Pinecone for managed, pgvector if already on Postgres), retriever strategy (hybrid BM25+vector by default, ParentDocumentRetriever when chunks are small, ContextualCompression when context precision is low). The interviewer is checking whether you understand the tradeoffs — not whether you can recite the class names.']})]}),e.jsx(I,{moduleId:24,title:"Module 24: LangChain Ecosystem",contentHint:"LCEL pipe operator and Runnable protocol, ConversationSummaryBufferMemory vs BufferWindowMemory tradeoffs, RecursiveCharacterTextSplitter vs SemanticChunker vs MarkdownHeaderTextSplitter, RAGAS evaluation for chunk tuning, OpenAI vs HuggingFace vs Cohere embeddings, HNSW vs IVF algorithms, Chroma vs FAISS vs Pinecone vs pgvector selection, EnsembleRetriever hybrid search, SelfQueryRetriever, ParentDocumentRetriever, ContextualCompressionRetriever, PydanticOutputParser structured output"})]})}export{Se as Mod23};
