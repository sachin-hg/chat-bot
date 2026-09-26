# Jonathan Ive's Design & Experience Review
## AI Engineering Course Platform — June 2026

---

There is a profound difference between a course that teaches and a platform that transforms — and this platform, for all its technical correctness, has not yet decided which it wants to be. The bones are sound: a systematic component architecture, a dark theme with genuine semantic intent, interactive visualisations that in their best moments — the TokenExplorer, the JWTAnatomyViz, the IngestionPipelineViz toggle — show flashes of real pedagogical craft. But a flash is not a flame. Across 56 modules, the signal-to-noise ratio of visual ambition is too low, the treatment of code too uniform, and the moments of genuine delight too accidental to constitute a designed experience. What follows is not encouragement — it is a specification.

---

## Design System Assessment

### Colour

The accent palette — `--accent` through `--accent5` — maps directly to GitHub's semantic colour vocabulary: issue blue, PR green, alert red, label purple, warning amber. This is borrowed identity. A course about AI engineering deserves its own chromatic language, one where colour communicates meaning within the course's own conceptual vocabulary rather than within GitHub's product vocabulary.

Rename at declaration site. The current `--accent4: #d2a8ff` tells a developer nothing. `--colour-intelligence: #d2a8ff` tells them everything. Proposed canonical set:

```css
:root {
  --colour-signal: #58a6ff;        /* data flow, links, active states */
  --colour-live: #3fb950;          /* running, success, correct */
  --colour-error: #f78166;         /* failure, block, wrong */
  --colour-intelligence: #d2a8ff;  /* model, reasoning, LLM */
  --colour-latency: #ffa657;       /* warning, cost, caution */
}
```

Keep the old names as migration aliases: `--accent: var(--colour-signal)`. Remove within one sprint.

The background elevation system (`--bg: #0d1117`, `--bg2: #161b22`, `--bg3: #21262d`) is theoretically correct but perceptually absent. The contrast ratio between `--bg` and `--bg2` is approximately 1.15:1 — invisible in any ambient light. Either increase the step size or introduce a subtle 1px border strategy to make depth legible without relying on near-identical background tones. The current system reads flat on every monitor I have seen outside a lightless room.

The two-design-system problem — the root variable system ending around line 419 and the Catppuccin Mocha system beginning at line 420 for visualisation components — is not an inconsistency. It is a contradiction. A student scrolling through a module sees two slightly different shades of dark background, two different blues, two different greys. They will not know why. They will simply feel that something is off. Unify unconditionally. `#181825` becomes `var(--bg)`. `#89b4fa` becomes `var(--colour-signal)`. `#cdd6f4` becomes `var(--text)`. Every visualisation component in the `viz-wrap` family should resolve through the same twelve root tokens as everything else on the page.

The callout system has a specific failure: `callout-maang` and `callout-tip` share `--accent2` green at `.06` versus `.08` opacity — visually indistinguishable. `callout-misconception` and `callout-exercise` share `--accent5` amber at identical `.06` opacity. Two pairs that are conceptually opposite render identically. A student scanning cannot reliably distinguish 'here is something you will get wrong in an interview' from 'here is something to practise'. Fix: give `callout-misconception` a 6px left border and `callout-exercise` a 2px dashed border. The shape difference communicates without adding colour.

### Typography

The type scale — 28px h1, 22px h2, 17px h3, 14px h4, 15px body — is not wrong but it is not deliberate. The step from 28 to 22 is 6px. The step from 22 to 17 is 5px. These feel manually approximated rather than mathematically inevitable. A modular scale at ratio 1.25 gives: 32 / 25.6 / 20.5 / 16.4 — use 32 / 26 / 21 / 16. The hierarchy becomes perceivable rather than readable.

The h3 is coloured `var(--accent4)` — purple. The h4 is coloured `var(--accent5)` — amber. These are semantic colours, not hierarchical ones. A student scanning the page perceives 'purple section' before they perceive 'sub-section'. Colour should reinforce weight, not replace it. H3 should be `#e6edf3` (near-white), h4 should be `#c9d1d9` (muted white). Weight does the hierarchy work. Colour stays reserved for meaning.

The `.act-header` class renders at 9px. At 9px, uppercase, on `var(--muted)` colour over `#161b22`, this fails WCAG AA contrast at virtually every brightness setting outside a darkened room. The `.cluster-header` at 8px is categorically unacceptable — this is not a legibility concern, it is a compliance failure. Immediate fix: `.act-header { font-size: 11px; }`, `.cluster-header { font-size: 10px; }`. No further discussion required.

The `line-height: 1.7` applied universally to body is correct for prose. Applied to 9px sidebar metadata labels, it produces excessive vertical spacing in compact list contexts. Three rhythms are needed: body prose at 1.7, UI chrome at 1.4, code at 1.6.

### Spacing

There is no spacing scale defined as CSS custom properties. Every padding and margin in the codebase is a hard-coded pixel value. When a developer adds a new component, they have no guidance. The result is visible: the sidebar alone has approximately six different horizontal inset values. The `.mod-item` padding is 9px — not 8px, not 10px, but 9px. This is not precision. This is approximation dressed as precision.

Define and enforce:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}
```

Audit every padding and margin value. Snap to the nearest variable. The tolerance is zero — 9px becomes `--space-2`, 10px becomes `--space-3`, 12px becomes `--space-3`. Visual left-edge alignment in the sidebar is the single most important structural principle of a vertical nav. Every left edge should share a 16px indent.

There are seven distinct border-radius values across the system: 3px, 4px, 6px, 8px, 10px, 12px, and circular. This is not a design vocabulary. Define three:

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

Replace all seven with these three. The score-circle in `QuizBody` is an exception — keep `border-radius: 50%` for circles.

There is no shadow/elevation scale. The `node-tooltip` uses `box-shadow: 0 8px 32px rgba(0,0,0,.6)`. The `tutor-panel` uses `0 20px 60px rgba(0,0,0,.6)`. The `tutor-fab` uses `0 4px 20px rgba(88,166,255,.4)`. Three different shadow syntaxes, two different shadow colours, no shared variable. Define:

```css
:root {
  --shadow-sm: 0 2px 8px rgba(0,0,0,.4);
  --shadow-md: 0 8px 24px rgba(0,0,0,.5);
  --shadow-lg: 0 20px 60px rgba(0,0,0,.6);
}
```

The `#main` has `max-width: 900px`. On a 1440px monitor with a 280px sidebar, this leaves 260px of dead right space. Either constrain the overall layout with `max-width: 1400px` on a flex parent, or use the right gutter intentionally — persistent key-term definitions, reading progress, related module links. Dead space on a premium course platform is a failure of intent, not merely of aesthetics.

---

## Critical Fixes — Week 1

These seven fixes require no new libraries, no architectural changes, and no design review. They should be committed before any new feature work.

**Fix 1: Unify the two colour systems.** In the `viz-wrap` and related CSS blocks, replace every Catppuccin literal with the corresponding root variable. `#181825` → `var(--bg)`. `#313244` → `var(--border)`. `#89b4fa` → `var(--colour-signal)`. `#cdd6f4` → `var(--text)`. `#6c7086` → `var(--muted)`. This is find-and-replace work. It eliminates the most visible design inconsistency in the platform.

**Fix 2: Raise minimum font sizes.** `.act-header` to 11px. `.cluster-header` to 10px. Every SVG text element across all module files to a minimum of 10px. Every inline code block to a minimum of 13px. These fail legibility standards in their current form.

**Fix 3: Define the spacing scale and radius scale as CSS variables.** Implement the variable declarations above. Begin auditing and replacing values starting with the sidebar (highest cumulative time spent by students) and the quiz section (highest emotional stakes).

**Fix 4: Fix the `.complete-btn` CTA inversion.** The default (incomplete) state of the mark-as-complete button currently looks disabled — `var(--bg3)` background, `var(--muted)` text. The most important action a student takes in a module looks inactive. Invert: default state should be the visually prominent state (`background: var(--colour-live); color: #000`), completed state should be subdued (`background: var(--bg3); color: var(--colour-live); border-color: var(--colour-live)`).

**Fix 5: Move the `<defs>` block to the top of every SVG.** `Mod33.tsx` and several other modules define SVG markers after the elements that reference them. This causes arrow rendering failures in Safari and Firefox. Find every `<marker>` definition, move it inside a `<defs>` block immediately after the opening `<svg>` tag.

