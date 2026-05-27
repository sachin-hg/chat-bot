# SSE vs WebSocket — Why We Chose WebSocket for All Modes

## What is SSE?

Server-Sent Events (SSE) is an HTTP/1.1 and HTTP/2 standard where the server holds open a response and pushes `text/event-stream` data to the client over time. The client uses the browser-native `EventSource` API. The connection is **unidirectional: server → client only**.

```
Client                        Server
  │──── GET /stream ──────────►│
  │◄─── data: chunk 1 ─────────│
  │◄─── data: chunk 2 ─────────│
  │◄─── data: chunk 3 ─────────│
  │                            │  (connection stays open)
  │──── POST /message ────────►│  (separate HTTP request to send)
```

Sending a message requires a **separate HTTP POST** — the SSE channel is receive-only.

---

## What is WebSocket?

WebSocket is a protocol upgrade over HTTP that creates a persistent, **bidirectional** TCP connection. Either side can send at any time.

```
Client                        Server
  │──── HTTP Upgrade ─────────►│
  │◄─── 101 Switching ─────────│
  │                            │
  │──── frame (any time) ─────►│
  │◄─── frame (any time) ───────│
  │◄─── frame (any time) ───────│
```

---

## Why Not SSE for This System

### Problem 1: Mode Switching Requires Reconnection

The housing.com flow transitions through three modes in one session:

```
BOT_ACTIVE → P2P_ACTIVE → (optionally) SUPPORT
```

With SSE + POST for bot chat, switching to P2P requires:
1. Closing the SSE connection
2. Opening a WebSocket connection
3. Re-establishing auth and session state
4. The user perceives a loading pause or blank state

With a single WebSocket, the mode switch is a server-side routing change. The client sends the same message frames; only the server's handling changes. No reconnect, no UI flicker.

### Problem 2: SSE is Receive-Only — P2P Cannot Work Over It

P2P chat is bidirectional. Both buyer and seller send and receive. SSE fundamentally cannot handle this — you would need SSE (receive) + HTTP POST (send) for each participant.

Under this model, a P2P conversation involves:
- Buyer SSE connection (receive)
- Seller SSE connection (receive)
- Buyer HTTP POST per message (send)
- Seller HTTP POST per message (send)

Each POST creates a new TCP connection (or reuses HTTP/2 streams), goes through auth middleware, gets routed to a service, and returns a response. Under P2P's near-zero latency requirement, this overhead is unacceptable. WebSocket keeps the connection open; the marginal cost of sending one more message is one TCP write.

### Problem 3: Typing Indicators and Presence Cannot Be Sent Over SSE

`p2p_typing` and `presence_update` are user-originated events. The user's client needs to push these to the server in real time (on every keystroke for typing). Over SSE, each keypress would be a separate HTTP POST. Over WebSocket, it is a single small frame on an open socket.

For typing indicators specifically, debounce happens client-side (send after 300ms pause), but even debounced, an HTTP POST per indicator is:
- A new request with headers (~500 bytes minimum overhead vs. ~10-byte WS frame)
- Potentially a new TCP connection if no keep-alive or HTTP/2 stream

### Problem 4: Two Connections vs. One

If you use SSE for bot + WebSocket for P2P, the client manages two separate connections simultaneously during the transition period. Connection state, reconnection logic, auth token refresh, and error handling must be written twice. The mode-switch code becomes a non-trivial state machine: "which connection is active, do both need to be live during transition?"

A single WebSocket eliminates this class of bugs entirely.

### Problem 5: SSE Has a Browser Connection Limit (HTTP/1.1)

Browsers cap concurrent HTTP/1.1 connections per domain at 6. SSE holds one of these open permanently. On HTTP/1.1, this means only 5 remaining connections for all other API calls on the same domain — thumbnails, property images, REST calls.

HTTP/2 multiplexes streams over one TCP connection, which mitigates this. But it introduces a dependency on the server and any intermediary proxies supporting HTTP/2 correctly. WebSocket does not have this constraint.

---

## Pros and Cons of SSE

### Pros

| Advantage | Detail |
|---|---|
| Simplicity | No protocol upgrade, no handshake. Just a long-lived GET. Standard HTTP semantics. |
| Automatic reconnect | `EventSource` reconnects automatically with `Last-Event-ID` header — built-in, no client code needed. |
| HTTP/2 multiplexing | Over HTTP/2, SSE streams share the existing TCP connection with other requests. |
| Firewall / proxy friendly | Plain HTTP, not a protocol upgrade. Corporate proxies and some mobile networks block WebSocket upgrades. |
| Native browser support | `EventSource` is part of the browser spec. No library needed, no polyfill. |
| Load balancer compatibility | Works behind any standard HTTP load balancer without sticky sessions (since no bidirectional state on the server per connection). |
| Built-in retry with event IDs | `id:` field in the stream lets clients resume from last received event after reconnect. |

