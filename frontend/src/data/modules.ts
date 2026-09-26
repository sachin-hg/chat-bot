import type { ModuleDefinition, LearningPath } from '../types';

export const MODULES: ModuleDefinition[] = [
  // ── Act 0: Foundations ──────────────────────────────────────────────────────
  { id: 1,  badge: '1',  title: 'ML Foundations Primer',                   subtitle: 'Classification, training vs inference, metrics — zero math, JS analogies',                                                                   track: 'ai',   act: 0 },
  { id: 2,  badge: '2',  title: 'How Language Models Work',                subtitle: 'Tokens, temperature, hallucination, RAG — LLMs from first principles',                                                                       track: 'ai',   act: 0 },
  { id: 23, badge: '3',  title: 'LLM Internals',                           subtitle: "Transformers, attention, KV cache, tokenisation — what's happening inside",                                                                  track: 'ai',   act: 0 },
  { id: 49, badge: '4',  title: 'Python for AI Engineering',               subtitle: 'Python/TypeScript side-by-side, async patterns, reading this codebase',                                                                     track: 'fe',   act: 0 },
  { id: 50, badge: 'REF', title: 'Algorithm & Resource Reference',         subtitle: 'Classical ML, backprop, CNNs, Transformers, LoRA, QLoRA, and curated learning resources',                                                      track: 'ai',   act: 0 },

  // ── Act 1: The Design Framework ─────────────────────────────────────────────
  { id: 3,  badge: '5',  title: 'Philosophy of AI Agents',                 subtitle: 'Mental models before code — the three-question test, the Housing.com choice',                                                                track: 'core', act: 1 },
  { id: 4,  badge: '6',  title: 'High-Level Design',                       subtitle: 'Architecture decisions that determine everything else',                                                                                       track: 'core', act: 1 },

  // ── Act 2: Building the System ──────────────────────────────────────────────
  { id: 5,  badge: '7',  title: 'Implementation Roadmap',                  subtitle: 'The correct build order — 7 phases, 8 weeks, acceptance criteria per phase',                                                                 track: 'core', act: 2 },
  { id: 6,  badge: '8',  title: 'State Management',                        subtitle: 'Pipeline state, Redis sessions, optimistic locking, PII compliance',                                                                         track: 'core', act: 2 },
  { id: 7,  badge: '9',  title: 'The Tool System',                         subtitle: 'Pre-fetch vs residual tools, caching, adapters',                                                                                             track: 'core', act: 2 },
  { id: 8,  badge: '10', title: 'Pipeline Architecture',                   subtitle: 'Classification → enrichment → retrieval → response → validation — why each stage exists',                                                    track: 'core', act: 2 },
  { id: 9,  badge: '11', title: 'Composability',                           subtitle: 'Reuse across domains, Node.js/.NET, Google Drive + RAG case study',                                                                          track: 'core', act: 2 },
  { id: 10, badge: '12', title: 'Frontend & Streaming Integration',        subtitle: 'Client-side SSE streaming, React patterns, Python↔JS bridge',                                                                                track: 'fe',   act: 2 },
  { id: 11, badge: '★',  title: 'Act 2 Capstone — Build the Full Pipeline', subtitle: 'Build the 7-node pipeline from scratch: classifier, tools, SSE, unit tests, RAGAS gate',                                                   track: 'core', act: 2 },

  // ── Act 3: Production-Ready ─────────────────────────────────────────────────
  { id: 12, badge: '14', title: 'Testing & Quality',                       subtitle: 'Three-layer test strategy, prompt engineering, CI/CD wiring',                                                                                track: 'core', act: 3 },
  { id: 13, badge: '15', title: 'Observability',                           subtitle: 'Structured logging, LangSmith tracing, the playground',                                                                                     track: 'core', act: 3 },
  { id: 14, badge: '16', title: 'Evaluation Engineering',                  subtitle: 'LLM-as-judge, RAGAS, the eval flywheel, online signals, cold start strategy',                                                                track: 'ai',   act: 3 },
  { id: 15, badge: '★',  title: 'Act 3 Mini-Project — RAGAS Evaluation Sweep', subtitle: 'Evaluate your pipeline with RAGAS, sweep chunk sizes, write a findings report',                                                         track: 'ai',   act: 3 },
  { id: 16, badge: '18', title: 'Security & Auth',                         subtitle: 'JWT, RBAC, secrets rotation, adversarial safety',                                                                                            track: 'core', act: 3 },
  { id: 17, badge: '19', title: 'A/B Experiments',                         subtitle: 'Deterministic assignment, guardrails, statistical validity',                                                                                 track: 'core', act: 3 },
  { id: 18, badge: '20', title: 'Production Readiness',                    subtitle: 'Concurrency, degradation, deployment strategy',                                                                                              track: 'core', act: 3 },
  { id: 19, badge: '21', title: 'Enterprise Patterns',                     subtitle: 'Multi-tenancy, cost attribution, PII/compliance, Azure OpenAI swap',                                                                         track: 'ent',  act: 3 },
  { id: 20, badge: '22', title: 'Scale & Capacity Planning',               subtitle: 'Redis, Kafka, LLM rate limits — with real numbers at 1M DAU',                                                                                track: 'ent',  act: 3 },
  { id: 21, badge: '23', title: 'The Gotchas',                             subtitle: '8 production bugs that burned us — learn them cheaply',                                                                                      track: 'core', act: 3 },
  { id: 22, badge: '24', title: 'Mental Models & System Design',           subtitle: 'Main arc capstone — the 7 principles that unify everything you built in Acts 1–3',                                                           track: 'core', act: 3 },

  // ── Act 4: The AI Engineering Toolkit ───────────────────────────────────────
  { id: 24, badge: '25', title: 'LangChain Ecosystem',                     subtitle: 'LCEL, text splitters, hybrid retrievers, output parsers, callbacks',                                                                         track: 'ai',   act: 4, cluster: 'LLM Internals & Frameworks' },
  { id: 25, badge: '26', title: 'LangGraph — Concepts & Architecture',     subtitle: 'Conceptual overview — what StateGraph is, how it maps to graph.py, when to use cycles vs chains',                                            track: 'ai',   act: 4, cluster: 'LLM Internals & Frameworks' },
  { id: 26, badge: '27', title: 'LangGraph — Code Constructs & Patterns',  subtitle: 'Code-first depth — @tool decorator, ToolNode dispatch, SqliteSaver, interrupt_before patterns',                                              track: 'ai',   act: 4, cluster: 'LLM Internals & Frameworks' },
  { id: 27, badge: '28', title: 'LangSmith Platform',                      subtitle: 'Traces, datasets, experiments, online monitoring, annotation queues',                                                                        track: 'ai',   act: 4, cluster: 'LLM Internals & Frameworks' },
  { id: 28, badge: '29', title: 'Vector Databases',                        subtitle: 'ChromaDB, Pinecone, pgvector, Weaviate, Qdrant — decision framework',                                                                        track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 29, badge: '30', title: 'RAG Pipeline Architectures',              subtitle: 'Naive → Advanced → Modular → Graph → Self → Agentic RAG',                                                                                   track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 30, badge: '31', title: 'RAG Optimisation & Chunking',             subtitle: 'Fixed, semantic, document-aware, hierarchical chunking — RAGAS optimisation',                                                                track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 31, badge: '32', title: 'Advanced RAG: Agentic & Deep Techniques', subtitle: 'HyDE, multi-query, CRAG, self-RAG, adaptive routing, reranking',                                                                             track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 32, badge: '33', title: 'Knowledge Graphs & GraphRAG',             subtitle: 'Entity extraction, Leiden communities, global/local search, hybrid retrieval',                                                               track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 33, badge: '34', title: 'RAGAS — RAG Evaluation Framework',        subtitle: 'Context precision, recall, faithfulness, answer relevancy — metrics, sweeps, CI/CD, production monitoring',                                  track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 34, badge: '35', title: 'AI Evaluation Strategies',                subtitle: 'LLM-as-Judge bias, multi-judge panels, agent eval, shadow eval, annotation queues, eval flywheel',                                          track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 35, badge: '36', title: 'LlamaIndex — Data Pipelines & Patterns',  subtitle: 'Document, Node, Index, Retriever, QueryEngine — ingestion pipeline, PropertyGraphIndex, LangGraph bridge',                                  track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 36, badge: '37', title: 'Graph Knowledge Stores',                  subtitle: 'Neo4j, Microsoft GraphRAG, LlamaIndex PropertyGraphIndex, Obsidian vault RAG, hybrid vector+graph',                                         track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },
  { id: 37, badge: '38', title: 'Model Landscape & Selection',             subtitle: 'GPT-4o vs Claude vs Gemini vs Llama — 5-axis framework, TCO, context tradeoffs',                                                            track: 'ai',   act: 4, cluster: 'Models & Infrastructure' },
  { id: 38, badge: '39', title: 'Running Models',                          subtitle: 'Ollama, llama.cpp, vLLM, Groq, HuggingFace Endpoints, Core ML',                                                                             track: 'ai',   act: 4, cluster: 'Models & Infrastructure' },
  { id: 39, badge: '40', title: 'Fine-Tuning & Training',                  subtitle: 'LoRA, QLoRA, full fine-tuning, DPO, SFT — when to fine-tune vs RAG vs prompt',                                                              track: 'ai',   act: 4, cluster: 'Models & Infrastructure' },
  { id: 40, badge: '41', title: 'ML Platforms & Tooling',                  subtitle: 'HuggingFace, Groq, Together.ai, OpenRouter, Replicate, Bedrock',                                                                            track: 'ai',   act: 4, cluster: 'Models & Infrastructure' },
  { id: 41, badge: '42', title: 'Agent Architectures',                     subtitle: 'ReAct, Plan-and-Execute, Reflexion — when agents help and when they hurt',                                                                   track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 42, badge: '43', title: 'Multi-Agent Systems',                     subtitle: 'Supervisor, hierarchical, debate patterns — LangGraph multi-agent',                                                                          track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 43, badge: '44', title: 'Model Context Protocol (MCP)',            subtitle: 'Build MCP servers with FastMCP, JSON-RPC wire protocol, security',                                                                           track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 44, badge: '45', title: 'Agentic Workflows & Token Optimisation',  subtitle: 'Claude skills, GitHub Actions CI, hooks, prompt caching, context trimming',                                                                  track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 45, badge: '46', title: 'Agent Teams, A2A & Debugging',            subtitle: 'Swarm/fan-out, Google A2A protocol, LangSmith traces, LangGraph Studio',                                                                    track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 52, badge: '47', title: 'Agent Harnesses & Scaffolding',           subtitle: 'The 5-layer harness model, universal agent loop, permission gates, 8-harness ecosystem (Claude Code, Codex CLI, OpenClaw, DeepAgents, OpenHands)', track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 53, badge: '48', title: 'Deep Agents — Engineering Agent Teams',   subtitle: 'PM → EM → BE/FE/QA agent team in Docker: A2A envelopes, parallel fan-out, distributed LangSmith traces, failure ratchet', track: 'ai',   act: 4, cluster: 'Agent Patterns' },
  { id: 54, badge: '49', title: 'DeepAgents — Batteries-Included Harness', subtitle: 'create_deep_agent() + SubAgent TypedDicts: built-in file tools, middleware stack, FilesystemPermission, Skills, AsyncSubAgent, HarnessProfile — Housing.com PM/EM/BE/FE/QA in Docker', track: 'ai', act: 4, cluster: 'Agent Patterns' },
  { id: 51, badge: '★',  title: 'Act 4 Capstone — Production RAG Layer',   subtitle: 'RAGAS-evaluated RAG pipeline on Housing.com data — faithfulness ≥0.80, p95 <200ms, CI gate',                                                      track: 'ai',   act: 4, cluster: 'RAG & Knowledge' },

  // ── Act 5: Transfer & Mastery ────────────────────────────────────────────────
  { id: 46, badge: '48', title: 'AI System Design Interviews',             subtitle: '6-step framework, 4 MAANG questions — apply to any domain',                                                                                  track: 'core', act: 5 },
  { id: 47, badge: '49', title: 'AI Engineering Across the Industry',      subtitle: 'FAANG company profiles, domain challenges, role archetypes, open-source stack',                                                              track: 'ai',   act: 5 },
  { id: 48, badge: '50', title: 'FE → AI Transition Playbook',             subtitle: 'Skills mapping, transition narrative, 10-week plan',                                                                                         track: 'fe',   act: 5 },
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    label: 'FE Engineer, new to AI',
    outcome: 'By the end, you can build and explain a production AI pipeline from browser to LLM response.',
    path: 'Act 0 (1–4) → Act 1 (5, 6) → Act 2 → Act 3 → Mod 43',
  },
  {
    label: 'Backend Engineer, new to AI',
    outcome: 'By the end, you can design, implement, and harden an AI agent system with production-grade observability and safety.',
    path: 'Mod 2 → Act 1 → Act 2 → Act 3 → Mod 43',
  },
  {
    label: 'AI practitioner (system design)',
    outcome: 'By the end, you can defend any AI system design in a 45-minute MAANG interview using a repeatable 6-step framework.',
    path: 'Mods 5, 6, 7, 8, 9, 24, 43. Skip rest of Act 4.',
  },
  {
    label: 'Enterprise / Azure architect',
    outcome: 'By the end, you can evaluate and specify an AI agent system for enterprise scale — multi-tenant, compliant, and provider-agnostic.',
    path: 'Mods 5, 6, 9, 20, 18, 21, 19, 22, 11, 43. Act 4 optional.',
  },
  {
    label: 'New hire (week 1)',
    outcome: 'By the end, you can read any node in this codebase, understand what it does, and know where your first contribution should go.',
    path: 'Mod 7 (roadmap) → Mod 23 (gotchas) → fill Act 2 gaps',
  },
  {
    label: 'MAANG AI interview prep',
    outcome: 'By the end, you can answer L5/L6 AI system design questions with specific architectural decisions and production consequences.',
    path: 'Mod 5 → Mod 16 → Mod 43 → Mod 24 → Act 4 as needed',
  },
  {
    label: 'RAG Specialist',
    outcome: 'By the end, you can design, implement, and evaluate a production RAG pipeline from chunking strategy to RAGAS scoring.',
    path: 'Mod 1 → Mod 2 → Mods 29, 30, 31, 32, 33, 16',
  },
  {
    label: 'Models & Infrastructure',
    outcome: 'By the end, you can select, serve, and benchmark any LLM — hosted, local, or fine-tuned — for a given cost/latency target.',
    path: 'Mods 38, 39, 40, 41',
  },
  {
    label: 'Agent Engineering',
    outcome: 'By the end, you can build multi-turn stateful agents with tool use, HITL interrupts, and multi-agent coordination.',
    path: 'Mod 5 → Mods 26, 27, 38, 39, 42',
  },
  {
    label: 'FE → AI (Non-Uber / FAANG)',
    outcome: 'By the end, you can navigate the broader AI engineering landscape, position yourself for AI roles, and design for any domain.',
    path: 'Act 0 → Mod 45 → Mod 44 → Mods 34, 38, 43',
  },
  {
    label: 'Full AI Toolkit (Act 4)',
    outcome: 'By the end, you have hands-on depth in LangGraph, RAG, model selection, and agent patterns for a production AI project.',
    path: 'Act 0 first (1–4), then Act 1 (5, 6), then all of Act 4 in order',
  },
  {
    label: 'Technical leader / VP',
    outcome: 'By the end, you can set AI engineering standards, evaluate team decisions, and lead the conversation at system design reviews.',
    path: 'Mods 5, 19, 20, 22, 24, 43. Deep-dive where team focuses.',
  },
];