**Fix 6: Remove the dead `useEffect` from `Mod17.tsx`.** The effect targeting `#sse-demo .sse-frame` elements will never find any matching elements because no element with `id="sse-demo"` exists in the JSX. Dead effects are noise that erode trust in the codebase.

**Fix 7: Fix the `score-circle` overflow in `QuizBody`.** The 56px circle must display '100%' — four characters at 18px font size in a 50px inner diameter. This clips on most browsers. Reduce font size to 14px when score is 100, or increase circle diameter to 68px. Test at score=100 before marking closed.

---

## Act-by-Act Module Review

### Act 1 — Foundations & Architecture

The foundation Act sets the visual register for everything that follows. It contains the platform's single best-designed interaction moment — the SSE frame animation in `Mod1.tsx` — alongside its most egregious design contradiction: ASCII architecture diagrams in a module that has already demonstrated SVG capability.

**Act flow assessment:** The progression from Philosophy (`Mod0`) through Architecture (`Mod1`) to State (`Mod3`) to Tools (`Mod4`) is conceptually logical. Visually, each module feels authored independently. There is no shared visual vocabulary between them — `Mod0` uses static SVG with broken paths, `Mod1` uses animated SSE frames, `Mod3` uses a stepper — as if three different people built three different products. A shared component library with consistent interaction patterns is the only structural fix.

---

**Mod0.tsx — Philosophy of AI Agents | Score: 5.5**

The opening inversion — 20 lines of production code before any context, before any objectives, before any spectrum diagram — is the single most instructive pedagogical mistake in Act 1. A student who opens a course module and is asked to run terminal commands before understanding why has already been failed by the design. Move the `learning-obj` block and the `AgentSpectrumViz` above the code block unconditionally.

The `ThreeQuestionViz` flowchart has a rendering bug that I find indefensible in a course that teaches people to build production systems: `strokeWidth=0` invisible lines at lines 105-106 of the JSX, dead SVG markup that signals the author did not look at their own work. The `No` branch from Q3 draws a diagonal line through the `Scripted pipeline` result box. These are not minor pixel issues — they are trust failures.

The `AgentSpectrumViz` renders four cards at 10px SVG font size. At any viewport under 1200px, these are unreadable. Rebuild as a responsive vertical card layout using Framer Motion — four cards stacked on mobile, 2×2 on desktop, each clickable to reveal an animated code trace.

The 85/15 insight — that the LLM is 15% of the system — is the most important idea in the module and deserves a D3.js animated donut chart that draws itself on scroll-into-view. The LLM as a tiny 15% slice is a genuine 'oh' moment that flat prose cannot produce.

**Verdict:** Fix the order. Fix the broken flowchart. The module has something important to say about systems thinking. Currently it says it poorly.

---

**Mod1.tsx — High-Level Design | Score: 6.5**

The SSE animation is the platform's finest moment. The `sse-frame.visible` class toggling with staggered CSS transitions is exactly the right design choice — motion that teaches, not motion that decorates. Protect this and build toward it.

The ASCII architecture diagram at section 4.7 — the provider-agnostic diagram — crashes the visual language like a wrong note. The module has already established SVG as its diagram medium. Reverting to `pre`-formatted ASCII is not a stylistic choice. It is a failure of follow-through. Replace with a layered SVG using the same visual vocabulary as the existing diagram at lines 149-214, with CSS 3D perspective transforms (`perspective: 800px; transform-style: preserve-3d; rotateX(5deg)`) to give the architecture a spatial quality.

The JS/TS translation table inside a `callout-tip` is the most pedagogically generous piece of content in Act 1 — it maps Python asyncio directly to JavaScript equivalents for frontend engineers who are the primary audience. It is completely invisible as a callout. It deserves its own component: a two-column code diff panel, Python on the left with a `#0d1117` background, JavaScript on the right with a `#0f1f0f` background, labelled headers, horizontally paired code snippets at matching line heights.

**Verdict:** The SSE animation is a foundation to build from. Lose the ASCII diagram. Surface the JS/TS translation table.

---

**Mod3.tsx — State Management | Score: 6.2**

The `LuaCASViz` stepper is the seed of something genuinely useful. A visual race condition that students step through at their own pace is correct pedagogical design. The problem is the session state evolution table — the 4-turn conversation trace that answers every student's first question about how state accumulates — rendered at 11px inline-styled JSX in a horizontal-scroll div. This is the module's intellectual heart, and it gets the least visual investment.

Replace the static table with a vertical interactive stepper: four numbered steps, each collapsed to a one-line summary. Clicking a step expands with 200ms slideDown to reveal the filter delta on the left and the resulting `session.active_filters` on the right, with colour-coded diff highlighting — green for new or changed keys, grey for unchanged, red for cleared. This is Framer Motion's `AnimatePresence` in 30 lines of JSX.

The `RedisKeyViz` SVG is purely decorative — it shows the same information as the text below it. Make each key row clickable. On click, expand a detail panel showing the exact Redis command used, the data shape stored, and the TTL rationale. A hover state that brightens the row border stroke from opacity 0.6 to 1.0 signals clickability without requiring additional UI elements.

**Verdict:** The LuaCAS stepper earns its place. The session state table needs to become a timeline. The Redis viz needs to become a reference tool.

---

**Mod4.tsx — The Tool System | Score: 6.5**

The `PrefetchTimingViz` communicates the core insight — parallelise before the LLM, `max()` not `sum()` — in ten seconds of interaction. This is the module's one genuine success. Protect it and extend it: the toggle between parallel and sequential should feel like a dramatic reveal, not a button state change. Add a 300ms pause when switching modes, during which the bars fade out before animating in to their new configuration. Make the difference feel as dramatic as it is — 590ms versus 790ms is 34% slower.

The Bad vs Good SLM Taxonomy Prompt section is the module's pedagogical centrepiece — the most common failure mode in real production systems — rendered as a single monolithic `pre/code` block containing both examples separated by a comment. A student cannot compare them side by side. They must read sequentially in the same monochrome block. This needs a side-by-side diff view: left column labelled `BAD` with a 4px solid `var(--colour-error)` top border, right column labelled `GOOD` with a 4px solid `var(--colour-live)` top border. Within each column, apply YAML highlighting via PrismJS. Add diff-style background highlights.

The iteration cycle callout lists five numbered steps in an `ol` — but the steps describe a feedback loop, a cycle, not a linear sequence. Rendering a cycle as a flat ordered list destroys the circular mental model that is the entire point. Replace with a pentagon SVG diagram: five nodes, animated dot travelling the circuit, each node clickable to reveal step detail.

**Verdict:** The timing visualisation earns an 8. The taxonomy comparison earns a 3. The distance between them is the module's problem.

---

**Mod2.tsx — Pipeline Architecture | Score: 7.4**

The `PipelineNodes` component with hover tooltips and click-to-expand detail callouts is the closest thing in Act 1 to Apple-quality execution. Nineteen nodes, each clickable, each revealing meaningful context — this is interaction design that teaches. The phase-colour system (classify/process/response) is well-executed and should be the template for all future pipeline diagrams.

The `PipelineFlowViz` claims in its label to trace all 19 nodes but `PIPELINE_STAGES` has only 7 entries. This is a trust problem. A careful student — and the target audience is careful engineers — will notice immediately and wonder what else is approximate. Either expand to all 19 nodes in a two-row layout, or change the title to reflect what is actually shown. There is no middle ground here.

The `BotStateCartViz` arrow geometry is visually noisy — four arrows from four different y-positions converging on the cart's left edge, crossing paths at x=140. Replace converging arrows with L-shaped connectors: each node aligns vertically with its field group, horizontal lines connect node to fields, a vertical bar at `cartX-20` connects all field groups to show they are one `BotState`. This is standard system diagram practice and eliminates the crossing-path problem entirely.

**Verdict:** The `PipelineNodes` component is genuinely excellent. Fix the 7/19 discrepancy. Fix the arrow geometry. This module reaches an 8.5 with those two changes.

---

**Mod12.tsx — Composability | Score: 5.8**

`DomainAdapterViz` has a `selectedAdapter` state that is always null. Clicking an adapter box does nothing. The entire pedagogical point of composability — that you can swap domains by changing the adapter — is not demonstrated. A ten-line React change: on click, (1) highlight the selected adapter with a 2px solid border, (2) dim others to 30% opacity, (3) update the core pipeline box label with domain-specific details. This is the minimum viable interaction for this concept.

