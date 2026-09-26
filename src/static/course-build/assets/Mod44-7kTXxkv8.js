import{j as e,r as C}from"./index-D4pJPyGz.js";import{Q as P}from"./QuizSection-BedG7s-t.js";import{C as o}from"./CodeBlock-dJ_hHYfw.js";const T=.6,F=.9,W=[.45,.28,.31,.52],O=[.82,.79,.87,.89],N=[.74,.91,.88,.82];function D(){const v=[{label:"Context Precision",color:"#f9e2af",desc:"Signal-to-noise in retrieval"},{label:"Context Recall",color:"#a6e3a1",desc:"Coverage of ground truth"},{label:"Faithfulness",color:"#89b4fa",desc:"No hallucination in claims"},{label:"Answer Relevancy",color:"#94e2d5",desc:"Answers the right question"}],[h,l]=C.useState(N),[m,j]=C.useState(N.map(()=>0)),[L,k]=C.useState(!1),r=C.useRef(null);function i(a){r.current&&cancelAnimationFrame(r.current),j(p=>{const t=[...p];k(!0);let n=null;const s=900;function d(b){n||(n=b);const S=Math.min((b-n)/s,1),E=1-Math.pow(1-S,3);j(a.map((M,R)=>parseFloat((t[R]+(M-t[R])*E).toFixed(3)))),S<1&&(r.current=requestAnimationFrame(d))}return r.current=requestAnimationFrame(d),t}),l(a)}function f(a,p,t,n,s){const d=G=>G*Math.PI/180,b=a+t*Math.cos(d(n)),S=p+t*Math.sin(d(n)),E=a+t*Math.cos(d(s)),M=p+t*Math.sin(d(s)),R=s-n>180?1:0;return`M ${b} ${S} A ${t} ${t} 0 ${R} 1 ${E} ${M}`}function x(a,p,t,n){const s=d=>d*Math.PI/180;return{inner:{x:a+(t-7)*Math.cos(s(n)),y:p+(t-7)*Math.sin(s(n))},outer:{x:a+(t+7)*Math.cos(s(n)),y:p+(t+7)*Math.sin(s(n))},dot:{x:a+(t+10)*Math.cos(s(n)),y:p+(t+10)*Math.sin(s(n))}}}const c=135,u=270,w=60,A=65,_=36,I=c+u*T,q=c+u*F,g=x(w,A,_,I),y=x(w,A,_,q);return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("style",{children:`
    @keyframes ragasPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.25; }
    }
  `}),e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"RAGAS METRICS DASHBOARD — 4 DIMENSIONS OF RAG QUALITY"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"14px"},children:v.map((a,p)=>{const t=L?m[p]:0,n=c+u*Math.min(t,1),s=t>.001&&t<T,d=s?"#f38ba8":a.color;return e.jsxs("div",{style:{background:"#1e1e2e",borderRadius:"8px",padding:"14px",textAlign:"center"},children:[e.jsxs("svg",{viewBox:"0 0 120 90",width:"100%",style:{display:"block",margin:"0 auto",maxHeight:"90px",overflow:"visible"},children:[e.jsx("path",{d:f(w,A,_,c,c+u),fill:"none",stroke:"#313244",strokeWidth:"7",strokeLinecap:"round"}),t>.001&&e.jsx("path",{d:f(w,A,_,c,n),fill:"none",stroke:d,strokeWidth:"7",strokeLinecap:"round",style:{transition:"none",animation:s?"ragasPulse 1.2s ease-in-out infinite":"none"}}),e.jsx("line",{x1:g.inner.x,y1:g.inner.y,x2:g.outer.x,y2:g.outer.y,stroke:"#f9e2af",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("circle",{cx:g.dot.x,cy:g.dot.y,r:"2.5",fill:"#f9e2af"}),e.jsx("line",{x1:y.inner.x,y1:y.inner.y,x2:y.outer.x,y2:y.outer.y,stroke:"#a6e3a1",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("circle",{cx:y.dot.x,cy:y.dot.y,r:"2.5",fill:"#a6e3a1"}),e.jsx("text",{x:w,y:A-1,textAnchor:"middle",fontSize:"17",fontWeight:"700",fill:s?"#f38ba8":a.color,children:t.toFixed(2)})]}),e.jsxs("div",{style:{fontSize:"0.78rem",fontWeight:700,color:s?"#f38ba8":"#cdd6f4",marginBottom:"2px"},children:[a.label,s?" ⚠":""]}),e.jsx("div",{style:{fontSize:"0.70rem",color:"#6c7086"},children:a.desc})]},a.label)})}),e.jsxs("div",{style:{display:"flex",justifyContent:"center",gap:"18px",marginBottom:"12px",fontSize:"0.68rem",color:"#6c7086",flexWrap:"wrap"},children:[e.jsxs("span",{children:[e.jsx("span",{style:{color:"#f9e2af",fontWeight:700},children:"⎯ 0.60"})," minimum threshold"]}),e.jsxs("span",{children:[e.jsx("span",{style:{color:"#a6e3a1",fontWeight:700},children:"⎯ 0.90"})," excellent"]}),e.jsxs("span",{children:[e.jsx("span",{style:{color:"#f38ba8",fontWeight:700},children:"▪ pulse"})," = below threshold — fix required"]})]}),e.jsxs("div",{style:{textAlign:"center",display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center"},children:[e.jsx("button",{onClick:()=>i(W),style:{background:"#2d1b1b",color:"#f38ba8",border:"1px solid #f38ba866",borderRadius:"6px",padding:"5px 14px",fontSize:"0.78rem",cursor:"pointer"},children:"▼ Load Failing System"}),e.jsx("button",{onClick:()=>i(O),style:{background:"#1b2d1b",color:"#a6e3a1",border:"1px solid #a6e3a166",borderRadius:"6px",padding:"5px 14px",fontSize:"0.78rem",cursor:"pointer"},children:"▲ Load Passing System"}),e.jsx("button",{onClick:()=>i(h),style:{background:"#313244",color:"#cdd6f4",border:"1px solid #45475a",borderRadius:"6px",padding:"5px 14px",fontSize:"0.78rem",cursor:"pointer"},children:"↺ Re-animate"})]})]})}function z(){const v=Array.from({length:10},(r,i)=>i<3),h=Array.from({length:10},(r,i)=>i<8),l=18,m=22,j=4,L=10,k=60;return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"CONTEXT PRECISION — SIGNAL-TO-NOISE RATIO IN RETRIEVED CHUNKS"}),e.jsxs("svg",{viewBox:"0 0 560 180",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Context Precision visualization",children:[e.jsx("rect",{x:"0",y:"0",width:"270",height:"175",rx:"6",fill:"#1e1e2e",stroke:"#313244"}),e.jsx("text",{x:"135",y:"18",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#f38ba8",children:"Bad Retrieval (CP = 0.30)"}),e.jsx("text",{x:"135",y:"34",textAnchor:"middle",fontSize:"10",fill:"#6c7086",children:'Query: "What is the price of 2BHK in Bandra?"'}),v.map((r,i)=>{const f=i%5,x=Math.floor(i/5),c=L+f*(l+j),u=k+x*(m+6);return e.jsxs("g",{children:[e.jsx("rect",{x:c,y:u,width:l,height:m,rx:"4",fill:r?"#a6e3a122":"#31324488",stroke:r?"#a6e3a1":"#45475a",strokeWidth:"1.5"}),e.jsx("text",{x:c+l/2,y:u+m/2+4,textAnchor:"middle",fontSize:"9",fill:r?"#a6e3a1":"#6c7086",children:r?"✓":"✗"})]},i)}),e.jsx("text",{x:"135",y:"148",textAnchor:"middle",fontSize:"11",fill:"#f9e2af",children:"3/10 relevant = precision 0.30"}),e.jsx("text",{x:"135",y:"165",textAnchor:"middle",fontSize:"10",fill:"#6c7086",children:"7 noise chunks drown the signal"}),e.jsx("rect",{x:"290",y:"0",width:"270",height:"175",rx:"6",fill:"#1e1e2e",stroke:"#313244"}),e.jsx("text",{x:"425",y:"18",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#a6e3a1",children:"Good Retrieval (CP = 0.80)"}),e.jsx("text",{x:"425",y:"34",textAnchor:"middle",fontSize:"10",fill:"#6c7086",children:'Query: "What is the price of 2BHK in Bandra?"'}),h.map((r,i)=>{const f=i%5,x=Math.floor(i/5),c=300+f*(l+j),u=k+x*(m+6);return e.jsxs("g",{children:[e.jsx("rect",{x:c,y:u,width:l,height:m,rx:"4",fill:r?"#a6e3a122":"#31324488",stroke:r?"#a6e3a1":"#45475a",strokeWidth:"1.5"}),e.jsx("text",{x:c+l/2,y:u+m/2+4,textAnchor:"middle",fontSize:"9",fill:r?"#a6e3a1":"#6c7086",children:r?"✓":"✗"})]},i)}),e.jsx("text",{x:"425",y:"148",textAnchor:"middle",fontSize:"11",fill:"#a6e3a1",children:"8/10 relevant = precision 0.80"}),e.jsx("text",{x:"425",y:"165",textAnchor:"middle",fontSize:"10",fill:"#6c7086",children:"Focused, high-signal retrieval"})]})]})}function B(){const v=[{text:'"Bandra has 47 active listings"',supported:!0},{text:'"Average price is ₹1.8Cr"',supported:!0},{text:'"Prices increased 15% last year"',supported:!1}];return e.jsxs("div",{style:{background:"#181825",border:"1px solid #313244",borderRadius:"8px",padding:"20px",margin:"20px 0",overflow:"hidden"},children:[e.jsx("div",{style:{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6c7086",marginBottom:"14px"},children:"FAITHFULNESS — EVERY CLAIM MUST BE GROUNDED IN RETRIEVED CONTEXT"}),e.jsxs("svg",{viewBox:"0 0 560 200",width:"100%",style:{display:"block",margin:"0 auto"},"aria-label":"Faithfulness claim verification",children:[e.jsx("style",{children:"@keyframes dashFlowFaith{to{stroke-dashoffset:-14}}"}),e.jsxs("defs",{children:[e.jsx("marker",{id:"arrowGreen44",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#a6e3a1"})}),e.jsx("marker",{id:"arrowRed44",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",children:e.jsx("path",{d:"M0,0 L0,6 L8,3 z",fill:"#f38ba8"})})]}),e.jsx("rect",{x:"0",y:"10",width:"240",height:"140",rx:"6",fill:"#1e1e2e",stroke:"#89b4fa",strokeWidth:"1.5"}),e.jsx("text",{x:"120",y:"28",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#89b4fa",children:"LLM Response — Claims Extracted"}),v.map((h,l)=>e.jsxs("g",{children:[e.jsx("text",{x:"12",y:55+l*38,fontSize:"11",fill:h.supported?"#a6e3a1":"#f38ba8",children:h.supported?"✓":"✗"}),e.jsx("text",{x:"24",y:55+l*38,fontSize:"10",fill:h.supported?"#cdd6f4":"#f38ba8",children:h.text}),e.jsx("text",{x:"24",y:70+l*38,fontSize:"9",fill:h.supported?"#a6e3a1":"#f38ba8",children:h.supported?"supported by context":"NOT IN CONTEXT — hallucination"})]},l)),e.jsx("rect",{x:"320",y:"10",width:"240",height:"140",rx:"6",fill:"#1e1e2e",stroke:"#45475a",strokeWidth:"1.5"}),e.jsx("text",{x:"440",y:"28",textAnchor:"middle",fontSize:"11",fontWeight:"700",fill:"#cdd6f4",children:"Retrieved Context Chunks"}),e.jsx("rect",{x:"330",y:"36",width:"220",height:"32",rx:"4",fill:"#313244"}),e.jsx("text",{x:"440",y:"55",textAnchor:"middle",fontSize:"10",fill:"#bac2de",children:"Bandra West: 47 properties listed"}),e.jsx("text",{x:"440",y:"67",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"as of April 2025 on Housing.com"}),e.jsx("rect",{x:"330",y:"74",width:"220",height:"32",rx:"4",fill:"#313244"}),e.jsx("text",{x:"440",y:"93",textAnchor:"middle",fontSize:"10",fill:"#bac2de",children:"Average 2BHK price: ₹1.8 Crore"}),e.jsx("text",{x:"440",y:"105",textAnchor:"middle",fontSize:"9",fill:"#6c7086",children:"Q1 2025, Bandra West locality"}),e.jsx("rect",{x:"330",y:"112",width:"220",height:"32",rx:"4",fill:"#31324466"}),e.jsx("text",{x:"440",y:"131",textAnchor:"middle",fontSize:"10",fill:"#6c7086",children:"No YoY price change data"}),e.jsx("text",{x:"440",y:"143",textAnchor:"middle",fontSize:"9",fill:"#45475a",children:"in retrieved context"}),e.jsx("line",{x1:"240",y1:"52",x2:"320",y2:"52",stroke:"#a6e3a1",strokeWidth:"1.5",markerEnd:"url(#arrowGreen44)"}),e.jsx("line",{x1:"240",y1:"90",x2:"320",y2:"90",stroke:"#a6e3a1",strokeWidth:"1.5",markerEnd:"url(#arrowGreen44)"}),e.jsx("line",{x1:"240",y1:"127",x2:"320",y2:"128",stroke:"#f38ba8",strokeWidth:"1.5",strokeDasharray:"4 3",style:{animation:"dashFlowFaith 1s linear infinite"},markerEnd:"url(#arrowRed44)"}),e.jsx("rect",{x:"160",y:"162",width:"240",height:"28",rx:"6",fill:"#313244"}),e.jsx("text",{x:"280",y:"181",textAnchor:"middle",fontSize:"12",fontWeight:"700",fill:"#89b4fa",children:"Faithfulness = 2/3 = 0.67"})]})]})}const H=`pip install ragas langchain-openai langchain-anthropic pandas

# RAGAS uses an LLM internally for its judge-based metrics.
# Any LangChain-compatible LLM works.`,Y=`from ragas import EvaluationDataset, SingleTurnSample

# Each sample = one question-answer-context triple
samples = [
    SingleTurnSample(
        user_input="What is the price of 3BHK in Bandra West?",
        retrieved_contexts=[
            "Bandra West 3BHK properties range from ₹2Cr to ₹5Cr depending on floor and view.",
            "Properties near Linking Road command a 15% premium over the area average.",
        ],
        response="3BHK flats in Bandra West are priced between ₹2 crore and ₹5 crore.",
        reference="3BHK properties in Bandra West are typically priced between ₹2Cr and ₹5Cr.",
    ),
    SingleTurnSample(
        user_input="Is Powai a RERA-registered project?",
        retrieved_contexts=[
            "Hiranandani Gardens, Powai was completed in 2004 before RERA was enacted.",
        ],
        response="Yes, Powai is RERA registered.",  # hallucination — context doesn't say this
        reference="RERA registration status for Hiranandani Gardens Powai is not confirmed in the retrieved context.",
    ),
]
dataset = EvaluationDataset(samples=samples)`,K=`from ragas import evaluate
from ragas.metrics import (
    LLMContextPrecisionWithoutReference,
    LLMContextRecall,
    Faithfulness,
    AnswerRelevancy,
    AnswerCorrectness,
)
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

evaluator_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
embeddings    = OpenAIEmbeddings(model="text-embedding-3-small")

result = evaluate(
    dataset   = dataset,
    metrics   = [
        LLMContextPrecisionWithoutReference(),
        LLMContextRecall(),
        Faithfulness(),
        AnswerRelevancy(),
        AnswerCorrectness(),
    ],
    llm        = evaluator_llm,
    embeddings = embeddings,
)

print(result)
# {'context_precision': 0.83, 'context_recall': 0.71, 'faithfulness': 0.45,
#  'answer_relevancy': 0.91, 'answer_correctness': 0.67}

# Convert to pandas for analysis:
df = result.to_pandas()
df.to_csv("ragas_results.csv", index=False)
# Each row = one sample; each column = one metric score + raw LLM judgements`,$=`# RAGAS Faithfulness — how it works step by step

# Input: question, retrieved_contexts, response (answer)
question  = "Does Bandra West have sea-facing options?"
contexts  = ["Bandra West has several premium high-rises with sea views including Carter Road."]
response  = "Yes, there are sea-facing apartments in Bandra West, particularly on Carter Road. They also offer garden views."

# Step 1: LLM extracts atomic claims from the response
# claims = [
#   "There are sea-facing apartments in Bandra West.",        ← supported by context
#   "Sea-facing apartments are particularly on Carter Road.", ← supported by context
#   "They also offer garden views.",                          ← NOT in context (hallucination)
# ]

# Step 2: For each claim, LLM checks: "Can this claim be inferred from the context?"
# supported = [True, True, False]

# Step 3: score = supported / total = 2/3 = 0.67

# Faithfulness = 0.67 means 1 out of 3 claims was hallucinated.
# A production RAG system should target faithfulness > 0.90.
# If you see < 0.80: the LLM is adding information not in the retrieved chunks.
# Fix: add "Answer ONLY based on the provided context. If unsure, say so." to the system prompt.`,U=`# Context Precision — measures retrieval signal-to-noise

# Input: question, retrieved_contexts (ordered list)
# No ground_truth needed for LLMContextPrecisionWithoutReference

question = "What is the average EMI for a 2Cr property at 8.5%?"
contexts = [
    "For a ₹2Cr loan at 8.5% over 20 years, the monthly EMI is ₹17,356.",  # relevant
    "Bandra West is a premium neighbourhood in Mumbai.",                       # irrelevant
    "8.5% is the current SBI home loan interest rate for April 2025.",        # relevant
    "Mumbai receives heavy monsoon rainfall from June to September.",          # irrelevant
]

# For each chunk at position k, LLM judges: "Is chunk k relevant to the question?"
# relevance = [True, False, True, False]
# precision@k:
#   k=1: 1/1 = 1.0  (first chunk relevant)
#   k=2: 1/2 = 0.5  (first relevant, second not)
#   k=3: 2/3 = 0.67 (two relevant so far)
#   k=4: 2/4 = 0.5  (still two relevant)
# AP = average precision over relevant positions = (1.0 + 0.67) / 2 = 0.83

# High context_precision: your retriever returns focused, relevant chunks.
# Low context_precision: retriever returns too many off-topic chunks; LLM drowns in noise.
# Fix: increase score_threshold, reduce k, or switch to MMR retrieval.`,V=`# Answer Relevancy — reference-free: no ground_truth needed

# Clever trick: instead of comparing to a reference answer,
# ask the LLM to reverse-engineer questions from the answer,
# then measure cosine similarity between original and generated questions.

question = "What is the 2BHK price in Bandra West?"
answer   = "2BHK flats in Bandra West are priced between ₹1.5Cr and ₹3Cr."

# Step 1: LLM generates N reverse questions from the answer (default N=3):
# rev_q_1 = "What is the price range for 2BHK in Bandra West?"
# rev_q_2 = "How much does a 2BHK in Bandra West cost?"
# rev_q_3 = "What is the price of a 2-bedroom flat in Bandra West?"

# Step 2: cosine_similarity(embed(question), embed(rev_q_i)) for each i
# → [0.97, 0.96, 0.93]  (all high — answer addresses the question)

# Step 3: answer_relevancy = mean(similarities) = 0.953

# Low answer_relevancy reveals:
# - Answer talks about a different topic ("This is a beautiful area..." instead of price)
# - Answer is too vague ("Prices vary by location")
# - Answer refuses to answer ("I don't have this data")
# Fix: tighten the system prompt; ensure the retrieved context is rich enough.`,Q=`# Most valuable dataset source: production traffic
# Build from LangSmith traces — real questions, real retrieved contexts, real answers

from langsmith import Client
from ragas import EvaluationDataset, SingleTurnSample

client   = Client()
samples  = []

# Fetch recent production runs (each run = one user query through the full pipeline)
runs = list(client.list_runs(
    project_name  = "housing-agent-prod",
    execution_order = 1,
    limit         = 200,
    filter        = 'eq(status, "success")',
))

for run in runs:
    inp = run.inputs.get("messages", [])
    out = run.outputs.get("messages", [])
    if not inp or not out:
        continue

    question   = inp[-1].get("content", "") if isinstance(inp[-1], dict) else str(inp[-1])
    answer     = out[-1].get("content", "") if isinstance(out[-1], dict) else str(out[-1])
    # Extract retrieved chunks from the tool results in the run's child spans:
    child_runs = list(client.list_runs(run_id=run.id))
    contexts   = [r.outputs.get("output", "") for r in child_runs if r.name == "retrieve_docs_node"]

    if question and answer and contexts:
        samples.append(SingleTurnSample(
            user_input         = question,
            retrieved_contexts = contexts,
            response           = answer,
            # reference left empty — use reference-free metrics only
        ))

dataset = EvaluationDataset(samples=samples[:50])  # start with 50 for cost control`,X=`# Synthetic dataset generation — when you have documents but no user queries yet
# RAGAS can generate Q&A pairs from your corpus using an LLM

from ragas.testset import TestsetGenerator
from ragas.testset.evolutions import simple, reasoning, multi_context
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader

# Load your documents
loader = DirectoryLoader("rera_filings/", glob="*.pdf")
docs   = loader.load()

generator = TestsetGenerator.from_langchain(
    generator_llm  = ChatOpenAI(model="gpt-4o-mini"),
    critic_llm     = ChatOpenAI(model="gpt-4o"),
    embeddings     = OpenAIEmbeddings(),
)

# Generate 50 test samples with a mix of difficulty levels:
testset = generator.generate_with_langchain_docs(
    docs,
    test_size         = 50,
    distributions     = {
        simple:        0.5,   # direct factual questions
        reasoning:     0.3,   # multi-hop reasoning required
        multi_context: 0.2,   # answer spans multiple documents
    },
    with_debugging_logs = True,
)

df = testset.to_pandas()
df.to_csv("rera_eval_dataset.csv", index=False)
# Save to LangSmith for reuse:
from langsmith import Client
Client().upload_dataframe(df, name="rera-golden-set-v1", input_keys=["question"], output_keys=["answer"])`,J=`import pandas as pd
from ragas import evaluate
from ragas.metrics import Faithfulness, LLMContextRecall, LLMContextPrecisionWithoutReference
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

documents  = load_rera_documents()      # your corpus
questions  = load_eval_questions()      # 50-question golden set
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

results = []
for chunk_size in [200, 500, 1000, 2000]:
    for overlap in [0, int(chunk_size * 0.1), int(chunk_size * 0.2)]:
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
        chunks   = splitter.split_documents(documents)

        vs        = FAISS.from_documents(chunks, embeddings)
        retriever = vs.as_retriever(search_kwargs={"k": 5})

        samples = []
        for q in questions:
            docs   = retriever.invoke(q["question"])
            answer = rag_chain.invoke({"question": q["question"], "context": docs})
            samples.append(SingleTurnSample(
                user_input         = q["question"],
                retrieved_contexts = [d.page_content for d in docs],
                response           = answer,
                reference          = q["ground_truth"],
            ))

        scores = evaluate(EvaluationDataset(samples), metrics=[
            Faithfulness(), LLMContextRecall(), LLMContextPrecisionWithoutReference()
        ], llm=evaluator_llm, embeddings=embeddings)

        results.append({
            "chunk_size":       chunk_size,
            "overlap":          overlap,
            "chunks_total":     len(chunks),
            "faithfulness":     scores["faithfulness"],
            "context_recall":   scores["context_recall"],
            "context_precision": scores["context_precision"],
        })
        print(f"chunk={chunk_size} overlap={overlap}: F={scores['faithfulness']:.2f} "
              f"R={scores['context_recall']:.2f} P={scores['context_precision']:.2f}")

df = pd.DataFrame(results).sort_values("faithfulness", ascending=False)
print(df.to_string())

# Typical findings:
# Small chunks (200):  high precision, low recall (misses multi-sentence answers)
# Large chunks (2000): high recall, low precision (too much noise per chunk)
# Sweet spot: 500-1000 chars with 10-20% overlap for most corpora`,Z=`# Sweep retrieval k and strategy (similarity vs MMR) simultaneously
import itertools

strategies = [
    ("similarity", {"k": 3}),
    ("similarity", {"k": 5}),
    ("similarity", {"k": 10}),
    ("mmr",        {"k": 5,  "fetch_k": 20, "lambda_mult": 0.5}),
    ("mmr",        {"k": 10, "fetch_k": 40, "lambda_mult": 0.7}),
]

for search_type, kwargs in strategies:
    retriever = vectorstore.as_retriever(search_type=search_type, search_kwargs=kwargs)
    # ... build samples and evaluate same as above ...
    print(f"{search_type} k={kwargs['k']}: precision={p:.2f} recall={r:.2f}")

# Why MMR can beat similarity:
# MMR re-ranks to maximise diversity — avoids returning 5 nearly-identical chunks.
# For multi-hop questions (e.g. "compare prices in Bandra West and Powai"),
# MMR retrieves chunks from both locations; pure similarity returns 5 Bandra chunks.`,ee=`# ci_eval.py — run in GitHub Actions on every PR that touches RAG components

import sys
import json
from ragas import evaluate, EvaluationDataset, SingleTurnSample
from ragas.metrics import Faithfulness, LLMContextRecall, LLMContextPrecisionWithoutReference

# Thresholds — adjust based on your baseline
THRESHOLDS = {
    "faithfulness":     0.85,   # < 0.85 → hallucination regression
    "context_recall":  0.75,   # < 0.75 → retriever missing key info
    "context_precision": 0.70, # < 0.70 → retriever returning too much noise
}

def load_golden_set() -> EvaluationDataset:
    with open("eval/golden_set.json") as f:
        data = json.load(f)
    return EvaluationDataset([
        SingleTurnSample(**s) for s in data["samples"]
    ])

def run_rag_pipeline(question: str) -> tuple[str, list[str]]:
    """Run the actual RAG pipeline under test."""
    from src.pipeline.graph import build_graph
    from langchain_core.messages import HumanMessage
    app    = build_graph()
    state  = app.invoke({"messages": [HumanMessage(question)]})
    answer = state["messages"][-1].content
    # extract retrieved docs from state — add retrieved_docs field to AgentState
    return answer, state.get("retrieved_docs", [])

if __name__ == "__main__":
    dataset = load_golden_set()
    samples = []
    for s in dataset.samples:
        answer, contexts = run_rag_pipeline(s.user_input)
        samples.append(SingleTurnSample(
            user_input         = s.user_input,
            retrieved_contexts = contexts,
            response           = answer,
            reference          = s.reference,
        ))

    scores = evaluate(
        EvaluationDataset(samples),
        metrics=[Faithfulness(), LLMContextRecall(), LLMContextPrecisionWithoutReference()],
        llm=evaluator_llm, embeddings=embeddings,
    )

    failed = []
    for metric, threshold in THRESHOLDS.items():
        score = scores.get(metric, 0)
        status = "PASS" if score >= threshold else "FAIL"
        print(f"  {status}  {metric}: {score:.3f} (threshold: {threshold})")
        if score < threshold:
            failed.append(f"{metric}={score:.3f} < {threshold}")

    if failed:
        print(f"\\n✗ Evaluation failed: {', '.join(failed)}")
        sys.exit(1)  # non-zero exit → PR blocked
    else:
        print("\\n✓ All evaluation thresholds passed")
        sys.exit(0)`,te=`# .github/workflows/eval.yml
name: RAG Evaluation

on:
  pull_request:
    paths:
      - 'src/pipeline/**'
      - 'prompts/**'
      - 'src/session/**'

jobs:
  ragas-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install ragas langchain-openai langchain-anthropic
      - run: python ci_eval.py
        env:
          OPENAI_API_KEY:     \${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY:  \${{ secrets.ANTHROPIC_API_KEY }}
          LANGCHAIN_API_KEY:  \${{ secrets.LANGCHAIN_API_KEY }}

# Cost note: 50-sample eval with gpt-4o-mini as judge ≈ $0.15 per run.
# Run on PRs to RAG components only (paths: filter) — not every commit.`,se=`# Async sampling — evaluate a fraction of production traffic continuously
# Don't evaluate every request (cost); sample 1-5% and run RAGAS async.

import asyncio
import random
from ragas.metrics import Faithfulness, AnswerRelevancy

EVAL_SAMPLE_RATE = 0.02   # evaluate 2% of production requests

async def handle_chat(request):
    answer, contexts = await run_rag_pipeline(request.message)
    yield_response(answer)  # return immediately to user

    # Async evaluation — fire and forget, does NOT block the response
    if random.random() < EVAL_SAMPLE_RATE:
        asyncio.create_task(
            run_async_eval(request.message, answer, contexts, request.session_id)
        )

async def run_async_eval(question, answer, contexts, session_id):
    try:
        sample  = SingleTurnSample(user_input=question, retrieved_contexts=contexts, response=answer)
        dataset = EvaluationDataset([sample])
        scores  = evaluate(dataset, metrics=[Faithfulness(), AnswerRelevancy()],
                           llm=evaluator_llm, embeddings=embeddings)
        # Ship to your metrics store:
        await metrics.record("ragas.faithfulness",     scores["faithfulness"],     tags={"session": session_id})
        await metrics.record("ragas.answer_relevancy", scores["answer_relevancy"], tags={"session": session_id})
    except Exception as e:
        log.warning("ragas_eval_failed", error=str(e))  # never fail the user request`,re=`# Score drift detection — alert when RAGAS scores degrade over time

from collections import deque
import statistics

class RagasScoreTracker:
    def __init__(self, window=200, alert_threshold=0.05):
        self.window    = deque(maxlen=window)
        self.threshold = alert_threshold
        self.baseline  = None

    def record(self, scores: dict):
        self.window.append(scores)
        if len(self.window) == self.window.maxlen and self.baseline is None:
            # Set baseline from first full window
            self.baseline = {k: statistics.mean(s[k] for s in self.window) for k in scores}

    def check_drift(self) -> list[str]:
        if self.baseline is None or len(self.window) < 50:
            return []

        recent = {k: statistics.mean(s[k] for s in list(self.window)[-50:])
                  for k in self.baseline}
        alerts = []
        for metric, baseline_val in self.baseline.items():
            drop = baseline_val - recent.get(metric, baseline_val)
            if drop > self.threshold:
                alerts.append(f"{metric} dropped by {drop:.3f} (baseline {baseline_val:.2f} → now {recent[metric]:.2f})")
        return alerts

tracker = RagasScoreTracker(window=200, alert_threshold=0.05)
# In your async eval callback:
# tracker.record(scores)
# if alerts := tracker.check_drift():
#     pagerduty.alert(f"RAGAS degradation: {alerts}")`,ne=`# RAGAS judge model choice matters for cost AND score validity

# Option 1: OpenAI gpt-4o-mini (recommended default)
from langchain_openai import ChatOpenAI
evaluator_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
# Cost: ~$0.15 per 50-sample eval | Quality: good for most cases

# Option 2: Anthropic Claude Haiku (faster, cheaper)
from langchain_anthropic import ChatAnthropic
evaluator_llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)
# Cost: ~$0.08 per 50-sample eval | Note: validate vs gpt-4o-mini scores first

# Option 3: Local model via Ollama (zero cost, slower)
from langchain_ollama import ChatOllama
evaluator_llm = ChatOllama(model="llama3.1:8b", temperature=0)
# Cost: $0 | Quality: noticeably lower; use for rapid iteration only

# Cost estimation formula:
# cost = n_samples × avg_tokens_per_metric × n_metrics × price_per_1k_tokens
# 50 samples × 800 tokens × 4 metrics × $0.00015/1k = $0.024
# Always run a 5-sample smoke test first to calibrate:
# evaluate(EvaluationDataset(samples[:5]), metrics=[Faithfulness()], ...)`;function ce(){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"learning-obj",children:[e.jsx("div",{className:"learning-obj-title",children:"After this module you will be able to"}),e.jsxs("ol",{children:[e.jsx("li",{children:"Explain what each RAGAS metric measures and which failure mode it catches"}),e.jsx("li",{children:"Build evaluation datasets from production traces and synthetic generation"}),e.jsx("li",{children:"Run RAGAS and interpret per-sample scores to pinpoint retriever vs generator failures"}),e.jsx("li",{children:"Use RAGAS to run chunk size, overlap, k, and retrieval strategy sweeps"}),e.jsx("li",{children:"Integrate RAGAS into CI/CD to block regressions before they hit production"}),e.jsx("li",{children:"Run async sampling-based evaluation on live traffic without blocking responses"}),e.jsx("li",{children:"Detect score drift and configure metric-based alerting"})]}),e.jsxs("div",{className:"obj-meta",children:[e.jsx("span",{className:"obj-time",children:"⏱ ~90 minutes"}),e.jsx("span",{className:"obj-diff",children:"Difficulty: ★★★☆☆"}),e.jsx("span",{className:"obj-diff",children:"Prerequisites: Module 29 (RAG Architectures), Module 30 (RAG Optimisation)"})]})]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Why evaluation is the hardest part of RAG"}),"A RAG pipeline has two independent quality axes: ",e.jsx("strong",{children:"retriever quality"})," (are the right chunks fetched?) and ",e.jsx("strong",{children:"generator quality"})," (does the LLM use those chunks faithfully?). They fail independently. A great retriever paired with a hallucinating LLM produces confident wrong answers. A faithful LLM paired with a poor retriever produces accurate summaries of the wrong information. Unit tests don't catch either. RAGAS gives you a metric per axis."]}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Housing.com Upgrade Context"}),e.jsx("br",{}),`Housing.com's current system has no automated measurement of retrieval quality — teams rely on manual spot-checks and thumbs-up/thumbs-down signals. Adding RAGAS gives you per-sprint faithfulness and context precision scores, making the property data pipeline's quality visible and improvable. This directly closes the "we don't know if the LLM is making things up" risk identified in production.`]}),e.jsx(D,{}),e.jsx("h2",{children:"44.1 What is RAGAS?"}),e.jsxs("p",{children:[e.jsx("strong",{children:"RAGAS"}),' (Retrieval-Augmented Generation Assessment) is an open-source evaluation framework for RAG pipelines. It was introduced in the 2023 paper "RAGAS: Automated Evaluation of Retrieval Augmented Generation" (Es et al., arXiv:2309.15217).']}),e.jsxs("p",{children:["The key insight: most RAG evaluation metrics are ",e.jsx("strong",{children:"reference-free"})," for the hardest-to-collect labels. Faithfulness and Answer Relevancy require no ground-truth answers — only the question, retrieved context, and generated answer. This means you can evaluate production traffic without any human labelling."]}),e.jsx("h3",{children:"44.1.1 The 5 Core Metrics at a Glance"}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Metric"}),e.jsx("th",{children:"Measures"}),e.jsx("th",{children:"Catches"}),e.jsx("th",{children:"Needs ground_truth?"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Context Precision"})}),e.jsx("td",{children:"Fraction of retrieved chunks that are relevant"}),e.jsx("td",{children:"Retriever noise / junk chunks"}),e.jsx("td",{children:"No (LLM judge)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Context Recall"})}),e.jsx("td",{children:"Fraction of ground truth claims covered by retrieved chunks"}),e.jsx("td",{children:"Retriever missing key info"}),e.jsx("td",{children:"Yes"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Faithfulness"})}),e.jsx("td",{children:"Fraction of answer claims supported by retrieved context"}),e.jsx("td",{children:"LLM hallucination"}),e.jsx("td",{children:"No"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Answer Relevancy"})}),e.jsx("td",{children:"Does the answer address the question?"}),e.jsx("td",{children:"Off-topic or vague answers"}),e.jsx("td",{children:"No"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("strong",{children:"Answer Correctness"})}),e.jsx("td",{children:"Factual correctness of the answer"}),e.jsx("td",{children:"Wrong facts"}),e.jsx("td",{children:"Yes"})]})]})}),e.jsxs("p",{children:["Start with ",e.jsx("strong",{children:"Faithfulness + Context Precision + Context Recall"})," — the three-metric minimum that covers both retriever and generator axes without requiring ground truth for two of the three."]}),e.jsx("h3",{children:"44.1.2 Installation"}),e.jsx(o,{title:"RAGAS Installation",language:"bash",keyLine:1,keyNote:"Any LangChain-compatible LLM works as judge",children:H}),e.jsx("h2",{children:"44.2 Running Your First Evaluation"}),e.jsx("h3",{children:"44.2.1 Build an EvaluationDataset"}),e.jsx(o,{title:"EvaluationDataset with SingleTurnSample",language:"python",keyLine:9,keyNote:"Each sample requires question, contexts, response, reference",children:Y}),e.jsx("h3",{children:"44.2.2 Run evaluate()"}),e.jsx(o,{title:"Running RAGAS evaluate()",language:"python",keyLine:7,keyNote:"temperature=0 ensures reproducible judge scores",children:K}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:`Interpreting scores — what's "good"?`}),e.jsx("table",{style:{fontSize:"12px",margin:"4px 0"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Score"}),e.jsx("th",{children:"Faithfulness"}),e.jsx("th",{children:"Context Precision"}),e.jsx("th",{children:"Context Recall"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"> 0.90"}),e.jsx("td",{children:"Production-ready"}),e.jsx("td",{children:"Excellent signal-to-noise"}),e.jsx("td",{children:"Nearly complete coverage"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"0.75–0.90"}),e.jsx("td",{children:"Acceptable; monitor"}),e.jsx("td",{children:"Some junk chunks — reduce k"}),e.jsx("td",{children:"Missing some ground truth"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"0.60–0.75"}),e.jsx("td",{children:"Hallucination problem"}),e.jsx("td",{children:"Noisy retriever — tune chunking"}),e.jsx("td",{children:"Chunk size too small"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"< 0.60"}),e.jsx("td",{children:"Do not ship"}),e.jsx("td",{children:"Retriever broken or misconfigured"}),e.jsx("td",{children:"Corpus incomplete"})]})]})}),"These thresholds are ",e.jsx("em",{children:"starting points"}),". Your domain establishes the baseline — set thresholds from your first clean evaluation, then alert on drops of > 0.05 from that baseline."]}),e.jsx("h2",{children:"44.3 How Each Metric Works Internally"}),e.jsx("p",{children:"Every RAGAS metric uses an LLM internally. Understanding the prompting logic helps you debug unexpected scores and choose the right judge model."}),e.jsx(B,{}),e.jsx("h3",{children:"44.3.1 Faithfulness — Claim Extraction + NLI"}),e.jsx(o,{title:"Faithfulness Score: Claim Extraction Walkthrough",language:"python",keyLine:18,keyNote:"score = supported / total — every unsupported claim penalises",children:$}),e.jsx(z,{}),e.jsx("h3",{children:"44.3.2 Context Precision — Average Precision@k"}),e.jsx(o,{title:"Context Precision: Average Precision@k Walkthrough",language:"python",keyLine:16,keyNote:"AP averages precision only at positions of relevant chunks",children:U}),e.jsx("h3",{children:"44.3.3 Answer Relevancy — Reverse-Question Similarity"}),e.jsx(o,{title:"Answer Relevancy: Reverse-Question Cosine Similarity",language:"python",keyLine:11,keyNote:"LLM reverse-engineers questions — no reference answer needed",children:V}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Why Answer Relevancy is reference-free (the clever part)"}),'Most NLP evaluation metrics require a reference answer to compare against. RAGAS Answer Relevancy sidesteps this by inverting the question: instead of "is this answer correct?", it asks "what question would this answer be a good response to?" — and checks how close that reverse-question is to the original. This means you can compute it on any production response without ever having a human write a reference answer.']}),e.jsx("h2",{children:"44.4 Building Evaluation Datasets"}),e.jsx("h3",{children:"44.4.1 From Production Traces (highest value)"}),e.jsx("p",{children:"Real user queries are the most representative test cases. Pull them from LangSmith production traces:"}),e.jsx(o,{title:"Building Eval Dataset from LangSmith Production Traces",language:"python",keyLine:14,keyNote:"execution_order=1 fetches only top-level runs, not child spans",children:Q}),e.jsx("h3",{children:"44.4.2 Synthetic Generation (when you have docs but no queries)"}),e.jsxs("p",{children:["RAGAS's ",e.jsx("code",{children:"TestsetGenerator"})," uses an LLM to synthesise Q&A pairs from your corpus — useful for day-0 evaluation before you have production traffic:"]}),e.jsx(o,{title:"Synthetic Dataset Generation with TestsetGenerator",language:"python",keyLine:14,keyNote:"distributions mix factual, reasoning, multi-context difficulty levels",children:X}),e.jsxs("div",{className:"callout callout-tip",children:[e.jsx("strong",{children:"Golden set evolution strategy"}),"Start with 20 synthetic samples (fast, $0.50 cost). After 2 weeks of production, pull 50 real queries and hand-label 20 as golden examples (correct answer written by a domain expert). Your eval dataset should grow to ~100 samples with a mix of: (a) synthetic for breadth, (b) production failures you fixed (regression prevention), (c) edge cases users actually hit. Aim to update it monthly. Store in LangSmith datasets for version control."]}),e.jsx("h2",{children:"44.5 Tuning Your RAG Pipeline with RAGAS"}),e.jsx("h3",{children:"44.5.1 Chunk Size and Overlap Sweep"}),e.jsx("p",{children:"The most impactful single parameter in a RAG pipeline. Run a systematic sweep before committing to a chunk size:"}),e.jsx(o,{title:"Chunk Size and Overlap Sweep",language:"python",keyLine:5,keyNote:"Sweep chunk_size x overlap to find faithfulness/recall crossover",children:J}),e.jsx("h3",{children:"44.5.2 Retrieval Strategy Sweep (k and MMR)"}),e.jsx(o,{title:"Retrieval Strategy Sweep: k and MMR",language:"python",keyLine:4,keyNote:"MMR lambda_mult controls diversity vs relevance tradeoff",children:Z}),e.jsxs("div",{className:"callout callout-info",children:[e.jsx("strong",{children:"Typical sweep findings — what the numbers actually tell you"}),e.jsxs("ul",{style:{fontSize:"12px",margin:"4px 0"},children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Faithfulness goes up with smaller chunks"})," — smaller chunks mean less irrelevant text in the context window; the LLM makes fewer unsupported claims"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Context Recall goes down with smaller chunks"})," — small chunks split sentences that need to be together; multi-sentence answers require multiple chunks retrieved"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"The faithfulness/recall crossover"})," — the optimal chunk size is where this tradeoff meets your requirements: high-stakes (mortgage advice → maximise faithfulness), broad discovery (area guide → maximise recall)"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"MMR beats similarity for multi-topic questions"}),' — "compare Bandra and Powai prices" needs chunks from both; similarity returns 5 Bandra chunks; MMR diversifies']})]})]}),e.jsx("h2",{children:"44.6 CI/CD Integration — Block Regressions Before They Ship"}),e.jsx("h3",{children:"44.6.1 Python evaluation script"}),e.jsx(o,{title:"CI Evaluation Script — PR Threshold Gate",language:"python",keyLine:36,keyNote:"sys.exit(1) on threshold failure blocks the PR merge",children:ee}),e.jsx("h3",{children:"44.6.2 GitHub Actions workflow"}),e.jsx(o,{title:"GitHub Actions — RAGAS Eval on PR",language:"yaml",keyLine:8,keyNote:"paths: filter runs eval only on RAG/prompt changes, not every commit",children:te}),e.jsx("h2",{children:"44.7 Production: Async Sampling Evaluation"}),e.jsx("p",{children:"You cannot run RAGAS on every production request — each evaluation call costs ~3–5 LLM calls per metric. Sample 1–5% of traffic and evaluate asynchronously:"}),e.jsx(o,{title:"Async Production RAGAS Sampling",language:"python",keyLine:9,keyNote:"asyncio.create_task fires eval without blocking user response",children:se}),e.jsx("h3",{children:"44.7.1 Score Drift Detection"}),e.jsx(o,{title:"RAGAS Score Drift Tracker",language:"python",keyLine:8,keyNote:"Baseline set from first full window; drop > threshold triggers alert",children:re}),e.jsx("h2",{children:"44.8 Model Choice and Cost"}),e.jsx(o,{title:"RAGAS Judge Model Options and Cost",language:"python",keyLine:12,keyNote:"Switching judge models mid-project shifts scores by 0.05–0.15",children:ne}),e.jsx("table",{children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("th",{children:"Judge Model"}),e.jsx("th",{children:"Cost/50 samples"}),e.jsx("th",{children:"Latency"}),e.jsx("th",{children:"Score quality"}),e.jsx("th",{children:"Use when"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"gpt-4o-mini"}),e.jsx("td",{children:"~$0.15"}),e.jsx("td",{children:"~30s"}),e.jsx("td",{children:"High"}),e.jsx("td",{children:"CI/CD, production monitoring"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"claude-haiku-4-5"}),e.jsx("td",{children:"~$0.08"}),e.jsx("td",{children:"~20s"}),e.jsx("td",{children:"High"}),e.jsx("td",{children:"Faster CI runs; validate scores match gpt-4o-mini first"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"gpt-4o"}),e.jsx("td",{children:"~$1.50"}),e.jsx("td",{children:"~60s"}),e.jsx("td",{children:"Very high"}),e.jsx("td",{children:"High-stakes final validation; building ground truth labels"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"llama3.1:8b (local)"}),e.jsx("td",{children:"$0"}),e.jsx("td",{children:"~120s"}),e.jsx("td",{children:"Medium"}),e.jsx("td",{children:"Local dev iteration, never production gates"})]})]})}),e.jsxs("div",{className:"callout callout-warn",children:[e.jsx("strong",{children:"The judge-model calibration gotcha"}),"RAGAS scores are not absolute — they depend on the judge model's interpretation. Switching judge models mid-project can shift scores by 0.05–0.15 without any real change in your pipeline. Always use the same judge model for all runs in a comparison. When you do switch judge models (e.g. to save cost), re-baseline by running the new model on your last 3 historical eval sets and verifying the rank order of runs is preserved."]}),e.jsxs("div",{className:"callout callout-maang",children:[e.jsx("strong",{children:"🎯 MAANG Interview Connection"}),'"How do you know your RAG pipeline is working?" → RAGAS gives you a per-axis answer: Faithfulness catches LLM hallucination (generator axis), Context Precision/Recall catches retriever failures (retrieval axis). Production strategy: async sampling at 2–5% of traffic → metrics to monitoring → alert on >0.05 drop from baseline. CI/CD strategy: 50-sample golden set → threshold gates on PR → blocks regressions before they reach users. The complete answer names both axes, production and CI/CD integration, and the cost tradeoff for judge model selection.']}),e.jsx(P,{moduleId:33,title:"Module 33: RAGAS — The RAG Evaluation Framework",contentHint:"Context Precision signal-to-noise retrieval AP@k, Context Recall coverage needs ground truth, Faithfulness hallucination claim extraction NLI LLM judge, Answer Relevancy reference-free reverse question cosine similarity, Answer Correctness needs ground truth, EvaluationDataset SingleTurnSample structure, production trace dataset from LangSmith, synthetic TestsetGenerator, chunk size sweep faithfulness vs recall tradeoff, MMR diversity for multi-topic, CI/CD threshold gates sys.exit non-zero, async sampling 2-5 percent fire and forget, score drift window baseline alert 0.05, judge model calibration consistency"})]})}export{ce as Mod44};
