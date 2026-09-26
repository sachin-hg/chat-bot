import { useState } from 'react';
import { QuizSection } from "../components/QuizSection";
import { CodeBlock, CodeDiff } from '../components/CodeBlock';

// ── VIZ 3: LCEL vs LangGraph ────────────────────────────────────────────────
function LCELvsLangGraph() {
  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>WHY LANGGRAPH — LCEL CANNOT EXPRESS TOOL-USE LOOPS</div>
      <svg viewBox="0 0 560 160" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="LCEL vs LangGraph comparison diagram">
        <style>{`@keyframes dashFlow24a{to{stroke-dashoffset:-14}}`}</style>
        {/* Left panel — LCEL */}
        <rect x="4" y="4" width="260" height="152" rx="6" fill="#1e1e2e" stroke="#313244" strokeWidth="1"/>
        <text x="134" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6c7086" letterSpacing="1">LCEL: Chains (Linear)</text>
        {/* LCEL nodes */}
        {[['A','Prompt',40],['B','LLM',110],['C','Parser',180],['D','Output',250]].map(([id,label,cx])=>(
          <g key={String(id)}>
            <rect x={Number(cx)-28} y="50" width="56" height="28" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1"/>
            <text x={Number(cx)} y="69" textAnchor="middle" fontSize="11" fill="#cdd6f4">{String(label)}</text>
          </g>
        ))}
        {/* LCEL arrows */}
        <defs>
          <marker id="arrowLCEL" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#45475a"/></marker>
          <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f38ba8"/></marker>
          <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
          <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
        </defs>
        <line x1="68" y1="64" x2="82" y2="64" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#arrowLCEL)"/>
        <line x1="138" y1="64" x2="152" y2="64" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#arrowLCEL)"/>
        <line x1="208" y1="64" x2="222" y2="64" stroke="#45475a" strokeWidth="1.5" markerEnd="url(#arrowLCEL)"/>
        {/* Red X back-edge attempt */}
        <path d="M278,64 Q290,64 290,90 Q290,115 134,115 Q40,115 40,95 Q40,78 12,78" stroke="#f38ba8" strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerEnd="url(#arrowRed)"/>
        <text x="134" y="134" textAnchor="middle" fontSize="10" fill="#f38ba8">No cycles possible</text>
        {/* Red X symbol */}
        <text x="120" y="111" fontSize="14" fill="#f38ba8" fontWeight="700">✗</text>

        {/* Right panel — LangGraph */}
        <rect x="296" y="4" width="260" height="152" rx="6" fill="#1e1e2e" stroke="#313244" strokeWidth="1"/>
        <text x="426" y="22" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6c7086" letterSpacing="1">LangGraph: Graphs (Cyclic)</text>
        {/* LangGraph nodes */}
        {[['A','LLM',326],['B','Route',396],['C','Tool',466],['D','End',536]].map(([id,label,cx])=>(
          <g key={String(id)+'r'}>
            <rect x={Number(cx)-26} y="50" width="52" height="28" rx="6" fill="#313244" stroke="#45475a" strokeWidth="1"/>
            <text x={Number(cx)} y="69" textAnchor="middle" fontSize="11" fill="#cdd6f4">{String(label)}</text>
          </g>
        ))}
        {/* LangGraph arrows */}
        <line x1="352" y1="64" x2="370" y2="64" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
        <line x1="422" y1="64" x2="440" y2="64" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
        <line x1="492" y1="64" x2="510" y2="64" stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#arrowBlue)"/>
        {/* Green cycle back-edge */}
        <path d="M492,78 Q492,115 396,115 Q326,115 326,78" stroke="#a6e3a1" strokeWidth="1.5" fill="none" strokeDasharray="4 3" style={{animation:'dashFlow24a 1s linear infinite'}} markerEnd="url(#arrowGreen)"/>
        <text x="409" y="131" textAnchor="middle" fontSize="10" fill="#a6e3a1">Cycles allowed — tool-use loops</text>
        {/* Green checkmark */}
        <text x="396" y="112" textAnchor="middle" fontSize="13" fill="#a6e3a1" fontWeight="700">✓</text>
      </svg>
    </div>
  );
}