The `StateMachineComparisonViz` has five dotted equivalence lines that all animate simultaneously at 1.2s duration with no stagger delay. The visual result is five parallel animated lines that read as background noise rather than meaningful correspondence. Add `animation-delay: 0.1s * i` to each line so they animate sequentially. Make each `1:1` label (currently `fontSize=10`, `fill='#6c7086'`) into a clickable element that reveals a brief explanation of why these two patterns are equivalent.

The module is missing a learning objectives block — the only module in Act 1 without one. Add it. It takes five minutes.

**Verdict:** This is the conceptual capstone of the architecture act and it has the fewest interactive elements. The composability concept is inherently spatial and dynamic — adapters swapping, domains reconfiguring — and it must feel like working with building blocks.

---

**ModCap2.tsx — Act 2 Capstone | Score: 5.1**

A capstone is a ceremony. It is the moment where scattered learning coheres into capability. This capstone is a requirements document.

The scaffold directory tree as a `language-plaintext` code block must become an interactive file tree component: folder icons, file type colour-coding, `TODO` badges on files the student must implement, muted colour on pre-provided files, click-to-preview any file's starter content.

The `complete-btn` at the end is absent entirely — there is no module completion ceremony, no 'Act 2 Complete' moment, no connection to Act 3. Add a `.callout-milestone` with a brief summary of what the student built and a 'Mark Act 2 Complete' button that (a) writes to localStorage, (b) triggers a confetti animation (30 lines of canvas, or `canvas-confetti`), and (c) updates the sidebar state to mark all Act 2 modules complete.

The L3/L4/L5 rubric as a plain three-row table is the opposite of motivating. Redesign as three vertical cards: L3 (muted border), L4 (accent blue border — the target, with a 'Target' badge), L5 (green border — stretch). Each card has a checklist of specific criteria that students can tick.

**Verdict:** If a student passes this capstone having met all four RAGAS thresholds, they have accomplished something real. The module should make that reality feel as significant as it is. Currently it does not.

---

### Act 3 — Production & Quality

Act 3 covers testing, observability, A/B experimentation, production readiness, and enterprise patterns. The act's fundamental tension is between concepts that are inherently dynamic — test pipelines running, metrics drifting, traffic splitting — and a presentation that is uniformly static. The one exception, `LangSmithDebugViz` in `Mod6.tsx`, proves the rule: the only genuinely interactive component in the act is the most memorable content in the act.

---

**Mod5.tsx — Testing & Quality | Score: 6.2**

`TestPyramidViz` and `GoldenDatasetViz` are both static SVGs with dead code: the `dash-anim-5a` keyframe is defined in a `<style>` block but never applied to any element. Remove dead code or apply it. There is no middle ground — half-finished motion design is worse than no motion design.

Make each pyramid layer clickable. On click, the selected layer expands to a side panel with cost per test, speed, sample count, and example test code. The SVG polygon becomes a navigation device — the visual entry point to depth.

The `GoldenDatasetViz` fixed-coordinate SVG text positions will collide on any viewport narrower than 600px. Move the golden dataset representation into an HTML table with responsive column widths. The CI gate pass/fail indicators are the only SVG-worth-keeping elements.

The `BOT_ENV=mock` callout has malformed content — the `strong` tag runs directly into sentence body with no whitespace separator, rendering as `BOT_ENV=mockSet BOT_ENV=mock...`. This is a copy-paste error. Fix it.

**Verdict:** The module has correct content and broken visual execution. The pyramid diagram is drawn but not felt. The copy-paste error in the callout is unacceptable.

---

**Mod6.tsx — Observability | Score: 6.8**

The heading numbering jumps from `5.3` to `12.4 Fairness & Demographic Drift Monitoring` within a single module. This is a copy-paste accident from a different document, and it destroys credibility with any detail-oriented engineer — which is the entire audience of this course. Renumber all headings consistently to match the module's actual identifier.

`LangSmithDebugViz` has genuine click interactivity and a detail panel that updates on click. This is correct. The duplicate button row below the SVG — which does identically what clicking the SVG boxes does — should be removed entirely. The SVG boxes are the sole interaction target. The detail box at `y=100`, `height=50` is too short for the `domain_routing` span text at `confidence=0.42`. Increase height to 80px and raise the SVG `viewBox` height accordingly.

The six-step debugging walkthrough inside a single `callout-info` div — with `strong` tags, `pre/code` blocks, and prose all crammed together — is using the callout container as a dumping ground. Extract to its own section with step-counter styling: circular number badge, step title, collapsible code block per step. The callout format is designed for 2-4 sentences. It is not a tutorial format.

**Verdict:** The LangSmith debug workflow is the most genuinely interactive content in Act 3. Give it room to breathe. The heading numbering error must be fixed before any student review.

---

**Mod7.tsx — A/B Experiments | Score: 6.8**

`StatSigViz` is the single most important missed interaction in Act 3. Two static bell curves that cannot move, cannot be dragged, cannot be explored. The key intuition for statistical significance — more overlap equals less signal, larger MDE requires less data — cannot be felt by looking at a static picture. Two sliders are required: MDE (0.01 to 0.10) and sample size N (100 to 5000). As the student drags, the bell curves animate apart or together using Framer Motion spring transitions, the overlap region recolours, and a 'days to significance' counter updates. This single interaction is worth more than three pages of prose explanation.

`HashAssignmentViz` is genuinely useful — typing a session ID and watching the bucket assignment update in real time is exactly the right interaction for this concept. Extend it: when the bucket assignment flips from `control` to `treatment`, add a 300ms `pulseAccent` keyframe on the result box — `scale(1.04)` spring with a brief glow — to make the state change feel significant.

The sample size table inside a callout inside a `pre/code` block is a triple-nested layout that must be resolved. Extract to a standalone full-width table with explicit column widths. Add a fourth column: 'Signal strength' as an inline SVG bar from 0 to 100%, so the student can scan to the specific pattern they need.

The `p`-value inflation through peeking callout has no visual companion. Add a small SVG line chart (200px tall) showing false positive rate on Y-axis against number of daily peeks on X-axis, with a horizontal dashed red line at 0.05. One curve. One lesson. Unforgettable.

**Verdict:** The hash calculator works. The bell curves don't. In a module about statistical significance, the statistics must be interactive.

---

**Mod8.tsx — Production Readiness | Score: 6.2**

The lifecycle table at section 7.4 is 24 rows of production gold — the complete T+0ms to T+1830ms request journey — but it reads as a spreadsheet. The critical insight that `connection_close` fires at T+1653ms before Redis at T+1660ms and Kafka at T+1830ms — the entire argument for the architecture — is buried at row 21 of 24 with no visual emphasis.

This must become a horizontal swimlane diagram: four lanes (Browser, FastAPI/LangGraph, External APIs, Infrastructure), each event placed at its T+ position on a logarithmic X-axis. The `connection_close` event receives a vertical golden accent line spanning all four lanes. Hover any node for full event details. The most important moment in the request lifecycle becomes architecturally unmissable.

`DegradationMapViz` is a static colour-coded table. The four degradation levels represent a state machine — L0 is the happy path, L3 is a crisis — and none of this tension is conveyed by a static SVG. Add toggle switches for each dependency (LLM, Redis, Housing API, Kafka). Disabling them cascades the degradation level with CSS transitions. Disabling LLM and Redis simultaneously should trigger a red pulse animation on the level badge. The student must feel the cascade, not just read about it.

`ConcurrencyGateViz` buttons have no hover states, no cursor feedback beyond `pointer`. When the gate is full, 'Send request' should look dangerous — `background: rgba(247,105,102,.2)`, `border-color: #f78166`, plus a 200ms shake keyframe on click-when-rejected. The rejection must feel physically wrong.

**Verdict:** The concurrency gate is interactive but toothless. The lifecycle table is the most valuable artefact in the module and is hidden in a table row. Both must change.

---

**Mod10.tsx — Enterprise Patterns | Score: 4.8**

Zero interactive visualisations. Not one. A module covering multi-tenancy, per-tenant rate limiting, GDPR erasure, and provider swapping — four architecturally rich concepts that are all inherently spatial — presented as five code blocks and two HTML tables.

The tenant isolation bug — where a missing `tenant_id` causes silent data contamination across tenants — is one of the most consequential concepts in the entire course. Build a 'Tenant Isolation Simulator': two panels (Tenant A, Tenant B), each with a session write form, a Redis keyspace visualiser below. A 'Bug mode' toggle removes `tenant_id` from the key construction. Watch Tenant B's write overwrite Tenant A's session in real time. The data contamination event is visceral — you see data disappear. Nothing else teaches it as effectively.