### Cons

| Disadvantage | Detail |
|---|---|
| Unidirectional | Server → client only. Client must POST separately to send anything. |
| Extra request per send | Each user message is a new HTTP request with full headers, auth, and routing overhead. |
| No binary frames | SSE is text-only (`text/event-stream`). Binary data must be base64-encoded, adding ~33% size overhead. |
| Connection limit (HTTP/1.1) | Counts against the 6-connection browser limit per domain. |
| No typing / presence push | Client-originated events (typing, presence, read receipts) all need separate HTTP calls. |
| Harder backpressure | No built-in flow control; server must implement its own buffering if the client is slow. |

---

## When SSE Is the Right Choice

SSE excels when **data flows primarily in one direction (server to client)** and the use case does not require client-to-server real-time push.

### Good SSE Use Cases

**1. LLM Response Streaming (standalone, no chat history)**
If you are building a pure question-answer product — user submits a query via form, server streams the answer — SSE is perfect. The user does not send anything while the answer arrives. There is no P2P mode to switch to.

```
User types question → POST /ask → SSE stream of answer tokens
```

This is what OpenAI's ChatGPT web UI used initially (before they added features requiring bidirectional updates).

**2. Live Dashboards / Feeds**
Stock prices, sports scores, notification feeds, order tracking. Data flows one way. The user never "sends" anything in the real-time channel.

**3. Build/CI Log Streaming**
Streaming server logs or build output to a browser. The client is a passive observer.

**4. Server-Sent Notifications**
Push alerts to a logged-in user: "Your property inquiry was answered", "Price drop on saved listing". The client only receives; actions (dismiss, click) are normal API calls.

**5. Bot Chat Only (No P2P, No Support Escalation)**
If housing.com were only building a bot — no P2P, no human escalation, no typing indicators — SSE would work. User types, POSTs the message, gets a streaming SSE response. Simple, effective.

### The Decision Boundary

```
Does the client need to push real-time events?           → WebSocket
  (typing indicators, presence, P2P messages)

Does the product have multiple connection modes           → WebSocket
  that transition without reconnect?

Is it pure server push, single mode, no real-time        → SSE is fine
  client events?

Are you behind a very aggressive corporate proxy         → SSE (fallback)
  that blocks WebSocket upgrades?
```

---

## Hybrid Approach: When It Makes Sense

A hybrid (SSE receive + HTTP POST send) is sometimes chosen for:

- **Simpler backend**: Each POST goes through stateless HTTP handlers. No need to manage WS connection state, heartbeats, or per-connection subscriptions.
- **Proxy environments**: Enterprise environments where WebSocket is blocked at the network layer (uncommon on consumer web/mobile).
- **Pure streaming UX**: Some products (document editors, code assistants) stream server output and batch user input — SSE for output, POST for input, and the latency of the POST is acceptable.

For housing.com, none of these apply. The P2P latency requirement and the mode-switching requirement make the hybrid unworkable.

---

## What We Use SSE For (If Anything)

SSE is not completely off the table for housing.com. It could be used for:

- **Price drop notifications** pushed to a user's saved-listings page (no user action in the stream).
- **Property availability updates** on a listing detail page (separate from the chat window).
- **Agent dashboard live queue** — new conversations appear in agent queue without polling.

In these cases, the page already has a WebSocket for chat. The SSE connection on a non-chat page is a lightweight choice with no hybrid complexity problem.

---

## Summary

| | SSE | WebSocket |
|---|---|---|
| Direction | Server → Client only | Bidirectional |
| Client send | Separate HTTP POST | Same connection |
| Latency (client → server) | One new HTTP request | One TCP write |
| Mode switching | Requires reconnect | Server-side routing change |
| Typing indicators | HTTP POST per event | WS frame per event |
| P2P chat | Not suitable | Designed for this |
| Proxy compatibility | Excellent | Good (most proxies support, not all) |
| Binary support | Text only (base64 for binary) | Native binary frames |
| Auto-reconnect | Built into EventSource | Must implement client-side |
| Complexity | Lower (for pure server push) | Higher (but unified) |
| **Right choice for housing.com** | No (P2P + mode switching) | **Yes** |
