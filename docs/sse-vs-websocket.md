# SSE vs WebSocket: Protocol Selection

## The Decision

Housing.com uses a **hybrid protocol architecture**, not a single transport for everything.

| Service | Protocol | Reason |
|---|---|---|
| Search & Discovery Bot | SSE | AI streaming, stateless turns |
| Seller Property Management Bot | SSE | AI streaming, stateless turns |
| Support Agent Bot | SSE | AI streaming, stateless turns |
| User-Seller Chat | WebSocket | Genuine bidirectionality required |
| Support Human Chat | WebSocket | Agent push, presence, read receipts |

This is the right split. The previous design that put everything on WebSocket was replaced when the AI bots were implemented with LangGraph + FastAPI, which uses SSE natively and matches the industry pattern for LLM streaming.

---

## What is SSE?

Server-Sent Events (SSE) is an HTTP standard where the server holds open a response and pushes `text/event-stream` data to the client. The client uses the browser-native `EventSource` API. The connection is **server → client only** for streaming; the client sends messages via a separate HTTP POST.

```
Client                        Server
  │──── POST /chat/message ──►│
  │                           │  (LangGraph pipeline runs)
  │──── GET /chat/stream ─────►│
  │◄─── data: message_delta ───│
  │◄─── data: chat_event ──────│
  │◄─── data: chat_event ──────│  (sourceMessageState: COMPLETED)
```

---

## What is WebSocket?

WebSocket is a persistent, **bidirectional** TCP connection established via an HTTP upgrade. Either side can send at any time.

```
Client                        Server
  │──── HTTP Upgrade ─────────►│
  │◄─── 101 Switching ─────────│
  │                            │
  │──── frame (any time) ─────►│
  │◄─── frame (any time) ───────│
```

---

## Why SSE for AI Bots

### 1. LLM output is inherently server-to-client

A bot turn is: user sends one message, server streams back tokens. The user does not send anything while the answer is arriving. This is a one-way push — exactly what SSE is designed for.

The pattern is: `POST /chat/message` to submit, `GET /chat/stream` to receive. This matches every major LLM product in production (OpenAI, Anthropic, Gemini APIs all stream over SSE/HTTP).

### 2. Stateless turns work cleanly over HTTP

Each bot turn is stateless at the transport layer. The client opens a **new SSE connection per turn** — one `POST /chat/message` to submit, one `GET /chat/stream` to receive the response. The stream closes naturally after the final `chat_event { sourceMessageState: "COMPLETED" }`. Conversation state lives in Redis and PostgreSQL, not on the connection itself, so any backend node can handle any turn with no sticky sessions required.

This means any backend node can handle any turn. No sticky sessions required for correctness.

### 3. SSE works through CDN and proxies

SSE is plain HTTP. It passes through CDN layers, corporate proxies, and mobile network gateways without special handling. WebSocket requires an HTTP upgrade that some proxies reject or that some CDN configurations do not support for long-lived connections.

### 4. FastAPI + LangGraph emit SSE natively

The bot pipeline is a LangGraph `StateGraph` running under FastAPI, which uses `StreamingResponse` for SSE. There is no impedance mismatch: LangGraph yields events, FastAPI streams them. Adapting this to WebSocket would require a translation layer with no benefit.

### 5. Simpler backend per service

Each AI bot is a stateless HTTP service. Scale horizontally, no connection affinity needed, standard load balancing. Connection management complexity (heartbeats, reconnect tracking, per-connection subscriptions) does not exist on the bot side.

---

## Why WebSocket for Relay Channels

### 1. True bidirectionality is required

In User-Seller Chat, either party sends a message at any time — not in request-response turns. The seller may send a message unprompted at any moment. The buyer does the same. This is genuine peer-to-peer messaging, not a turn-taking protocol.

SSE can only receive. Each sent message would be a new HTTP POST, creating a new TCP connection (or HTTP/2 stream), going through auth middleware, and adding latency. Under near-zero latency requirements, the marginal cost of one more message should be one TCP write on an open socket — which is what WebSocket provides.

### 2. Presence indicators and read receipts