The GDPR/HIPAA/CCPA compliance table renders three regulations as identically styled rows despite GDPR's erasure obligation and HIPAA's 6-year retention requirement being conceptually opposite — one demands deletion, one mandates preservation. Replace with three regulation cards: GDPR in EU blue (`#003399` tint), HIPAA in red tint, CCPA in gold tint. Each card has `Retention requirement` and `Erasure right` with explicit YES/NO/LIMITED badges. A small SVG timeline inside each card shows the retention window as a horizontal bar. The visual contrast makes the compliance landscape memorable.

The `CODE_ERASE_USER` block uses `redis.keys()` — a production anti-pattern that blocks Redis during its entire scan. This is taught without any warning. Add a `callout-gotcha` immediately after: `KEYS blocks all other Redis operations for its entire scan duration. Use SCAN with a cursor instead.`

**Verdict:** This module has been given some of the richest conceptual material in the course and responded by presenting it as five code blocks and two tables. That is a failure of editorial judgment.

---

**Mod11.tsx — Scale & Capacity Planning | Score: 7.1**

`DAUCalcViz` is the closest Act 3 comes to a genuine interactive tool — adjusting a slider and watching four infrastructure metrics update in real time genuinely teaches the scaling relationships. But it is immediately followed by a static table showing the same metrics at three fixed values, which undermines the calculator by suggesting the table is the authoritative reference and the slider is a toy. These two artefacts should be one: the table columns should correspond to pinnable DAU values from the slider.

The custom slider track — a `div` with `position:relative` + `position:absolute` needle rendered below the native `<input type='range'>` — creates two overlapping track visualisations. This is technically redundant and visually incorrect on Firefox and Safari. Remove the custom track entirely. Style the native range input with CSS pseudo-elements: `input[type='range']::-webkit-slider-runnable-track` with a linear gradient that fills proportionally to the slider value. Cross-browser, zero extra DOM.

The Redis hash tag section describes the `CRC16 % 16384` slot mechanism in prose. Add a 180px SVG diagram: three cluster nodes as circles, a key input field, live CRC16 slot computation in JavaScript, and an animated arrow pointing to the correct node. When the student wraps a key in `{curly braces}`, both related keys animate to the same node. The hash tag mechanic is shown, not described.

**Verdict:** The DAU calculator is the act's best tool. It needs a companion in the Redis section and a unified relationship with the scale table.

---

**Mod14.tsx — The Gotchas | Score: 7.4**

The `SeverityMatrix` scatter plot positions eight production gotchas on a 2D severity/likelihood plane. This is a genuinely original design choice — the spatial metaphor is correct. But clicking or hovering any circle does nothing. Eight carefully positioned data points that can only be read, not touched.

Make each circle a navigation device: on hover, scale to `r=11` with a CSS transition, show a popover card with the gotcha title, one-sentence description, and fix category. On click, scroll to the corresponding `GotchaCard` accordion below and auto-open it with a 300ms highlight pulse animation. The scatter plot becomes an overview+detail pattern where the chart is the entry point to depth.

The `GotchaCard` accordion uses a CSS class toggle with no transition. The body expands and collapses instantly — mechanical and abrupt. Two CSS additions, no JavaScript changes: `gotcha-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }` and `gotcha-card.open .gotcha-body { max-height: 600px; }`. The chevron should rotate 90deg on open: `transition: transform 0.3s ease`. These two additions make every accordion feel like a quality product.

The debugging exercises use nested `<details>/<summary>` elements — the most primitive HTML disclosure mechanism — for the most important pedagogical content in the module. Replace with a custom `BugExerciseCard` component: a dark card with a 'Bug Report' badge in amber, the code block, and a 'Find the bug' button. Click reveals an animated panel with the specific problematic line annotated in red and the fix in green. Each exercise should feel like filing a real production bug ticket.

**Verdict:** The severity matrix is the right idea incorrectly executed. The gotcha module teaches that sloppy production code is unacceptable while presenting its own content sloppily. That contradiction undermines the authority of every gotcha it describes.

---

### Act 4 — RAG Systems

Act 4 is the most visually ambitious Act in the course — it contains `RAGPipelineViz` (the best step-through component in the platform), `ChunkingViz` (pedagogically precise), and `RRFViz` (genuinely interactive with live score recomputation). It also contains `ModProj3.tsx` with zero interactive components and a fill-in-the-blank worksheet from 2003, and `Mod25.tsx` which describes a visual observability tool through ASCII art. The range of quality is wider here than anywhere else.

---

**Mod18.tsx — Evaluation Engineering | Score: 6.5**

`EvalCostPyramid` is not a pyramid. It renders three equal-height rectangles stacked vertically. The name says pyramid, the concept requires a pyramid, but the SVG renders three flat bars. This is a direct conceptual contradiction. Replace the three `rect` elements with `polygon` elements forming a true triangular pyramid — narrow apex for Human Annotation, medium middle for LLM-as-Judge, wide base for Unit Tests. The correct pattern already exists in `TestPyramidViz` in `Mod5.tsx`. Extract it as a shared component and use it here.

The `faithfulness flowchart` is a `pre` tag with inline styles rendering a 40-line ASCII decision tree. This is the most important decision logic in the module and it is presented as monochrome text at `fontSize:11px`. Convert to an interactive SVG decision tree using D3.js: three branches from a central 'Run LLM-as-Judge' node, colour-coded by outcome (green, yellow, red), each branch clickable to reveal downstream actions.

The evaluation flywheel section uses monospace arrows — `Production failures → LLM-as-judge → golden dataset → improved prompt → loop`. A circular flywheel is one of the most teachable visual metaphors in machine learning. Build it: four nodes in a circle, animated dashed line tracing the circuit at 3 seconds per revolution, each node clickable to pause and expand a detail panel.

**Verdict:** Eight tables in one module is not information design — it is information avoidance. The EvalCostPyramid being rectangles is not a minor issue — it is the module's visual centrepiece announcing that the implementation was never checked against the concept.

---

**Mod27.tsx — RAG Pipeline Architectures | Score: 7.2**

`RAGPipelineViz` is the best step-through pedagogical component in the entire platform. Five clickable stages, real data at each step, animated progress bar, detail panel that teaches through specificity. This is Apple-level execution. It should be the template for every other pipeline diagram across Acts 1-6.

The Naive RAG pipeline diagram is a `pre`-formatted text block with ASCII arrows. This is the most important foundational concept in Act 4 and receives the lowest-fidelity rendering. It should be an animated flow diagram: five boxes connected by arrows that animate left-to-right when the student first scrolls into view. Clicking 'Vocabulary Mismatch' overlays the pipeline, highlighting exactly where in the pipeline this failure occurs.

The `RAGComparisonViz` is an SVG that hand-calculates column widths and x-positions via JavaScript arithmetic to render a comparison table. This is a table drawn with SVG, adding complexity with no visual gain. Replace with a Recharts radar chart where each RAG architecture is a polygon — axes: complexity, latency, accuracy, cost, maintenance. Students toggle architectures on/off to compare shapes. The tradeoffs become spatial and memorable.

**Verdict:** The RAGPipelineViz redeems the module. The ASCII diagram undermines it. A great product is coherent all the way through.

---

**Mod28.tsx — RAG Optimisation & Chunking | Score: 7.0**

`ChunkingViz` earns its place completely. Three-button toggle, colour-coded output pills, explanatory notes — pedagogically precise and visually clear. The problem is that it shows the chunks as coloured pills with no visual connection to the input text. The module's core teaching point — that fixed chunking splits 'lakh' across boundaries — requires the student to manually compare the input text to the pill labels. Show it instead: character-level highlighting on the input text pane, alternating background colours matching the chunk pill colours, redrawn with Framer Motion layout animation when switching modes.

The `RerankerViz` funnel is adequate but static. Add a 'Run Reranker' button: the ten candidate bars appear instantly (fast bi-encoder), then after a 600ms pause the cross-encoder scores each candidate one-by-one (bars filling left to right, 80ms each), until the top three emerge highlighted. The pause teaches the speed differential viscerally. A cost ticker shows `$0.000 → $0.001` as the reranker runs.