// ── VIZ 1: StateGraph Animator (FIX 1: top-down diamond, no crossing paths) ──
function GraphAnimator() {
  const [path, setPath] = useState<'property_search'|'general_query'>('property_search');
  const [active, setActive] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const PATHS: Record<string, string[]> = {
    property_search: ['START','classify','tool_call','END'],
    general_query:   ['START','classify','respond','END'],
  };

  function run() {
    if (running) return;
    setRunning(true);
    setActive([]);
    const steps = PATHS[path];
    steps.forEach((node, i) => {
      setTimeout(() => {
        setActive(prev => [...prev, node]);
        if (i === steps.length - 1) setRunning(false);
      }, i * 650);
    });
  }

  const isActive = (n: string) => active.includes(n);

  const nodeStyle = (n: string) => ({
    fill: isActive(n) ? '#89b4fa22' : '#313244',
    stroke: isActive(n) ? '#89b4fa' : '#45475a',
  });

  const currentState = active.length > 0
    ? `{ intent: '${path}', active_node: '${active[active.length-1]}', route: '${path === 'property_search' ? 'tool_call' : 'respond'}' }`
    : '{ waiting... }';

  // Diamond layout — top-down, NO crossing paths
  // START        cx=220, cy=30  (top-center)
  // classify     cx=220, cy=100 (center)
  // tool_call    cx=100, cy=185 (left branch)
  // respond      cx=340, cy=185 (right branch)
  // END          cx=220, cy=270 (bottom-center)
  //
  // Connectors:
  //   START → classify:    straight down M220,48 L220,96
  //   classify → tool_call: L-path: M220,118 L220,145 L100,145 L100,181   (down then left then down)
  //   classify → respond:   L-path: M220,118 L220,145 L340,145 L340,181   (down then right then down)
  //   tool_call → END:      L-path: M100,203 L100,255 L220,255 L220,266   (down then right then down)
  //   respond → END:        L-path: M340,203 L340,255 L220,255 L220,266   (down then left then down)

  const toolActive   = path === 'property_search';
  const respondActive = path === 'general_query';

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>LANGGRAPH STATEGRAPH — ANIMATED NODE EXECUTION FLOW</div>
      <div style={{marginBottom:'12px',display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
        <span style={{color:'#bac2de',fontSize:'0.82rem'}}>Path:</span>
        {(['property_search','general_query'] as const).map(p=>(
          <label key={p} style={{color: path===p ? '#89b4fa' : '#bac2de', fontSize:'0.82rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>
            <input type="radio" name="path24" value={p} checked={path===p} onChange={()=>{setPath(p);setActive([]);}} style={{accentColor:'#89b4fa'}}/>
            {p}
          </label>
        ))}
        <button onClick={run} disabled={running} style={{background: running ? '#45475a' : '#313244',color: running ? '#6c7086' : '#cdd6f4',border:'1px solid #45475a',borderRadius:'6px',padding:'5px 12px',fontSize:'0.78rem',cursor: running ? 'not-allowed' : 'pointer',marginRight:'8px'}}>
          {running ? 'Running…' : 'Run'}
        </button>
      </div>
      <svg viewBox="0 0 440 310" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="LangGraph StateGraph animated execution flow — diamond layout">
        <defs>
          <marker id="ar24main" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#45475a"/></marker>
          <marker id="ar24act" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="ar24tool" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a6e3a1"/></marker>
          <marker id="ar24gen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
        </defs>

        {/* ── START (top-center) cx=220, cy=30 ── */}
        <rect x="170" y="12" width="100" height="36" rx="6"
          fill={nodeStyle('START').fill} stroke={nodeStyle('START').stroke}
          strokeWidth={isActive('START')?2:1}/>
        <text x="220" y="35" textAnchor="middle" fontSize="12"
          fill={isActive('START') ? '#89b4fa' : '#cdd6f4'}>START</text>

        {/* Arrow: START → classify (straight down) */}
        <path d="M 220,48 L 220,96"
          stroke={isActive('classify') ? '#89b4fa' : '#45475a'}
          strokeWidth="1.5" fill="none"
          markerEnd={isActive('classify') ? 'url(#ar24act)' : 'url(#ar24main)'}/>

        {/* ── classify (center) cx=220, cy=100 ── */}
        <rect x="170" y="96" width="100" height="36" rx="6"
          fill={nodeStyle('classify').fill} stroke={nodeStyle('classify').stroke}
          strokeWidth={isActive('classify')?2:1}/>
        <text x="220" y="119" textAnchor="middle" fontSize="12"
          fill={isActive('classify') ? '#89b4fa' : '#cdd6f4'}>classify</text>

        {/* Arrow: classify → tool_call — L-path: down to y=152, left to x=100, down to node */}
        <path d="M 220,132 L 220,152 L 100,152 L 100,181"
          stroke={toolActive ? (isActive('tool_call') ? '#a6e3a1' : '#45475a') : '#31324455'}
          strokeWidth="1.5" fill="none"
          markerEnd={toolActive && isActive('tool_call') ? 'url(#ar24tool)' : 'url(#ar24main)'}/>
        <text x="152" y="148" textAnchor="middle" fontSize="9"
          fill={toolActive ? (isActive('tool_call') ? '#a6e3a1' : '#6c7086') : '#45475a33'}>property_search</text>

        {/* Arrow: classify → respond — L-path: down to y=152, right to x=340, down to node */}
        <path d="M 220,132 L 220,152 L 340,152 L 340,181"
          stroke={respondActive ? (isActive('respond') ? '#f9e2af' : '#45475a') : '#31324455'}
          strokeWidth="1.5" fill="none"
          markerEnd={respondActive && isActive('respond') ? 'url(#ar24gen)' : 'url(#ar24main)'}/>
        <text x="288" y="148" textAnchor="middle" fontSize="9"
          fill={respondActive ? (isActive('respond') ? '#f9e2af' : '#6c7086') : '#45475a33'}>general</text>

        {/* ── tool_call (left branch) cx=100, cy=185 ── */}
        <rect x="40" y="181" width="120" height="36" rx="6"
          fill={toolActive ? nodeStyle('tool_call').fill : '#1e1e2e'}
          stroke={toolActive ? nodeStyle('tool_call').stroke : '#31324488'}
          strokeWidth={isActive('tool_call')?2:1} opacity={toolActive ? 1 : 0.4}/>
        <text x="100" y="204" textAnchor="middle" fontSize="12"
          fill={isActive('tool_call') ? '#a6e3a1' : (toolActive ? '#cdd6f4' : '#45475a')}>tool_call</text>

        {/* Arrow: tool_call → END — L-path: down to y=256, right to x=220, down to node */}
        <path d="M 100,217 L 100,256 L 220,256 L 220,266"
          stroke={toolActive ? (isActive('END') ? '#89b4fa' : '#45475a') : '#31324455'}
          strokeWidth="1.5" fill="none"
          markerEnd={toolActive && isActive('END') ? 'url(#ar24act)' : 'url(#ar24main)'}/>

        {/* ── respond (right branch) cx=340, cy=185 ── */}
        <rect x="280" y="181" width="120" height="36" rx="6"
          fill={respondActive ? nodeStyle('respond').fill : '#1e1e2e'}
          stroke={respondActive ? nodeStyle('respond').stroke : '#31324488'}
          strokeWidth={isActive('respond')?2:1} opacity={respondActive ? 1 : 0.4}/>
        <text x="340" y="204" textAnchor="middle" fontSize="12"
          fill={isActive('respond') ? '#f9e2af' : (respondActive ? '#cdd6f4' : '#45475a')}>respond</text>

        {/* Arrow: respond → END — L-path: down to y=256, left to x=220, down to node */}
        <path d="M 340,217 L 340,256 L 220,256 L 220,266"
          stroke={respondActive ? (isActive('END') ? '#89b4fa' : '#45475a') : '#31324455'}
          strokeWidth="1.5" fill="none"
          markerEnd={respondActive && isActive('END') ? 'url(#ar24act)' : 'url(#ar24main)'}/>

        {/* ── END (bottom-center) cx=220, cy=270 ── */}
        <rect x="170" y="266" width="100" height="36" rx="6"
          fill={nodeStyle('END').fill} stroke={nodeStyle('END').stroke}
          strokeWidth={isActive('END')?2:1}/>
        <text x="220" y="289" textAnchor="middle" fontSize="12"
          fill={isActive('END') ? '#89b4fa' : '#cdd6f4'}>END</text>
      </svg>
      <div style={{marginTop:'10px',fontFamily:'monospace',fontSize:'0.78rem',color:'#a6e3a1',background:'#1e1e2e',border:'1px solid #313244',borderRadius:'6px',padding:'8px 12px'}}>
        Current state: {currentState}
      </div>
    </div>
  );
}

// ── VIZ 2: Checkpointing Multi-Turn (FIX 2: animated multi-turn state) ───────
const CP_TURNS = [
  { label:'Turn 1', note: 'User: "show 2BHK in Bandra"', checkpoint: true, hitl: false },
  { label:'Turn 2', note: 'User: "under ₹2Cr"', checkpoint: true, hitl: false },
  { label:'Turn 3', note: 'User: "book a viewing"', checkpoint: false, hitl: true },
];

function CheckpointingViz() {
  const [currentTurn, setCurrentTurn] = useState(1);
  const [activePhase, setActivePhase] = useState<'idle'|'running'|'saving'|'restored'>('idle');

  const isDisabled = activePhase !== 'idle';

  function nextTurn() {
    if (isDisabled) return;
    // Step 1 (0ms): running
    setActivePhase('running');
    // Step 2 (800ms): saving
    setTimeout(() => {
      setActivePhase('saving');
    }, 800);
    // Step 3 (1500ms): restored
    setTimeout(() => {
      setActivePhase('restored');
    }, 1500);
    // Step 4 (2200ms): advance turn, idle
    setTimeout(() => {
      setCurrentTurn(t => {
        if (t >= 3) return 1;
        return t + 1;
      });
      setActivePhase('idle');
    }, 2200);
  }

  const execGlow   = activePhase === 'running';
  const cpGlow     = activePhase === 'saving';
  const restoreAnim = activePhase === 'restored';
  const hitlVisible = currentTurn === 3;

  const turnLabel = `Turn ${currentTurn} of 3`;
  const afterTurn3 = currentTurn === 1 && activePhase === 'idle';  // reset sentinel not needed — we just wrap

  const phaseLabel =
    activePhase === 'running'  ? 'Graph executing…' :
    activePhase === 'saving'   ? '💾 Saving checkpoint…' :
    activePhase === 'restored' ? '✓ Checkpoint restored' :
    currentTurn === 3 && activePhase === 'idle' ? '⏸ Awaiting human approval (HITL)' : '';

  return (
    <div style={{background:'#181825',border:'1px solid #313244',borderRadius:'8px',padding:'20px',margin:'20px 0',overflow:'hidden'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'14px'}}>CHECKPOINTING — MULTI-TURN PERSISTENCE WITH LANGGRAPH</div>
      <style>{`
        @keyframes dashFlow24b{to{stroke-dashoffset:-14}}
        @keyframes cpGlow24{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes execPulse24{0%,100%{box-shadow:0 0 0 0 #89b4fa44}50%{box-shadow:0 0 0 8px #89b4fa22}}
        @keyframes restoreSlide24{from{stroke-dashoffset:48}to{stroke-dashoffset:0}}
      `}</style>

      {/* Turn counter */}
      <div style={{marginBottom:'10px',fontSize:'0.78rem',color:'#89b4fa',fontFamily:'monospace',fontWeight:700}}>
        {turnLabel} — {CP_TURNS[currentTurn-1].note}
      </div>

      <svg viewBox="0 0 560 220" width="100%" style={{display:'block',margin:'0 auto'}} aria-label="Checkpointing multi-turn persistence diagram">
        <defs>
          <marker id="ar24cp" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94e2d5"/></marker>
          <marker id="ar24cpb" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#89b4fa"/></marker>
          <marker id="ar24cpy" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f9e2af"/></marker>
        </defs>
        {CP_TURNS.map((t, i) => {
          const active     = currentTurn >= i+1;
          const isCurrent  = currentTurn === i+1;
          const y0         = 16 + i * 64;
          const rowExecGlow = isCurrent && execGlow;
          const rowCpGlow   = isCurrent && cpGlow;
          const restoreAnimate = (currentTurn > i+1) || (isCurrent && restoreAnim);
          const rowHitlGlow = isCurrent && (activePhase === 'running' || activePhase === 'saving');
          return (
            <g key={i}>
              <rect x="8" y={y0} width="544" height="52" rx="6"
                fill={active?'#1e1e2e22':'#1e1e2e'} stroke={isCurrent?'#89b4fa55':'#313244'} strokeWidth="1"/>
              <text x="28" y={y0+20} fontSize="10" fill={active?'#6c7086':'#45475a'}>{t.label}</text>
              {/* User msg */}
              <rect x="60" y={y0+13} width="80" height="26" rx="6" fill="#313244" stroke={active?'#6c7086':'#45475a'} opacity={active?1:0.4}/>
              <text x="100" y={y0+31} textAnchor="middle" fontSize="9" fill={active?'#bac2de':'#45475a'}>User msg</text>
              {active && <text x="100" y={y0+43} textAnchor="middle" fontSize="7" fill="#6c7086">{t.note.substring(7,28)}</text>}
              {/* Graph exec box — pulsing glow when running */}
              {active && <>
                <line x1="140" y1={y0+26} x2="162" y2={y0+26} stroke="#89b4fa" strokeWidth="1.5" markerEnd="url(#ar24cpb)"/>
                <rect x="162" y={y0+13} width="100" height="26" rx="6"
                  fill={rowExecGlow?'#89b4fa44':'#89b4fa22'} stroke={rowExecGlow?'#89b4fa':'#89b4fa88'}
                  strokeWidth={rowExecGlow?2:1}
                  style={{
                    filter: rowExecGlow ? 'drop-shadow(0 0 8px #89b4fa)' : 'none',
                    transition: 'filter 0.3s, stroke 0.3s',
                  }}/>
                <text x="212" y={y0+31} textAnchor="middle" fontSize="10" fill="#89b4fa">Graph exec</text>
              </>}
              {/* Checkpoint box — flash glow when saving */}
              {active && !t.hitl && <>
                <line x1="262" y1={y0+26} x2="284" y2={y0+26} stroke="#94e2d5" strokeWidth="1.5" markerEnd="url(#ar24cp)"/>
                <rect x="284" y={y0+13} width="110" height="26" rx="6"
                  fill={rowCpGlow?'#94e2d544':'#94e2d522'} stroke={rowCpGlow?'#94e2d5':'#94e2d588'}
                  strokeWidth={rowCpGlow?2:1}
                  style={{
                    filter: rowCpGlow ? 'drop-shadow(0 0 10px #94e2d5)' : 'none',
                    transition: 'filter 0.3s, stroke 0.3s',
                  }}/>
                <text x="316" y={y0+26} textAnchor="middle" fontSize="9" fill="#94e2d5">💾</text>
                <text x="340" y={y0+31} textAnchor="middle" fontSize="10" fill="#94e2d5">Checkpoint saved</text>
                {rowCpGlow && (
                  <text x="339" y={y0+50} textAnchor="middle" fontSize="9" fill="#94e2d5"
                    style={{animation:'cpGlow24 0.6s ease infinite'}}>💾 saving…</text>
                )}
              </>}
              {/* HITL box — visible on Turn 3 */}
              {active && t.hitl && (
                <>
                  <line x1="262" y1={y0+26} x2="284" y2={y0+26} stroke="#f9e2af" strokeWidth="1.5" markerEnd="url(#ar24cpy)"/>
                  <g style={{opacity: hitlVisible ? 1 : 0, transition:'opacity 0.5s ease'}}>
                    <rect x="284" y={y0+13} width="130" height="26" rx="6"
                      fill={rowHitlGlow?'#f9e2af33':'#f9e2af22'} stroke="#f9e2af"
                      style={{
                        filter: rowHitlGlow ? 'drop-shadow(0 0 8px #f9e2af88)' : 'none',
                        transition: 'filter 0.3s',
                        animation: (hitlVisible && activePhase === 'idle') ? 'cpGlow24 1.2s ease infinite' : 'none',
                      }}/>
                    <text x="349" y={y0+31} textAnchor="middle" fontSize="10" fill="#f9e2af">⏸ Human interrupt (HITL)</text>
                  </g>
                </>
              )}
              {/* Restore arrow to next turn — animates stroke-dashoffset when restored */}
              {active && !t.hitl && i < 2 && restoreAnimate && (
                <path d={`M339,${y0+39} Q339,${y0+60} 212,${y0+75}`} stroke="#94e2d5" strokeWidth="1.2" fill="none"
                  strokeDasharray="48" strokeDashoffset="0"
                  style={{
                    animation: (isCurrent && restoreAnim)
                      ? 'restoreSlide24 0.7s ease forwards'
                      : 'dashFlow24b 1s linear infinite',
                  }}
                  markerEnd="url(#ar24cp)"/>
              )}
            </g>
          );
        })}
        <rect x="8" y="196" width="12" height="10" rx="2" fill="#89b4fa22" stroke="#89b4fa"/>
        <text x="24" y="205" fontSize="9" fill="#89b4fa">Graph execution</text>
        <rect x="130" y="196" width="12" height="10" rx="2" fill="#94e2d522" stroke="#94e2d5"/>
        <text x="146" y="205" fontSize="9" fill="#94e2d5">Checkpoint</text>
        <rect x="228" y="196" width="12" height="10" rx="2" fill="#f9e2af22" stroke="#f9e2af"/>
        <text x="244" y="205" fontSize="9" fill="#f9e2af">HITL pause</text>
      </svg>

      {/* Next Turn button + phase label */}
      <div style={{marginTop:'14px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
        <button
          onClick={nextTurn}
          disabled={isDisabled}
          style={{
            background: isDisabled ? '#45475a' : '#313244',
            color: isDisabled ? '#6c7086' : '#cdd6f4',
            border:'1px solid #45475a',borderRadius:'6px',
            padding:'6px 16px',fontSize:'0.78rem',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition:'background 0.2s, border-color 0.2s',
          }}>
          &#x25B6; Next Turn
        </button>
        <span style={{fontSize:'0.78rem',color:'#6c7086',fontFamily:'monospace'}}>
          {phaseLabel}
        </span>
      </div>
    </div>
  );
}

// ── §23.1 ─────────────────────────────────────────────────────────────────
const CODE_LCEL_LIMIT = `from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage

llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

@tool
def search_properties(query: str) -> list:
    """Search property listings."""
    return property_db.search(query)

llm_with_tools = llm.bind_tools([search_properties])

# Without LangGraph — you write the loop yourself:
messages = [HumanMessage(content="Find 3BHK in Bandra under 2Cr")]
while True:
    response = llm_with_tools.invoke(messages)
    if not response.tool_calls:
        print(response.content)   # done
        break
    messages.append(response)
    for tc in response.tool_calls:
        result = search_properties.invoke(tc["args"])
        messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))

# This "works" — but you lose everything LangGraph provides:
# ✗ No checkpointing  → crash loses the conversation mid-loop
# ✗ No HITL           → can't pause before search fires
# ✗ No LangSmith      → no trace of which tools ran and why
# ✗ No streaming      → can't yield tokens while the loop runs
# ✗ No recursion limit → one bad tool call causes infinite loop + OOM
# ✗ No reusability    → copy-paste this loop in every endpoint`;

// ── §23.2 ─────────────────────────────────────────────────────────────────
const CODE_STATE_NODES = `from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # reducer: appends, not replaces
    #         ^^^^^^^^  Annotated[T, metadata] — Python attaches the reducer
    #         function as metadata to the type hint. At compile() time, LangGraph
    #         calls get_type_hints(AgentState, include_extras=True) to read it.
    classification: dict | None
    needs_clarification: bool

def classify_node(state: AgentState) -> dict:
    result = classifier.classify(state["messages"][-1].content)
    return {"classification": result, "needs_clarification": result["confidence"] < 0.6}

def route_after_classify(state: AgentState) -> str:
    return "clarify" if state["needs_clarification"] else "respond"

graph = StateGraph(AgentState)
graph.add_node("classify", classify_node)
graph.add_node("respond",  respond_node)
graph.add_node("clarify",  clarify_node)
graph.set_entry_point("classify")
graph.add_conditional_edges("classify", route_after_classify,
    {"clarify": "clarify", "respond": "respond"})
graph.add_edge("respond", END)
app = graph.compile()`;

// ── §23.3 ─────────────────────────────────────────────────────────────────
const CODE_LOOPS = `def route(state: AgentState) -> str:
    if state["attempts"] >= MAX_ATTEMPTS:
        return "fallback"       # always provide an exit
    if len(state["results"]) < 3:
        return "search_again"   # loop back
    return "respond"

graph.add_conditional_edges("evaluate", route,
    {"search_again": "search", "respond": "respond", "fallback": "fallback"})`;

const CODE_RECURSION_LIMIT = `from langgraph.errors import GraphRecursionError

# Compile with safety limit (default=25 — lower during dev to fail fast)
app = graph.compile(recursion_limit=10)

try:
    result = app.invoke(input, config=config)
except GraphRecursionError:
    return {"error": "Could not complete in the allowed steps — please rephrase"}`;

// ── §23.4 ─────────────────────────────────────────────────────────────────
const CODE_CHECKPOINTING = `from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# Development: in-memory (lost on restart)
app = graph.compile(checkpointer=MemorySaver())

# Production: SQLite (single-process) or PostgreSQL (multi-process)
with SqliteSaver.from_conn_string("checkpoints.db") as cp:
    app = graph.compile(checkpointer=cp)

# thread_id isolates each conversation
config = {"configurable": {"thread_id": "user_123_session_456"}}
app.invoke({"messages": [HumanMessage("2BHK in Bandra")]}, config=config)
# Next turn — LangGraph loads full prior state automatically
app.invoke({"messages": [HumanMessage("Under 2Cr")]}, config=config)`;

const CODE_STALE_FIX = `def classify_node(state: AgentState) -> dict:
    result = classifier.classify(state["messages"][-1].content)
    return {
        "classification": result,   # always write fresh — never carry old value
        "needs_clarification": result["confidence"] < 0.6,
    }`;

// ── §23.5 ─────────────────────────────────────────────────────────────────
const CODE_HITL = `# Pause BEFORE executing "execute_action" — action has NOT run yet
app = graph.compile(checkpointer=memory, interrupt_before=["execute_action"])

result = app.invoke(input, config=config)   # runs until interrupt

# Human reviews proposed action from state
pending  = app.get_state(config)
proposed = pending.values["proposed_action"]

from langgraph.types import Command

if human_approves(proposed):
    app.invoke(Command(resume=None), config=config)   # stable resume (LangGraph 0.2+)
else:
    app.invoke(
        Command(update={"messages": [HumanMessage("Action rejected.")]}),
        config=config,
    )`;

const CODE_HITL_SEQUENCE = `── HITL Sequence: 4 Actors, 2 HTTP Requests ─────────────────────────────────

   User Browser      FastAPI Server     LangGraph App    Checkpoint Store
        │                  │                  │                  │
        │──POST /chat──────►│                  │                  │
        │                  │──app.invoke()────►│                  │
        │                  │                  │──save state──────►│
        │                  │                  │──[INTERRUPT: execute_action]
        │                  │◄─{state, interrupt}                  │
        │◄──"Proposed: X"──│                  │                  │
        │                  │                  │                  │
  [human reads, decides]   │                  │                  │
        │                  │                  │                  │
        │──POST /approve───►│                  │                  │
        │                  │──app.invoke(Command(resume=None))───►│
        │                  │                  │◄─load state───────│
        │                  │                  │ [resumes at execute_action]
        │                  │                  │──save final state►│
        │                  │◄─{completed}─────│                  │
        │◄──final result───│                  │                  │

Key facts:
• Interrupt = serialise state to checkpoint → return from invoke() → server responds HTTP
• Resume   = second HTTP request → load checkpoint → continue from interrupt point
• State survives server restart iff using SqliteSaver/PostgresSaver (not MemorySaver)
• thread_id in config ties the two requests together`;

// ── §23.6 ─────────────────────────────────────────────────────────────────
const CODE_SUBGRAPHS_SIMPLE = `# Each specialist is a compiled subgraph with its own state
search_app = build_search_graph().compile()

def search_subgraph_node(state: AgentState) -> dict:
    result = search_app.invoke({
        "query":   state["messages"][-1].content,
        "filters": state["classification"],
    })
    return {"search_results": result["results"]}

parent_graph.add_node("search", search_subgraph_node)`;

const CODE_SUBGRAPH_BRIDGE = `from typing import TypedDict
from langgraph.graph import StateGraph, END

# ── Subgraph: completely isolated state schema ─────────────────────────────
class SearchState(TypedDict):
    query:   str
    filters: dict
    results: list[dict]

def execute_search(state: SearchState) -> dict:
    return {"results": property_db.search(state["query"], filters=state["filters"])}

search_graph = StateGraph(SearchState)
search_graph.add_node("search", execute_search)
search_graph.set_entry_point("search")
search_graph.add_edge("search", END)
search_app = search_graph.compile()

# ── Parent: bridge state at the call boundary ─────────────────────────────
class AgentState(TypedDict):
    messages:       list
    active_filters: dict
    search_results: list[dict]

def run_search_subgraph(state: AgentState) -> dict:
    # Map parent fields → subgraph input
    result = search_app.invoke({
        "query":   state["messages"][-1].content,
        "filters": state["active_filters"],
    })
    # Map subgraph output → parent state update
    return {"search_results": result["results"]}

parent = StateGraph(AgentState)
parent.add_node("search",  run_search_subgraph)
parent.add_node("respond", respond_node)
parent.set_entry_point("search")
parent.add_edge("search",  "respond")
parent.add_edge("respond", END)

# ── Native subgraph (LangGraph 0.2+) — when state schemas share keys ──────
# If SearchState and AgentState both have "query", LangGraph auto-maps it:
# parent.add_node("search", search_app)  # no wrapper node needed`;

// ── §23.7 streaming modes — FIX 3: layered nesting-doll card stack ────────

const STREAM_CODE: Record<string,string> = {
  updates: `# Mode: "updates" — partial dict of changed fields after each node
async for update in app.astream(input, config, stream_mode="updates"):
    node_name, changed = next(iter(update.items()))
    print(f"Node '{node_name}' updated: {list(changed.keys())}")
    # → Node 'classify' updated: ['classification', 'tier']
    # → Node 'respond'  updated: ['messages']`,

  values: `# Mode: "values" — full state snapshot after each node
async for state in app.astream(input, config, stream_mode="values"):
    print(state["messages"][-1].content)`,

  messages: `# Mode: "messages" — individual LLM tokens as they stream
async for chunk, metadata in app.astream(input, config, stream_mode="messages"):
    if chunk.content:
        print(chunk.content, end="", flush=True)
        # metadata["langgraph_node"] → which node produced this chunk`,

  astream_events: `# Mode: astream_events — everything: tokens + tool calls + node transitions
async for event in app.astream_events(input, config, version="v2"):
    match event["event"]:
        case "on_chat_model_stream":
            print(event["data"]["chunk"].content, end="", flush=True)
        case "on_tool_start":
            print(f"\\n→ {event['name']}({event['data']['input']})")
        case "on_tool_end":
            print(f"  ← {str(event['data']['output'])[:100]}")`,
};

type StreamMode = 'updates' | 'values' | 'messages' | 'astream_events';

const STREAM_CARDS: Array<{
  mode: StreamMode;
  label: string;
  desc: string;
  useCase: string;
  border: string;
  bg: string;
  labelColor: string;
}> = [
  {
    mode: 'astream_events',
    label: 'astream_events',
    desc: 'Yields all events with metadata.',
    useCase: 'Full observability — tokens, tool calls, node transitions in one stream.',
    border: 'var(--accent, #89b4fa)',
    bg: '#89b4fa08',
    labelColor: '#89b4fa',
  },
  {
    mode: 'messages',
    label: '"messages"',
    desc: 'Yields LLM token stream.',
    useCase: 'Streaming UI responses — real-time typing effect over SSE.',
    border: 'var(--accent5, #cba6f7)',
    bg: '#cba6f708',
    labelColor: '#cba6f7',
  },
  {
    mode: 'values',
    label: '"values"',
    desc: 'Yields full state after each node.',
    useCase: 'State snapshots — building UI that reflects current agent state.',
    border: 'var(--accent2, #a6e3a1)',
    bg: '#a6e3a108',
    labelColor: '#a6e3a1',
  },
  {
    mode: 'updates',
    label: '"updates"',
    desc: 'Yields node output diffs.',
    useCase: 'Incremental state patches — lightweight monitoring, debugging.',
    border: 'var(--muted, #45475a)',
    bg: '#45475a18',
    labelColor: '#bac2de',
  },
];

function StreamingModesCards() {
  const [expanded, setExpanded] = useState<Record<StreamMode, boolean>>({
    astream_events: false,
    messages: false,
    values: false,
    updates: false,
  });

  function toggle(mode: StreamMode) {
    setExpanded(prev => ({ ...prev, [mode]: !prev[mode] }));
  }

  // Render recursively: outermost first (astream_events wraps messages wraps values wraps updates)
  function renderCard(idx: number): React.ReactNode {
    if (idx >= STREAM_CARDS.length) return null;
    const card = STREAM_CARDS[idx];
    const isExpanded = expanded[card.mode];
    return (
      <div style={{
        border: `1.5px solid ${card.border}`,
        borderRadius: '8px',
        padding: idx === STREAM_CARDS.length - 1 ? '12px' : '16px',
        background: card.bg,
        position: 'relative',
      }}>
        {/* Card header — click to expand */}
        <div
          onClick={() => toggle(card.mode)}
          style={{cursor:'pointer',userSelect:'none',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px'}}
        >
          <div>
            <span style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.88rem',color:card.labelColor}}>{card.label}</span>
            <span style={{color:'#6c7086',fontSize:'0.78rem',marginLeft:'10px'}}>{card.desc}</span>
            <div style={{fontSize:'0.75rem',color:'#bac2de',marginTop:'3px'}}>
              <span style={{color:'#6c7086'}}>Use for: </span>{card.useCase}
            </div>
          </div>
          <span style={{fontSize:'0.72rem',color:'#6c7086',flexShrink:0,paddingTop:'2px'}}>{isExpanded ? '▲ hide' : '▼ code'}</span>
        </div>

        {/* Expanded code example */}
        {isExpanded && (
          <pre style={{
            marginTop:'12px',marginBottom:'10px',
            background:'#1e1e2e',color:'#cdd6f4',
            fontSize:'0.73rem',lineHeight:'1.55',
            padding:'10px 12px',borderRadius:'6px',
            overflowX:'auto',border:'1px solid #313244',
          }}>{STREAM_CODE[card.mode]}</pre>
        )}

        {/* Nested inner card — rendered inside this card */}
        {idx < STREAM_CARDS.length - 1 && (
          <div style={{marginTop:'12px'}}>
            {renderCard(idx + 1)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{margin:'16px 0'}}>
      <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#6c7086',marginBottom:'10px'}}>
        STREAMING MODES — each outer mode is a superset of the inner (click any card to see code)
      </div>
      {renderCard(0)}
    </div>
  );
}

const CODE_STREAMING_MODES = `# LangGraph has 4 streaming modes — pick based on what you need downstream

# Mode 1: "updates" — partial dict of changed fields after each node (most efficient)
async for update in app.astream(input, config, stream_mode="updates"):
    node_name, changed = next(iter(update.items()))
    print(f"Node '{node_name}' updated: {list(changed.keys())}")
    # → Node 'classify' updated: ['classification', 'tier']
    # → Node 'respond'  updated: ['messages']

# Mode 2: "values" — full state snapshot after each node (convenient but verbose)
async for state in app.astream(input, config, stream_mode="values"):
    print(state["messages"][-1].content)

# Mode 3: "messages" — individual LLM tokens as they stream (real-time typing UX)
async for chunk, metadata in app.astream(input, config, stream_mode="messages"):
    if chunk.content:
        print(chunk.content, end="", flush=True)
        # metadata["langgraph_node"] → which node produced this chunk

# Mode 4: astream_events — everything; tokens + tool calls + node transitions
async for event in app.astream_events(input, config, version="v2"):
    match event["event"]:
        case "on_chat_model_stream":
            print(event["data"]["chunk"].content, end="", flush=True)
        case "on_tool_start":
            print(f"\\n→ {event['name']}({event['data']['input']})")
        case "on_tool_end":
            print(f"  ← {str(event['data']['output'])[:100]}")

# ── Bridge to SSE (how Housing.com does it) ───────────────────────────────
async def stream_to_sse(app, input, config, queue: asyncio.Queue):
    async for chunk, meta in app.astream(input, config, stream_mode="messages"):
        if chunk.content:
            await queue.put({
                "type": "token",
                "data": chunk.content,
                "node": meta.get("langgraph_node"),
            })
    await queue.put({"type": "done"})`;

// ── §23.9 LangChain → LangGraph ───────────────────────────────────────────
const CODE_LCEL_AS_NODE = `from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-haiku-4-5-20251001")

# Step 1: build the LCEL chain as a standalone, testable unit
classify_chain = (
    ChatPromptTemplate.from_template(
        "Classify this query into intent and confidence (0–1). Return JSON.\\nQuery: {query}"
    )
    | llm
    | JsonOutputParser()
)
# Test the chain directly — no graph needed:
result = classify_chain.invoke({"query": "3BHK in Bandra"})
# {"intent": "property_search", "confidence": 0.95}

# Step 2: wrap it as a LangGraph node
def classify_node(state: AgentState) -> dict:
    result = classify_chain.invoke({"query": state["messages"][-1].content})
    return {"classification": result}

# Benefits of wrapping:
# → classify_chain is unit-testable in isolation (no graph setup needed)
# → LangSmith shows "classify_node" as a named unit in the trace
# → Swap the chain without touching graph topology`;

const CODE_LC_RETRIEVER_NODE = `from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

embeddings  = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.load_local("property_index", embeddings, allow_dangerous_deserialization=True)
retriever   = vectorstore.as_retriever(search_kwargs={"k": 5})

# LangChain retriever → LangGraph retrieval node
def retrieve_docs_node(state: AgentState) -> dict:
    query = state["messages"][-1].content
    docs  = retriever.invoke(query)          # standard LangChain retriever call
    return {"retrieved_docs": [d.page_content for d in docs]}

# The retriever is a plain LangChain object — it plugs directly into the node.
# No LangGraph-specific code inside the node except reading/writing state.

# Alternatively: use create_retriever_tool to make it a tool the LLM can call:
from langchain.tools.retriever import create_retriever_tool
rag_tool = create_retriever_tool(
    retriever=retriever,
    name="search_property_docs",
    description="Search RERA filings and locality guides. Use for factual property questions.",
)
# Now ToolNode can dispatch it just like any other @tool function`;

const CODE_LC_MEMORY_REPLACE = `# ── OLD: LangChain memory (process-local, no persistence) ────────────────
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain

memory = ConversationBufferWindowMemory(k=5)
chain  = ConversationChain(llm=llm, memory=memory)
chain.predict(input="Find 3BHK in Bandra")  # memory lives in 'memory' Python object

# Fails when:
# - Process restarts (memory wiped)
# - Second server instance (server B has no memory of server A's conversations)
# - Two simultaneous requests (race condition on memory.chat_memory.messages)

# ── NEW: LangGraph checkpointing (persistent, scalable) ───────────────────
from langgraph.checkpoint.sqlite import SqliteSaver

with SqliteSaver.from_conn_string("checkpoints.db") as cp:
    app = graph.compile(checkpointer=cp)

config = {"configurable": {"thread_id": "user_123"}}
app.invoke({"messages": [HumanMessage("Find 3BHK in Bandra")]}, config=config)
# State written to SQLite. Restart the process, turn 2 still works:
app.invoke({"messages": [HumanMessage("Under 2Cr")]}, config=config)

# Survives process restart: ✓  (SQLite file persists)
# Works across servers:     ✓  (use PostgresSaver — shared DB)
# No race conditions:       ✓  (DB-level write serialisation)
# Observable in LangSmith:  ✓  (every turn traced automatically)`;

// ── §23.10 Send() fan-out ─────────────────────────────────────────────────
const CODE_SEND_FANOUT = `from langgraph.types import Send
from typing import Annotated
import operator

# Send() = spawn N parallel node executions, each with independent input
# The canonical use case: search multiple data sources simultaneously

class ResearchState(TypedDict):
    original_query: str
    sub_queries:    list[str]
    all_results:    Annotated[list, operator.add]   # accumulates from all parallel runs
    final_answer:   str

# Step 1: plan node generates sub-queries
def plan_node(state: ResearchState) -> dict:
    return {"sub_queries": [
        f"{state['original_query']} Bandra West",
        f"{state['original_query']} Bandra East",
        f"{state['original_query']} sea facing premium",
    ]}

# Step 2: dispatch returns list[Send] — each spawns one "search" execution
def dispatch_searches(state: ResearchState) -> list[Send]:
    return [Send("search", {"query": q}) for q in state["sub_queries"]]
    # LangGraph runs all three "search" nodes concurrently

# Step 3: each search node runs independently
def search_node(state: dict) -> dict:
    results = property_db.search(state["query"], limit=3)
    return {"all_results": results}   # operator.add merges across parallel runs

# Step 4: respond after all searches complete
def respond_node(state: ResearchState) -> dict:
    merged = state["all_results"]     # all results from all parallel runs
    answer = llm.invoke(f"Summarise these property results: {merged}")
    return {"final_answer": answer.content}

graph = StateGraph(ResearchState)
graph.add_node("plan",    plan_node)
graph.add_node("search",  search_node)
graph.add_node("respond", respond_node)
graph.set_entry_point("plan")
graph.add_conditional_edges("plan", dispatch_searches)  # fan-out
graph.add_edge("search", "respond")                     # fan-in
graph.add_edge("respond", END)

# Wall-clock = slowest single search ≈ 0.5s (not 3 × 0.5s = 1.5s)`;

// ── §23.11 LangSmith ──────────────────────────────────────────────────────
const CODE_LANGSMITH = `import os

# ── Setup: 3 env vars, zero code changes ──────────────────────────────────
os.environ["LANGCHAIN_API_KEY"]     = "ls__your_key_here"
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"]     = "housing-agent-prod"

# Every app.invoke() is now automatically traced — no decorators, no callbacks needed.
# LangSmith captures:
#   Graph topology       visual DAG of nodes and edges, rendered in the UI
#   Node execution       name, inputs, outputs, latency per node
#   LLM calls            model, full prompt, completion, token count, USD cost
#   Tool calls           name, args JSON, result, latency
#   Routing decisions    which conditional edge was taken and why
#   Thread history       all turns for a given thread_id, browseable in UI

# ── Tag runs for A/B experiments ──────────────────────────────────────────
result = app.invoke(input, config={
    **config,
    "metadata": {
        "experiment": "haiku-v2-classifier",
        "user_tier":  "premium",
        "build_sha":  "abc123f",
    },
})
# Filter by metadata in LangSmith UI → compare latency + quality across variants

# ── Read traces programmatically ──────────────────────────────────────────
from langsmith import Client
client = Client()

runs = list(client.list_runs(
    project_name="housing-agent-prod",
    execution_order=1,                     # root runs only
    filter='eq(status, "error")',          # failed runs for debugging
    limit=50,
))
for run in runs:
    print(f"{run.id}: {run.total_tokens} tokens | error={run.error}")

# ── Build evaluation datasets from production traces ──────────────────────
client.create_example(
    inputs  ={"messages": [{"role":"user","content":"3BHK Bandra under 2Cr"}]},
    outputs ={"expected_intent": "property_search", "expected_tool": "search_properties"},
    dataset_name="housing-golden-set",
)
# Run automated eval: langsmith evaluate your_run_function --dataset housing-golden-set`;

// ── §23.12 Ecosystem ──────────────────────────────────────────────────────
const CODE_PREBUILT_REACT = `from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver

@tool
def search_properties(query: str) -> str:
    """Search property listings by natural language. Returns formatted results."""
    return str(property_db.search(query, limit=5))

@tool
def calculate_emi(principal_inr: int, rate_percent: float, years: int) -> str:
    """Calculate monthly EMI for a property loan."""
    r   = rate_percent / 100 / 12
    n   = years * 12
    emi = principal_inr * r * (1 + r)**n / ((1 + r)**n - 1)
    return f"Monthly EMI: ₹{emi:,.0f}"

llm   = ChatAnthropic(model="claude-haiku-4-5-20251001")
tools = [search_properties, calculate_emi]

# create_react_agent builds the full loop: llm → tools_condition → ToolNode → llm
agent = create_react_agent(
    model=llm,
    tools=tools,
    checkpointer=MemorySaver(),
    state_modifier="You are a helpful housing assistant for Mumbai real estate.",
)

config = {"configurable": {"thread_id": "demo_user"}}
result = agent.invoke(
    {"messages": [HumanMessage("Find 3BHK in Bandra and calculate EMI at 8.5% for 20yr")]},
    config=config,
)
# LLM calls search + calculate_emi in parallel → synthesises combined answer

# Use create_react_agent when:
#   + Tools are independent and well-described
#   + No custom state fields (just messages)
#   + No multi-node routing logic
# Use a custom StateGraph when:
#   - Custom state (active_filters, user_role, classification)
#   - Non-tool nodes (safety check, session load, intent classify)
#   - HITL on specific tools only
#   - Parallel fan-out with Send()`;

export function Mod24() {
  return (
    <>
      <div className="learning-obj">
        <div className="learning-obj-title">After this module you will be able to</div>
        <ol>
          <li>Explain exactly why LCEL chains cannot express tool-use loops — with code</li>
          <li>Define a StateGraph with TypedDict state, nodes, conditional edges, and compile it</li>
          <li>Add checkpointing for multi-turn persistence and implement human-in-the-loop interrupts</li>
          <li>Bridge subgraph state across parent/child graph boundaries</li>
          <li>Choose the right streaming mode for your downstream use case</li>
          <li>Map every LangChain abstraction (chain, retriever, memory, tool) to its LangGraph equivalent</li>
          <li>Use Send() for parallel fan-out and LangSmith for production observability</li>
        </ol>
        <div className="obj-meta">
          <span className="obj-time">⏱ ~100 minutes</span>
          <span className="obj-diff">Difficulty: ★★★★☆</span>
          <span className="obj-diff">Prerequisites: Module 4, Module 24</span>
        </div>
      </div>
      <div className="callout callout-info">
        <strong>Housing.com Context</strong><br />
        Housing.com's <code>graph.py</code> IS a LangGraph StateGraph. Every concept here — state, nodes, conditional edges, checkpointing — maps directly to production code you can read at <code>src/pipeline/graph.py</code>.
      </div>

      <LCELvsLangGraph />
      <h2>23.1 Why LangGraph Exists — The LCEL Limitation</h2>
      <p>LangChain LCEL chains are <strong>acyclic</strong> — data flows strictly one direction. This breaks for any agent that needs to call a tool, see the result, and decide what to do next.</p>
      <div className="diagram-wrap">
        <div className="diagram-title">Chain vs Graph execution model</div>
        <pre style={{margin: 0, border: "none", background: "transparent", fontSize: "12px"}}>{`LangChain LCEL:             LangGraph:
prompt | llm | parser       llm → tools_condition → ToolNode
(fixed, acyclic, one-shot)              ↑                  ↓
                                        └──────────────────┘
                                        loop until no tool_calls`}</pre>
      </div>
      <CodeBlock title="Manual Tool-Use Loop — What LCEL Cannot Replace" language="python" keyLine={13} keyNote="Loop LangGraph replaces — no safety, no checkpointing">{CODE_LCEL_LIMIT}</CodeBlock>
      <div className="callout callout-tip">
        <strong>LCEL vs LangGraph — the decision rule</strong>
        <table style={{fontSize: "12px", margin: "4px 0"}}>
          <tbody>
            <tr><th>Use LCEL if...</th><th>Use LangGraph if...</th></tr>
            <tr><td>Single linear pass, no branching</td><td>Any conditional routing</td></tr>
            <tr><td>No multi-turn state</td><td>Multi-turn persistence needed</td></tr>
            <tr><td>No loops</td><td>Agent needs to loop on tool results</td></tr>
            <tr><td>No human approval steps</td><td>Human-in-the-loop required</td></tr>
          </tbody>
        </table>
        <strong>Practical recommendation:</strong> start with LangGraph even for simple pipelines — the overhead is minimal and you avoid a full rewrite when requirements grow. LCEL chains remain valuable as nodes <em>inside</em> a LangGraph graph.<br /><br />
        <strong>Install:</strong> <code>pip install langgraph langchain-core langchain-anthropic</code>. LangGraph is a separate package from LangChain.
      </div>

      <GraphAnimator />
      <h2>23.2 State, Nodes, and Edges</h2>
      <p>Every LangGraph graph has a single typed state object — think of it as a <strong>Redux store</strong>. Every node reads from it and returns only the fields it changed. LangGraph merges that partial update into the full state, exactly like a Redux reducer returning <code>{"{ ...state, updatedField: newValue }"}</code>.</p>
      <CodeBlock title="StateGraph with TypedDict State and Conditional Edges" language="python" keyLine={4} keyNote="add_messages reducer appends — without it, history is overwritten">{CODE_STATE_NODES}</CodeBlock>
      <div className="callout callout-warn">
        <strong>The add_messages gotcha — the most common LangGraph mistake</strong>
        Without the <code>add_messages</code> reducer annotation, returning <code>{"{'messages': [new_msg]}"}</code> <em>replaces</em> the entire message list. With it, the new message is appended.<br /><br />
        <strong>Concrete failure:</strong> write <code>messages: list</code> instead of <code>{"messages: Annotated[list, add_messages]"}</code> → after turn 2, state has only the latest message — all history is gone. Debug symptom: the LLM responds as if it's always turn 1. Fix: print <code>{'len(state["messages"])'}</code> after each node — it should grow every turn.<br /><br />
        <strong>How LangGraph reads it:</strong> at <code>graph.compile()</code> time, LangGraph calls <code>{"get_type_hints(AgentState, include_extras=True)"}</code> and extracts the second argument of <code>Annotated</code> as the reducer. This happens once at compile time — zero runtime cost per message.
      </div>

      <h2>23.3 Cycles and Loops — Infinite Loop Prevention</h2>
      <CodeBlock title="Conditional Routing with Loop Exit — Attempts Counter" language="python" keyLine={2} keyNote="Hard exit prevents infinite loops on poor retrieval">{CODE_LOOPS}</CodeBlock>
      <p>Always add an <code>attempts</code> counter in state with a hard limit. Without it, a consistently poor retriever creates an infinite loop. LangGraph's compile-time <code>recursion_limit</code> is the backstop:</p>
      <div className="callout callout-tip">
        <strong>recursion_limit is the last line of defence</strong>
        <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "6px", borderRadius: "4px", marginTop: "4px"}}>{CODE_RECURSION_LIMIT}</pre>
        Dev: set <code>recursion_limit=5</code> to catch loops immediately. Production: 25 is safe for a 19-node pipeline with retries. A hit in production means a bug in your routing logic — don't just raise the limit.
      </div>

      <CheckpointingViz />
      <h2>23.4 Checkpointing — Multi-Turn Persistence</h2>
      <CodeBlock title="Checkpointing Setup — MemorySaver vs SqliteSaver" language="python" keyLine={7} keyNote="thread_id isolates each conversation — required for multi-turn">{CODE_CHECKPOINTING}</CodeBlock>
      <div className="callout callout-warn">
        <strong>Stale state trap — the most common multi-turn bug</strong>
        The checkpoint saves <strong>the entire AgentState dict</strong>. When turn 2 starts, <em>all fields from turn 1 persist</em> including <code>classification</code> from the previous intent.<br /><br />
        <strong>Failure:</strong> node A classifies turn 1 as "search_properties". Turn 2 starts — if node A is skipped or fails, the stale classification from turn 1 routes turn 2 incorrectly.<br /><br />
        <strong>Fix:</strong> nodes that own a field must always reset it:
        <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "6px", borderRadius: "4px", marginTop: "4px"}}>{CODE_STALE_FIX}</pre>
        Memory sizing: 50 turns × 200 tokens/turn ≈ 10 KB per checkpoint write. Add a <code>trim_history</code> node that slices <code>messages[-40:]</code> before each turn to cap growth.
      </div>
      <div className="callout callout-tip">
        <strong>This codebase vs LangGraph checkpointing</strong>
        <code>session_store.py</code> + Redis is a hand-rolled equivalent. The custom Redis implementation gives more control (per-field TTL, Lua CAS atomics) but requires maintenance. For new projects: <code>pip install langgraph-checkpoint-postgres</code> and use <code>AsyncPostgresSaver</code> — see Module 26 for the full production setup.
      </div>

      <h2>23.5 Human-in-the-Loop (HITL)</h2>
      <CodeBlock title="Human-in-the-Loop — interrupt_before and Command Resume" language="python" keyLine={5} keyNote="Command(resume=None) is the stable 0.2+ API for resuming">{CODE_HITL}</CodeBlock>
      <div className="callout callout-warn">
        <strong>invoke(None) vs Command(resume=None)</strong>
        Both resume a paused checkpoint, but <code>invoke(None)</code> behaviour is technically version-dependent. <code>Command(resume=...)</code> was introduced in LangGraph 0.2 as the explicit, stable API. Use <code>Command</code> in production.
      </div>
      <pre style={{fontSize: "11px", background: "#1e1e2e", color: "#cdd6f4", padding: "10px", borderRadius: "4px", margin: "8px 0", overflowX: "auto"}}>{CODE_HITL_SEQUENCE}</pre>
      <p><strong>When to use HITL:</strong> before deleting or modifying records, before sending external communications, before financial transactions, before any irreversible action.</p>

      <h2>23.6 Subgraphs — Composing Pipelines</h2>
      <p>Subgraphs enable independent development and testing of each specialist agent. Each subgraph has its own isolated TypedDict state — you bridge the two state schemas at the call boundary.</p>
      <CodeBlock title="Subgraph Node — Calling a Compiled Subgraph from Parent" language="python" keyLine={4} keyNote="Invoke compiled subgraph like any function — state bridged manually">{CODE_SUBGRAPHS_SIMPLE}</CodeBlock>
      <p>When the parent and subgraph have different state schemas (the common case), you must explicitly map fields at the call boundary:</p>
      <CodeBlock title="Subgraph State Bridge — Isolated Schemas with Explicit Mapping" language="python" keyLine={18} keyNote="Map parent fields to subgraph input at call boundary explicitly">{CODE_SUBGRAPH_BRIDGE}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Subgraph benefits</strong><br />
        Each subgraph can be: compiled and tested independently; versioned and deployed separately; replaced without touching the parent graph. Module 40 (multi-agent systems) uses this pattern to coordinate a planner, a search specialist, and a response writer as three separate compiled graphs.
      </div>

      <h2>23.7 Streaming — Four Modes</h2>
      <StreamingModesCards />
      <CodeBlock title="LangGraph Streaming — All Four Modes with SSE Bridge" language="python" keyLine={9} keyNote='"messages" mode yields individual tokens — enables real-time typing UX'>{CODE_STREAMING_MODES}</CodeBlock>

      <h2>23.8 This Codebase Mapped to LangGraph Concepts</h2>
      <table>
        <tbody>
          <tr><th>LangGraph concept</th><th>This codebase equivalent</th><th>File</th></tr>
          <tr><td><code>StateGraph</code></td><td><code>build_graph()</code> returning compiled graph</td><td><code>src/pipeline/graph.py</code></td></tr>
          <tr><td><code>TypedDict</code> state</td><td><code>BotState</code></td><td><code>src/pipeline/state.py</code></td></tr>
          <tr><td>Node function</td><td>Each <code>*_node</code> (safety, classify, fetch_data, …)</td><td><code>src/pipeline/nodes/*.py</code></td></tr>
          <tr><td>Conditional edge</td><td><code>route_by_tier()</code> + <code>add_conditional_edges()</code></td><td><code>src/pipeline/graph.py</code></td></tr>
          <tr><td>Checkpointing</td><td>Redis session store (hand-rolled equivalent)</td><td><code>src/session/store.py</code></td></tr>
          <tr><td><code>.astream(stream_mode="messages")</code></td><td><code>asyncio.Queue</code> + <code>queue.put_nowait(frame)</code></td><td><code>src/pipeline/nodes/response.py</code></td></tr>
          <tr><td>HITL interrupt</td><td>Not implemented (no approval flows needed)</td><td>n/a</td></tr>
          <tr><td>Send() fan-out</td><td><code>asyncio.gather()</code> in tool_calls_node</td><td><code>src/pipeline/nodes/processing.py</code></td></tr>
        </tbody>
      </table>

      <h2>23.9 LangChain → LangGraph: How Each Component Maps</h2>
      <p>LangChain and LangGraph are complementary — LangChain provides the component library (prompts, chains, retrievers, tools, output parsers), LangGraph provides the execution framework (state, routing, loops, checkpointing). You use both together.</p>

      <h3>23.9.1 LCEL chains → LangGraph nodes</h3>
      <p>Any LCEL chain can be called inside a node. Build the chain as a standalone testable unit; wrap it in a node for tracing and routing.</p>
      <CodeBlock title="LCEL Chain Wrapped as LangGraph Node — Unit-Testable Unit" language="python" keyLine={7} keyNote="Test the chain in isolation — no graph setup needed">{CODE_LCEL_AS_NODE}</CodeBlock>

      <h3>23.9.2 LangChain retrievers → retrieval nodes</h3>
      <p>Any LangChain retriever — FAISS, Pinecone, Chroma, EnsembleRetriever — plugs directly into a node. Or use <code>create_retriever_tool</code> to let the LLM call it on demand via ToolNode.</p>
      <CodeBlock title="LangChain Retriever as LangGraph Retrieval Node" language="python" keyLine={6} keyNote="Standard retriever.invoke() — no LangGraph-specific code inside node">{CODE_LC_RETRIEVER_NODE}</CodeBlock>

      <h3>23.9.3 LangChain memory → LangGraph checkpointing</h3>
      <p>LangChain memory types are process-local and don't survive restarts. LangGraph checkpointing replaces all of them with a single pattern that persists, scales, and is observable.</p>
      <CodeBlock title="LangChain Memory vs LangGraph Checkpointing — Migration" language="python" keyLine={17} keyNote="SqliteSaver persists across restarts — BufferWindowMemory does not">{CODE_LC_MEMORY_REPLACE}</CodeBlock>
      <table>
        <tbody>
          <tr><th></th><th>LangChain BufferWindowMemory(k=5)</th><th>LangGraph + SqliteSaver</th></tr>
          <tr><td>Survives restart</td><td>No</td><td>Yes</td></tr>
          <tr><td>Multi-server</td><td>No (sticky sessions)</td><td>Yes (shared DB)</td></tr>
          <tr><td>Race-free</td><td>No</td><td>Yes (DB write serialisation)</td></tr>
          <tr><td>Observable</td><td>No</td><td>Yes (LangSmith traces every turn)</td></tr>
          <tr><td>HITL support</td><td>No</td><td>Yes (<code>interrupt_before</code>)</td></tr>
        </tbody>
      </table>

      <h2>23.10 Parallelism with Send()</h2>
      <p><code>Send()</code> enables <strong>dynamic fan-out</strong> — spawning N parallel node executions from a single conditional edge. The canonical use case: run multiple searches simultaneously and merge results.</p>
      <CodeBlock title="Send() Fan-Out — Parallel Searches with operator.add Merge" language="python" keyLine={14} keyNote="operator.add accumulates results from all parallel Send() runs">{CODE_SEND_FANOUT}</CodeBlock>
      <div className="callout callout-tip">
        <strong>Send() vs asyncio.gather()</strong><br />
        <code>asyncio.gather()</code> parallelises within a single node — you write the concurrency yourself. <code>Send()</code> parallelises at the graph level — each spawned execution is a separate node run, individually traced in LangSmith, individually checkpointed, and independently retryable. Use <code>Send()</code> when each parallel task is large enough to warrant its own trace and checkpoint; use <code>asyncio.gather()</code> inside a single node for lightweight parallel I/O (e.g. fetching 5 property details at once).
      </div>

      <h2>23.11 Observability — LangSmith</h2>
      <p>LangGraph has first-class LangSmith integration. Every graph execution is automatically traced — no decorators, no callbacks, no extra code.</p>
      <CodeBlock title="LangSmith Setup — Auto-Tracing with Metadata and Programmatic Access" language="python" keyLine={4} keyNote="Three env vars enable full auto-tracing — zero code changes required">{CODE_LANGSMITH}</CodeBlock>
      <div className="callout callout-info">
        <strong>What LangSmith shows for a LangGraph trace</strong><br />
        <strong>Graph view:</strong> the full compiled DAG rendered visually — nodes, edges, conditional branches — colour-coded by which paths executed in this run.<br />
        <strong>Node timeline:</strong> each node as a labelled bar showing start time, end time, and latency. Slow nodes are immediately obvious.<br />
        <strong>LLM calls:</strong> prompt template + filled values + completion text + token count + cost per call. Compare across runs to see if a prompt change improved quality.<br />
        <strong>Tool calls:</strong> name, input args JSON, output, latency. See exactly what the agent searched for and what it got back.<br />
        <strong>Thread replay:</strong> every turn for a <code>thread_id</code>, in order, with full state diffs between turns.
      </div>

      <h2>23.12 Ecosystem</h2>
      <h3>23.12.1 create_react_agent — prebuilt ReAct loop</h3>
      <p>For tool-use agents with no custom routing, <code>create_react_agent</code> builds the full <code>llm → tools_condition → ToolNode → llm</code> loop in one call:</p>
      <CodeBlock title="create_react_agent — Prebuilt ReAct Loop with Tools" language="python" keyLine={21} keyNote="One call builds the full llm → tools_condition → ToolNode → llm loop">{CODE_PREBUILT_REACT}</CodeBlock>

      <h3>23.12.2 LangGraph Platform</h3>
      <p><strong>LangGraph Platform</strong> (formerly LangGraph Cloud) is a hosted deployment layer for LangGraph agents. It provides:</p>
      <ul>
        <li><strong>Persistent runs</strong> — long-running graph executions that survive across HTTP requests (multi-turn conversations, background jobs)</li>
        <li><strong>Built-in streaming</strong> — SSE endpoint for every graph, no custom streaming code needed</li>
        <li><strong>Studio UI</strong> — visual graph debugger: click any node to inspect its inputs/outputs, replay a run from any checkpoint</li>
        <li><strong>Cron scheduling</strong> — trigger graph runs on a schedule (nightly reindexing, daily summaries)</li>
        <li><strong>Double-texting handling</strong> — when a user sends a new message while the previous run is still in flight, the platform queues or interrupts cleanly</li>
      </ul>
      <p>Self-hosted alternative: deploy your FastAPI + graph as a standard container. LangGraph Platform is the managed version of exactly what this codebase does manually.</p>

      <h3>23.12.3 Community resources</h3>
      <ul>
        <li><strong>LangGraph templates:</strong> <code>langgraph-cli new --template react-agent</code> — scaffolds a production-ready agent project with Dockerfile, tests, and CI</li>
        <li><strong>Prebuilt agents:</strong> <code>create_react_agent</code>, <code>create_tool_calling_agent</code>, <code>create_openai_tools_agent</code> — all in <code>langgraph.prebuilt</code></li>
        <li><strong>Ecosystem integrations:</strong> <code>langgraph-checkpoint-postgres</code>, <code>langgraph-checkpoint-redis</code>, <code>langgraph-checkpoint-mongodb</code></li>
        <li><strong>Community graphs:</strong> <code>open-canvas</code> (document editing agent), <code>storm</code> (research agent), <code>self-rag</code> (retrieval with reflection) — all open-source LangGraph examples on GitHub</li>
      </ul>

      <div className="callout callout-maang">
        <strong>🎯 MAANG Interview Connection</strong>
        "Why LangGraph instead of calling the LLM directly?" → Three answers, each with a production consequence: (1) Typed state — every node receives a guaranteed schema, no dict key typos cause silent failures; (2) Checkpointing — multi-turn agents survive process restarts and horizontal scaling without sticky sessions; (3) Observability — every node, every LLM call, every tool dispatch is traced in LangSmith with latency and cost. The raw while-loop approach gives you none of these. Tradeoff: framework overhead (~50ms at compile time, negligible per-invocation) and a dependency.
      </div>

      <QuizSection moduleId={25} title="Module 25: LangGraph Concepts & Architecture" contentHint="Why LCEL can't express tool-use loops, StateGraph TypedDict state add_messages reducer, conditional edges routing, MemorySaver vs SqliteSaver checkpointing stale state trap, HITL interrupt_before Command resume, subgraph state bridging, four streaming modes updates values messages astream_events, LCEL chain as LangGraph node, LangChain memory vs checkpointing comparison, Send fan-out parallelism, LangSmith auto-tracing setup, create_react_agent prebuilt" />
    </>
  );
}