Presence (`user is online`) and read receipts are user-originated push events that must flow from the client to the server continuously or on every relevant user action. Over SSE, each of these is a separate HTTP POST with full headers. Over WebSocket, they are small frames on an already-open connection.

For typing indicators specifically: even with client-side debounce, an HTTP POST per indicator involves ~500 bytes of header overhead vs. a ~10-byte WebSocket frame. At scale, across thousands of concurrent conversations, this is not negligible.

### 3. Seller can push to buyer at any time

A seller is not responding to a buyer's turn — they may initiate contact. This is not a request-response model at all. It requires a persistent channel where the server can push to either participant independently. WebSocket is designed for exactly this; SSE is not.

### 4. Server fan-out to multiple participants

A support conversation may have the user, the agent, and a supervisor observing. All receive the same messages in real time. The relay layer uses Redis Pub/Sub to fan out a message to all connected WebSocket nodes. SSE would require a separate subscription channel per participant, with no shared connection infrastructure.

---

## Protocol Comparison

| | SSE | WebSocket |
|---|---|---|
| Direction | Server → Client (receive); HTTP POST (send) | Fully bidirectional |
| Client send latency | New HTTP request + headers each time | Single TCP write on open socket |
| CDN / proxy compatibility | Excellent — plain HTTP | Good on most; some proxies/CDNs require config |
| Connection state | Stateless between turns | Persistent, stateful connection |
| Auto-reconnect | Built into `EventSource` with `Last-Event-ID` | Must implement client-side |
| Binary support | Text only (base64 for binary) | Native binary frames |
| Backend scaling | Stateless, any node handles any turn | Sticky session helpful (not required if Redis used) |
| Typing indicators / presence | HTTP POST per event | WS frame per event |
| Server push (unprompted) | Not possible — client must hold stream open | Native |
| Right choice for AI bots | Yes | Unnecessary complexity |
| Right choice for relay channels | No — bidirectionality required | Yes |

---

## Pros and Cons Reference

### SSE Pros

| Advantage | Detail |
|---|---|
| Simplicity | No protocol upgrade, no handshake. Standard HTTP semantics. |
| Automatic reconnect | `EventSource` reconnects automatically with `Last-Event-ID` — built in, no client code. |
| HTTP/2 multiplexing | Over HTTP/2, SSE streams share the existing TCP connection with other requests. |
| Firewall / proxy friendly | Plain HTTP. Corporate proxies and some mobile networks block WebSocket upgrades. |
| Native browser support | `EventSource` is part of the browser spec. No library or polyfill needed. |
| Standard load balancing | Works behind any HTTP load balancer without sticky sessions. |
| Built-in retry with event IDs | `id:` field lets clients resume from the last received event after reconnect. |

### SSE Cons

| Disadvantage | Detail |
|---|---|
| Unidirectional | Server → client only. Client must POST separately to send anything. |
| Extra request per send | Each user message is a new HTTP request with full headers, auth, and routing overhead. |
| No binary frames | SSE is text-only. Binary data must be base64-encoded (~33% overhead). |
| No typing / presence push | Client-originated real-time events (typing, presence, read receipts) all need separate HTTP calls. |
| Connection limit (HTTP/1.1) | Counts against the 6-connection-per-domain browser limit. HTTP/2 mitigates this. |

---

## Where SSE Would Not Work for This System

The relay channels (User-Seller Chat, Support Human Chat) have three properties that make SSE unsuitable:

1. **Either party initiates** — not a request-response pattern
2. **Near-zero latency requirement** — HTTP POST overhead on every message is unacceptable
3. **Presence and read receipts** — client-originated events, continuously pushed

These are the exact conditions where WebSocket is the right choice and SSE is not.

---

## SSE Uses Outside the Chat Window

SSE remains appropriate for read-only server push in other parts of the product, entirely separate from the chat architecture:

- Price drop notifications on a saved-listings page
- Property availability updates on a listing detail page
- Agent dashboard live queue (new conversations appear without polling)

In these contexts, the client is a passive observer of server state. There is no bidirectionality. SSE is the correct, simpler choice.