The Three Chunking Failure Zones are `pre`-formatted text. These are the conceptual scaffolding of the entire module — they deserve three horizontal panel cards with distinct left-border colours and RAGAS score gauges showing the expected quality impact of each failure mode.

**Verdict:** `ChunkingViz` is the conceptual jewel. The failure zones that motivate the entire module are ASCII text. The hierarchy is inverted.

---

**Mod38.tsx — Advanced RAG | Score: 7.4**

`HydeViz` has exactly the right spatial metaphor — direct embedding far from corpus, HyDE embedding near — but nothing moves. The core insight, that the hypothetical answer closes the vocabulary gap between question and document, requires animation to become a felt experience rather than a stated fact.

Animate the two flows sequentially, not simultaneously: the direct query vector travels its arrow path and stops with a dejected bounce 'far' from the corpus cluster. Then the HyDE flow: the LLM box glows, a hypothetical text string types itself character by character, then the green circle travels and snaps near the corpus cluster. Framer Motion path animation. The contrast between the two landings is the lesson.

The `CODE_SELF_RAG` block contains `\${query}` — JavaScript template literal syntax inside Python code. This is a bug in a code example. Find it, fix it. In Python, the interpolation is simply `{query}` in an f-string. A Python syntax error in a teaching tool is inexcusable — code examples are contracts between teacher and student.

**Verdict:** This module has the best analytical prose in Act 4 — the CRAG 'filter with an AI predicate' analogy is excellent. But the visualisations don't rise to meet the writing, and a syntax error in the code undermines the technical authority the prose establishes.

---

**ModProj3.tsx — RAGAS Mini-Project | Score: 5.1**

No visualisation components. Zero. For a project module where the deliverable is a data sweep with quantitative results, this is indefensible. The results table is a fill-in-the-blank worksheet with underscores in HTML table cells. A student should be able to paste their RAGAS scores into an interactive chart that immediately visualises the chunk-size tradeoff.

Replace the static results table with a React component: four rows (chunk sizes), four editable input fields per row, a Recharts `LineChart` below that updates live as the student types their scores, and a 'Generate Recommendation' button that identifies the best performing configuration. The 'My Findings' section becomes a mini data analysis tool.

The report template inside a monospace div needs to become a structured form with labelled input fields, a 'Copy as Markdown' button that renders the filled template as a markdown string to clipboard, and a date picker for the date field. This transforms passive reading into active authorship.

**Verdict:** A project module with no interactive components in a React course is a contradiction in terms. Build the tools for the student to do the work, not just describe the work.

---

**ModCap4.tsx — Act 4 Capstone | Score: 5.8**

The four acceptance criteria (`faithfulness ≥ 0.80`, `context_precision ≥ 0.75`, `answer_relevancy ≥ 0.78`, `p95 < 200ms`) are rendered as a plain HTML table. These thresholds are the student's entire evaluation target — they will return to this table repeatedly. They deserve to be gauge cards: circular progress arcs with the threshold marked by a gold tick, an input field where the student can type their own RAGAS score, and a colour transition from red to green as the score crosses the threshold. All four gauges turning green simultaneously is the capstone's victory moment.

The STARTER_CODE at 45 lines and CI_GATE_CODE at 30 lines are the two primary deliverables — the student will copy, modify, and run them. They need a tabbed code editor simulation with Monaco or CodeMirror, copy-to-clipboard per tab, a 'Download all files as .zip' button, and annotations on key lines.

**Verdict:** A capstone must make students feel capable, not just informed. The current capstone hands two code blocks and says 'go build it'. The platform can do better.

---

### Act 5 — Advanced Frameworks

Act 5 covers LangChain, LangGraph, LangSmith, and Vector Databases. It contains the best and worst visualisation density in the course — `Mod24.tsx` has three interactive components but one with crossing SVG paths, while `Mod25.tsx` describes LangSmith through ASCII art despite LangSmith's entire purpose being to make invisible things visible.

---

**Mod23.tsx — LangChain Ecosystem | Score: 5.5**

At 1791 lines, this is the longest single-file module in the cluster. It is also one of the most uniformly presented — 32 distinct code blocks, all formatted identically with no visual hierarchy between a foundational concept and an advanced production pattern.

`EmbedModelViz` uses hardcoded SVG pixel positions (`colX = [10, 175, 240, 325, 480]`) that clip entirely on any viewport narrower than 580px. The Self-hosted column becomes invisible at mobile widths. SVG has no reflow capability. Replace with a styled HTML table using the same Catppuccin tokens: alternating row fills, teal checkmark pills for Self-hosted: true, red pills for false.

The `LCELViz` truncates node labels to 10 characters — `output_par` instead of `output_parser`, `prompt_tem` instead of `prompt_template`. A student cannot read the component names that are central to understanding LCEL. This is the equivalent of a product label that cuts off the product name. Increase SVG viewBox height to 180px, use SVG `tspan` elements for two-line labels, set a minimum font size of 10px.

Every section beyond 22.2 should be collapsed by default. A student choosing to expand '22.7.3 Pinecone' has declared interest — reward that declaration with full detail. A student scanning the module should see structure, not a wall. An accordion pattern with Framer Motion height animation requires approximately 20 lines of React state and one CSS transition.

**Verdict:** The module is dressed like a textbook from 1998. Thirty-two code blocks stacked vertically without progressive disclosure is not a learning interface — it is a document.

---

**Mod24.tsx — LangGraph Concepts | Score: 6.5**

`GraphAnimator` has a fundamental layout problem: the `tool_call` node at `x=110` and the `respond` node at `x=350` are both accessed via conditional edges from `classify` at `x=230`. The SVG paths from `classify` to both destination nodes visually intersect in the centre of the diagram. This creates the appearance of a routing error rather than a branching design. Redesign as a top-down diamond: START at top centre, classify below it, then a horizontal split with tool_call and respond at the same level but with respond drawn below the split point on the right branch. The crossing paths must be eliminated — crossing lines in a diagram always communicate 'something is wrong here'.

`CheckpointingViz` is entirely static — it renders once and never responds to any user interaction despite the module's key concept being multi-turn state persistence. Add a 'Next Turn' button with states: `currentTurn (1/2/3)`, `activePhase ('running'/'saving'/'restored')`. On click: the Graph exec box pulses with a glow animation, then the Checkpoint box glows with a 💾 flash, then the dashed restore arrow animates. On Turn 3: the HITL box appears with a pause animation. A diagram without interaction cannot teach a concept about interaction.

The streaming modes table (section 23.7) presents four modes (`updates`, `values`, `messages`, `astream_events`) that represent a progressive capability ladder — each is a superset of the previous — but the table presents them as equals. Replace with a layered card stack: `updates` is the smallest card, `astream_events` is the largest, each card physically containing the previous. The nesting communicates the capability relationship that a flat table cannot.

**Verdict:** LangGraph Concepts has the right instinct — the dual-panel LCEL vs LangGraph comparison is genuinely elegant. The crossing SVG paths in `GraphAnimator` are a layout error that undermines the product's credibility. That single fix changes everything.

---

**Mod25.tsx — LangSmith Platform | Score: 5.0**

This module describes a tool whose entire purpose is making invisible things visible — traces, quality metrics, failure patterns — and then presents that tool's documentation through ASCII art and static quadrant diagrams. This is the most profound disconnect between subject matter and presentation in the entire course.

The ASCII trace in section 25.2 (the most important LangSmith concept — reading a trace tree) must become an interactive SVG trace tree. Each span is a coloured row: `safety_node` (2ms) is a 4px wide bar, `classify_node` (187ms) is a 374px bar. Clicking any row reveals the span details: `input_tokens`, `output_tokens`, `cost_usd`, and the full output JSON. This is how LangSmith actually works. This is what students need to be able to read.

The bad trace example in section 25.8 is the module's highest-value content and lowest-investment presentation: a worked failure example, formatted identically to a warning callout. Create a 'Bad Trace Inspector' component: two panels, left showing the trace tree with the `classify_node` highlighted in red (confidence: 0.51 — the failure), right showing the downstream consequence through the pipeline. A 'Show fix' button reveals the corrected routing logic.

`LangSmithCapabilitiesViz` is four coloured boxes. Replace it with the animated trace tree for the trace from section 25.2 — interactive, collapsible, with span details on click. The module should not describe LangSmith. It should simulate LangSmith.

**Verdict:** At Apple, the demo is the product. Every ASCII trace in this module should be an interactive tree. A student who finishes this module should feel like they have already used LangSmith, not like they have read about it.

---

**Mod26.tsx — Vector Databases | Score: 6.8**

`HnswIvfViz` shows the layered graph structure of HNSW but the traversal — the entire point of the diagram — is never animated. Add a `useState`-driven step animation triggered by a 'Play Search' button: entry at Layer 2 at a random node, traverse to nearest neighbour (yellow highlight), descent arrow to Layer 1, repeat, descent to Layer 0, final result circled in gold. A step counter shows 'Comparisons: 6 vs Brute force: 40'. The exponential saving is felt, not just read.

The decision framework in section 26.6 is rendered as a `pre` block with 20+ lines of box-drawing characters. This is a 1980s terminal approach inside a modern React application. Replace with a CSS grid of cards — each stack (ChromaDB, pgvector, Pinecone) is a card with colour-coded left border, maturity-axis badge, and a hover state that reveals the 'embedding lock-in' warning as a tooltip.

The embedding model comparison table should be a Recharts scatter plot: X-axis = cost per 1M tokens, Y-axis = MTEB recall score (known benchmarks), bubble size = embedding dimensions. Click a bubble to see deployment considerations. The tradeoff becomes spatial and intuitive.

**Verdict:** This module contains genuinely excellent written explanations. The visual layer hasn't kept pace. The HNSW diagram shows a graph and then does nothing with it — like displaying a car engine diagram without ever turning the key.

---

### Act 6 — Agent Systems & Architecture

Act 6 is the most technically ambitious Act and the most consistently under-visualised. Multi-agent architectures, MCP protocols, fine-tuning internals, community detection algorithms — all are spatial, dynamic concepts presented primarily through code blocks and comparison tables. The three exceptions — `McpArchViz`, `HarnessLayerViz`, and `HITLFlowViz` — demonstrate exactly what this Act needs more of.

---

**Mod33.tsx — Agent Architectures | Score: 7.4**

`ReactLoopViz` is the best interactive component in Act 6 — it animates node highlights in sequence, shows the actual trace text below, and has play/reset controls. It cannot be paused or stepped manually. A student who blinks during step 3 must wait for the full animation and restart. Add a 'Step →' button that advances exactly one frame. Add a `0.5×` speed option. These two additions convert a passive animation into an active learning tool.

The flowchart SVG at lines 343-403 references `url(#arr)` from line 350 onward but defines the `<defs><marker>` block at line 393 — after use. This causes arrow rendering failures in Safari and Firefox. This is the same SVG specification violation as in `Mod34.tsx` and `Mod40.tsx`. Move `<defs>` to immediately after the opening `<svg>` tag in all affected files.

`AgentMemoryViz` is a completely static taxonomy diagram. Make each memory row clickable: clicking 'In-context' shows a context window filling up token by token, clicking 'Episodic' shows a Redis key-value mock with past session summaries, clicking 'Semantic' shows a mini vector similarity animation. Three clicks, three entirely different mental models reinforced.

**Verdict:** The ReactLoopViz is the best component in Act 6. One 'Step →' button would transform it from a passive demo into an active tool.

---

**Mod34.tsx — Multi-Agent Systems | Score: 7.0**

`SupervisorArchViz` has all three worker nodes in identical `#94e2d5` teal — Search Worker, Filter Worker, and Response Worker are visually indistinguishable. For a multi-agent diagram whose purpose is to show specialisation, this is a fundamental rendering error. Give each worker a distinct accent colour: Search → `var(--colour-signal)` blue, Filter → `var(--colour-latency)` amber, Response → `var(--colour-live)` green. Match the arrow colours from Supervisor to each Worker.

The swimlane ASCII diagram at lines 146-172 is 27 lines of monochrome text representing the most complex concept in the module — the supervisor coordination sequence. Convert to an interactive animated SVG: each column (User, Supervisor, Research, Analyst, Writer) is a vertical lane with a coloured header. Messages animate as horizontal arrows between lanes. A 'Play' button runs the sequence. This is the `ReactLoopViz` pattern applied to multi-agent coordination.

`FanOutViz` has the right instinct — parallel bars with a max annotation — but it is completely static. Add three sliders for each worker's latency. When a slider changes, bar widths update and the 'max = Xms (bottleneck)' annotation updates. Show both sequential total (sum) and parallel total (max) updating live. The student discovers the bottleneck by moving the sliders — the learning is theirs.

**Verdict:** The content understands multi-agent architecture. The presentation treats it as prose. The swimlane diagram is 27 lines of ASCII art representing the most complex concept in the module.

---

**Mod40.tsx — Model Context Protocol | Score: 7.6**

`McpArchViz` is conceptually correct and spatially elegant — three columns, request flows right, response flows left, animated dashes communicate liveness. This is the right design for a protocol diagram. The USB-C analogy manifests as a visual connection being established. Protect this component and use it as the template for all protocol diagrams.

`McpComparisonViz` line 108 contains a colour logic bug: the Direct API best-for cell uses `fill={isBestFor ? '#94e2d522' : '#313244'}` — a copy-paste error from the LangGraph cell. The Direct API cell should use `#fab38722` (its own accent colour `#fab387`) but instead shows teal. This is a one-character fix. A colour bug in a teaching tool is never a minor issue — it tells students that someone stopped caring before the component was finished.

`DIAGRAM_1` at lines 118-138 is 18 lines of ASCII showing the host/protocol/server decomposition. Convert to an interactive SVG where each box is clickable: clicking 'MCP Client A (stdio)' expands a tooltip explaining stdio transport security, clicking 'MCP Server A' expands a code preview of the FastMCP implementation.

**Verdict:** `McpArchViz` is the best architecture diagram in Act 6. The colour bug on the comparison table must be fixed before any student sees it.

---

**ModHarness.tsx — Agent Harnesses | Score: 7.9**

`HarnessLayerViz` is the most conceptually ambitious component in the entire course — concentric rings as nested architectural concerns is the correct spatial metaphor. When it works, it teaches the 5-layer model in a single glance.

It has a critical click-target failure: the outer rings (larger `div` elements) sit on top of inner rings in DOM order but lack `pointer-events: none` on their interior areas. The entire area of the outer ring intercepts clicks, including the area that visually appears to be an inner ring. Students trying to click 'Context & Knowledge' (innermost) frequently trigger the outer ring handler instead. Fix with CSS: each ring should use `border` only (not `background`), with `pointer-events` targeting only the ring band itself, not the interior. Alternatively, implement as SVG donut sectors with precisely defined hit areas.

The 134-line `CODE_PRODUCTION_HARNESS` is the longest code block in Act 6 — a single undifferentiated wall of Python covering four distinct logical sections (permission gate, tool execution, context compaction, main loop). Split at the four seams, each with a bold section header matching the `LAYERS` constant labels: '① Permission Gate', '② Tool Execution', '③ Context Compaction', '④ Main Harness Loop'.

The Ratchet Principle section is the one idea in this module that is genuinely novel — the insight that every agent failure should produce a harness update. Build the ratchet visualisation: a gear SVG with teeth, each incident adding a tooth, a counter showing 'Rules added: 0' that increments when a student clicks 'Simulate incident'. Each click adds a blocked pattern chip. The gear turns one notch. The metaphor becomes physical.

**Verdict:** The `HarnessLayerViz` is a great idea with a broken click target. One CSS fix turns a frustrating interaction into a delightful one.

---

**Mod19.tsx — AI System Design Interviews | Score: 4.5**

Decision trees rendered as raw string literals with literal `\n` characters and escaped box-drawing characters. Gotcha cards with `›` chevrons that imply collapsible behaviour but are permanently expanded — non-functional decoration that is worse than having no chevron. Eight tables with identical styling across the module. This is the capstone interview preparation module for the entire course, and it has the visual ambition of a copied text file.

The 30-minute interview structure is the organising framework for everything that follows. It must become a horizontal timeline — six numbered circles connected by a line, each labelled with step name and time, hoverable for detail, serving as the module's mini-navigation. This is the first thing a student sees and it must immediately orient them.

The L6 formula section — the 'Weak phrasing → L6 phrasing' comparison — is the most reusable content in the module. It deserves a hero treatment: split cards, left half with weak phrase crossed out in `#f38ba8` with `text-decoration: line-through`, right half with L6 phrase in `#a6e3a1`. Title: 'Upgrade Your Vocabulary'. This is a poster, not a table row.

**Verdict:** This module contains a six-step framework that could change a student's career trajectory. It presents it with the visual ambition of a 1998 HTML table. The decision trees must become interactive. The gotcha cards must have working toggles. There are no exceptions.

---

## Visualization Improvement Roadmap

### Tier 1 — Quick Wins (CSS and SVG, no new libraries, ≤2 hours each)

**1. SVG `<defs>` position fix across all modules.** `Mod33.tsx`, `Mod34.tsx`, `Mod40.tsx`, and several others define SVG markers after the elements that reference them. Move `<defs>` blocks to immediately after the opening `<svg>` tag. Fixes arrow rendering in Safari and Firefox. No design work required.

**2. `GotchaCard` accordion transition (`Mod14.tsx`).** Two CSS additions: `max-height` transition from 0 to `600px` and chevron `transform: rotate(90deg)` on `.open`. No JavaScript changes. Every accordion becomes quality.

**3. `StateMachineComparisonViz` stagger delay (`Mod24.tsx`).** Add `animation-delay: 0.1s * i` to each dotted line in the comparison. Make each `1:1` label clickable. Total: 8 lines of CSS, 5 lines of JSX.

**4. `SeverityMatrix` hover states (`Mod14.tsx`).** Add `onMouseEnter` to scale circles to `r=11`, show a popover card with gotcha title and category. `onClick` scrolls to corresponding `GotchaCard`. Total: 20 lines of React.

**5. `complete-btn` CTA inversion (global).** Swap default and done states. Default: `background: var(--colour-live); color: #000`. Done: `background: var(--bg3); color: var(--colour-live)`. This is a four-line CSS change with an outsized impact on every module's completion experience.

**6. Scroll-triggered reveal animations (global).** Add `.reveal` class: `opacity: 0; transform: translateY(40px); transition: opacity 0.5s ease, transform 0.5s ease`. Add `.reveal.visible`: `opacity: 1; transform: translateY(0)`. Wire via `IntersectionObserver` in a single shared hook. Apply to every `.callout`, `.diagram-wrap`, `.two-col`, `.mental-grid`. Twenty lines of JavaScript, one CSS class, platform-wide improvement.

**7. `PipelineFlowViz` node count accuracy (`Mod2.tsx`).** Change `PIPELINE_STAGES` to 19 nodes using a two-row SVG layout, or change the title to reflect the 7 stages actually shown. Trust is built through accuracy.

### Tier 2 — Medium Effort (React with D3.js or Recharts, 2-8 hours each)

**1. Interactive `StatSigViz` (`Mod7.tsx`).** Two sliders (MDE and N), animated bell curves using D3 Gaussian path calculation, overlap region colour transition, days-to-significance counter. D3.js + Framer Motion. The most impactful single interaction improvement in Act 3.

**2. `HydeViz` animation (`Mod38.tsx`).** Sequential animation of direct query vector (dejected landing, 'far' from corpus) followed by HyDE flow (LLM glows, text types, green circle snaps 'near'). Framer Motion path animation. 4 hours. Transforms a static diagram into the pedagogical centrepiece it should be.

**3. Interactive LangSmith trace tree (`Mod25.tsx`).** D3.js collapsible tree from the trace in section 25.2. Span width proportional to duration on a log scale. Click any node to reveal span details. This replaces the ASCII trace and is the module's core interaction.

**4. `ChunkingViz` character highlighting (`Mod28.tsx`).** Add character-level highlight overlay on the input text pane, alternating background colours matching chunk pill colours, redrawn with Framer Motion layout animation on mode switch. The word 'lakh' split across chunk boundaries becomes visible, not inferred.

**5. `DAUCalcViz` pinnable comparisons (`Mod11.tsx`).** Add a 'Pin comparison' button that saves current DAU metrics to a comparison row. Students can compare 100K vs 1M by dragging and pinning. Connects the interactive slider to the static table by making them one unified tool.

**6. `DegradationMapViz` failure simulator (`Mod8.tsx`).** Four toggle switches for LLM, Redis, Housing API, Kafka. State machine drives degradation level transitions with CSS background-color transitions. Disabling both LLM and Redis triggers a red pulse on the level badge. React state machine, no new libraries.

**7. `RAGAS gauge` failing scenario preset (`Mod44.tsx`).** Add a 'Failing System' button that animates gauges to below-threshold values `(0.31, 0.45, 0.52, 0.28)`. Add threshold tick marks at 0.60 and 0.90 on each gauge arc. The student sees a passing system vs a failing system in two clicks.

### Tier 3 — High Impact (Framer Motion, Three.js, or complex D3.js, 8-40 hours each)

**1. Tenant Isolation Simulator (`Mod10.tsx`).** Two-panel Redis keyspace visualiser with a 'Bug mode' toggle. Framer Motion `AnimatePresence` for key rows appearing and disappearing. The data contamination event — watching Tenant A's session disappear when Tenant B writes — is worth 40 hours of development. This is the most consequential missing visualisation in the platform.

**2. HNSW search path animation (`Mod26.tsx`).** D3.js force-directed graph with `useState`-driven step animation. Entry at Layer 2, greedy descent through layers, final result circled in gold. Step counter showing 'Comparisons: 6 vs Brute force: 40'. The algorithm becomes observable behaviour rather than described procedure.

**3. HarnessLayerViz click-target fix + expand (`ModHarness.tsx`).** Rebuild as SVG donut sectors with precisely defined hit areas per ring. On hover, ring expands from `height 46px` to `80px` (Framer Motion layout animation) revealing two bullet points. The 5-layer model teaches itself through spatial exploration.

**4. Knowledge Graph traversal (`Mod37.tsx`).** D3.js force-directed graph, 9 entity nodes, typed directed edges. On node click: non-adjacent edges fade to 10% opacity, connected edges animate outward, connected nodes pulse with a ring. A query input highlights the traversal path. You cannot teach graph traversal with a graph that doesn't traverse.

**5. Capstone acceptance criteria gauges (`ModCap4.tsx`).** Recharts `RadialBarChart` or custom SVG arcs for the four acceptance criteria. Student types their own RAGAS score, gauge animates from 0 to the entered value. Gauges below threshold pulse red. All four gauges turning green simultaneously is the capstone's victory moment. This is 40 hours of development and is worth every minute.

---

## Code Presentation Manifesto

Every code block on this platform is currently an anonymous wall of monospace text. This must change. Code blocks in an educational platform are not documentation — they are arguments. Each argument deserves a context, a focus, and an invitation to engage.

**Principle 1: Every code block has a title.** A header bar (`height: 32px`, `background: var(--bg)`, `border-bottom: 1px solid var(--border)`) with the filename or concept name on the left and a copy-to-clipboard button on the right. Not optional. Every block, every module.

**Principle 2: Language is always declared and always visible.** A pill badge in the top-left corner of every code block: Python in `var(--colour-signal)` blue, YAML in `var(--colour-latency)` amber, Bash in `var(--colour-live)` green, SQL in `var(--colour-intelligence)` purple, JSON in a muted grey. The badge communicates before reading begins.

**Principle 3: The key line is annotated.** Every code block has one line that matters more than all others. In `CODE_AUTH`, it is `user_id = token_data['sub']` with the comment `# from validated token, NOT from request body`. In `CODE_QUEUE_PATTERN`, it is `queue.put_nowait(frame)` with the comment `# non-blocking: never await inside an async generator`. These lines must be visually distinguished — a 3px `var(--colour-latency)` left-border strip on the line, a coloured comment in `#f9e2af`, a gutter icon that expands to a tooltip on hover. The student's eye must land on the one line that contains the lesson.

**Principle 4: Long blocks have progressive disclosure.** Any code block over 20 lines shows the first 10 lines with a gradient fade and a 'Show full implementation' toggle. The student who needs the full block expands it. The student who is scanning is not punished with 60 lines of Python.

**Principle 5: Contrast is visual, not textual.** When two code blocks show WRONG vs RIGHT patterns — `CODE_GATE_BUG` vs `CODE_GATE_FIX`, `CODE_CACHE_WRONG` vs `CODE_CACHE` — they must be side-by-side, not separated by 175 lines of module content. Left column: 4px `var(--colour-error)` top border, a `BROKEN` label badge. Right column: 4px `var(--colour-live)` top border, a `FIXED` label badge. The diff is always one viewport, never one scroll.

**Principle 6: ASCII art is not code.** Any `pre` block that contains box-drawing characters, `──►` arrows, or indented pseudo-code is not a code block. It is a diagram that has been denied its rightful form. Every ASCII diagram in this platform must become either an HTML component or an SVG. The `CODE_DECISION` block in `Mod47.tsx` (70 lines of pure Python comments describing a decision framework), the `PIPELINE_DIAGRAM` constant in `Mod38.tsx`, the decision trees in `Mod19.tsx` — none of these belong in a `pre` tag.

**Principle 7: Comments are prose, not decoration.** In `CODE_36_NUMERIC`, the comment `# this one line saves 90% of prompt cost on every call after the first` is more valuable than the surrounding code. Style it distinctly: `color: #f9e2af` (amber), `font-style: italic`. Separate it visually from the executable code. The comment is the lesson. Treat it that way.

---

## Library Recommendations

**Framer Motion** — install immediately, apply broadly. The platform uses CSS keyframes (`fadeIn`, `slideUp`, `pulse`) as its entire motion vocabulary. This is insufficient. Specific applications: `AnimatePresence` for quiz question transitions (mount/unmount with layout animation), `motion.div` with `whileTap={{ scale: 0.97 }}` on all MCQ options for tactile press feedback, `layout` prop on `GotchaCard` body to animate to actual content height rather than fixed `max-height: 600px`. The `GotchaCard` max-height animation is the most visible failure of the current CSS-only approach — short content animates through 520px of invisible space. Framer Motion measures actual height and animates to it.

**Lottie (lottie-react)** — one specific use case only: the `markComplete()` event. When a student completes a module, play a purposeful Lottie animation — a checkmark draw, a confetti burst, a particle fade. The static '✓ Completed' text achieves nothing emotionally. This is the highest-ROI animation moment in the platform. One animation file, one `useLottie` hook, lifetime emotional impact.

**Monaco Editor** — for all modules containing Python snippets with LLM calls, agent loops, or classifier code. Deploy in read-only mode with full Python syntax highlighting, minimap disabled, line numbers visible, and a 'Copy' button. For `Mod22.tsx` (Python for AI Engineering) and `Mod39.tsx` (LangGraph Code), deploy in editable mode within sandboxed components. Static code blocks for a 2026 AI engineering course are a category error.

**D3.js** — already available or installable. Specific applications: `Mod7.tsx` Gaussian bell curves for the `StatSigViz` sliders, `Mod26.tsx` HNSW traversal animation, `Mod37.tsx` knowledge graph traversal, `Mod47.tsx` community detection animation. D3 should not be used for anything that HTML+CSS can accomplish. It should be used for everything that requires data-driven geometry — path calculation, force simulation, hierarchical layout.

**Recharts** — for all quantitative comparisons currently rendered as static tables. The FAANG stack comparison in `Mod35.tsx`, the embedding model comparison in `Mod26.tsx`, the RAGAS score trends in `Mod44.tsx` and `Mod45.tsx`, the cost comparison in `Mod1.tsx`. Recharts integrates cleanly with React state and has sufficient animation support via its internal `Animate` wrapper for bar and line charts.

---

## The 10 Non-Negotiables

These ten things must be corrected before this course can claim professional quality. They are not aspirational improvements — they are failures of execution that a quality-conscious team would not ship.

**1. The Catppuccin Mocha parallel design system.** Two colour systems on one page is not an inconsistency — it is a contradiction. Unify under the root variables. No exceptions, no timeline extensions.

**2. The 8px and 9px font sizes in the sidebar.** `.cluster-header` at 8px and `.act-header` at 9px fail WCAG AA contrast. These are compliance failures. Fix them in the same commit.

**3. The broken `ThreeQuestionViz` in `Mod0.tsx`.** `strokeWidth=0` invisible lines and a floating 'No' label disconnected from any visible arrow. A production course that teaches people to build production systems cannot have a broken diagram in Module 0.

**4. The `PipelineFlowViz` claiming to show all 19 nodes while showing 7 (`Mod2.tsx`).** A mismatch between claim and implementation is a trust failure. Fix the count or fix the title.

**5. The Python syntax error in `CODE_SELF_RAG` (`Mod38.tsx`).** `\${query}` is JavaScript template literal syntax in a Python f-string. Code examples are contracts with students. A syntax error in a teaching tool violates that contract.

**6. SVG `<defs>` defined after use across multiple modules.** Safari and Firefox do not render arrows in these components. This is a cross-browser failure affecting every module where it occurs.

**7. The `complete-btn` that looks disabled by default.** The most important action a student takes after finishing a module looks inactive. Invert the visual states immediately.

**8. The `EvalCostPyramid` that is not a pyramid (`Mod18.tsx`).** The module's visual centrepiece announces that the implementation was never checked against the concept. Three equal-height rectangles stacked vertically is not a pyramid by any definition.

**9. The dead `useEffect` in `Mod17.tsx`** targeting an element that does not exist in the DOM. Dead code in a production educational platform is a quality signal. Remove it.

**10. The section numbering mismatches across Act 6.** `Mod29.tsx` uses `31.x`, `Mod30.tsx` uses `32.x`, `Mod31.tsx` uses `33.x`, continuing through the cluster. Students who consult their notes and reference a section number will be unable to find it. Renumber all sections to match their module identifiers in a single pass.

---

## The 3 Delights Worth Building Now

Three interactions that, if built well, would make a student lean toward the screen and say 'oh'. These are prioritised by impact (how many students encounter this concept) and feasibility (how achievable with current codebase).

**Delight 1: The Tenant Isolation Moment (`Mod10.tsx`)**

Build the Tenant Isolation Simulator with two panels (Tenant A, Tenant B), each with a session write form, a live Redis keyspace visualiser below showing coloured key-value rows. A 'Bug mode' toggle removes `tenant_id` from the key prefix. When Tenant B writes in bug mode, Tenant A's row flashes red and is replaced by Tenant B's entry using Framer Motion `AnimatePresence`. The data contamination event — watching a row you own disappear because someone else wrote to the same key — is designed to be slightly alarming. Every engineer who experiences this will remember, always, to namespace their keys. This is not a visualisation. It is a lesson delivered through consequence.

Implementation: React `useState` for keyspace rows, Framer Motion `AnimatePresence` for row transitions, two form inputs with submit handlers, one CSS toggle for bug/normal mode. Approximately 120 lines of TSX, no additional libraries. Estimated effort: 6 hours including polish.

**Delight 2: The Statistical Significance Slider (`Mod7.tsx`)**

Two D3.js Gaussian bell curves (control and treatment distributions), animated with Framer Motion spring transitions as the student drags an MDE slider (0.01 to 0.10) and a sample size slider (100 to 5000). As N increases, the curves narrow and separate — the overlap region (rendered as a shaded area between the curves) shrinks and its colour transitions from red to amber to green. A 'days to significance' counter in a large monospace font updates in real time. When the student drags MDE from 0.10 to 0.01 and watches the day counter jump from 2 to 48, they feel the inverse-square relationship between effect size and sample size in a way that no equation has ever communicated.

Implementation: D3.js for Gaussian path computation (`d3.area` with normal distribution function), Framer Motion `animate` prop on the SVG path `d` attribute for smooth curve morphing, React `useState` for slider values. Approximately 200 lines of TSX. Estimated effort: 8 hours.

**Delight 3: The Capstone Victory Gauges (`ModCap4.tsx`)**

Four circular progress arc components (custom SVG, not library-dependent) for the four RAGAS acceptance criteria: `faithfulness ≥ 0.80`, `context_precision ≥ 0.75`, `answer_relevancy ≥ 0.78`, `p95 < 200ms`. Each gauge has a gold tick mark at the threshold position, an animated arc from 0 to the entered value (triggered by the student typing their score into an input field), and a colour transition from red through amber to green as the arc passes the threshold. A 'CI Gate Status' indicator below all four gauges shows a green 'PASS — PR would merge' badge when all four inputs are above threshold, or a red 'FAIL — PR blocked' badge with the specific failing metric labelled.

The moment all four gauges simultaneously reach green and the CI Gate turns green is designed with one emotional purpose: to make the student feel that they have earned something real. Because they have.

Implementation: custom SVG arcs using `d3.arc` path generation or pure SVG path calculation, Framer Motion `animate` on arc path interpolation, React `useState` for input values and gate state. Approximately 150 lines of TSX. Estimated effort: 8 hours.

---

*These are not suggestions. They are the specification for the platform this course is attempting to become. The content is excellent — precise, technically correct, grounded in real production experience. The presentation is functional. The gap between those two things is exactly the distance between a course students complete and a course students remember.*
