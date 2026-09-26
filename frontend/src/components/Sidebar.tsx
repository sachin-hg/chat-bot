import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MODULES, LEARNING_PATHS } from '../data/modules';
import { useProgressContext } from '../context/ProgressContext';

const TRACK_META = {
  core: { cls: 'track-core', label: 'CORE' },
  ai:   { cls: 'track-ai',   label: 'AI FOUND.' },
  fe:   { cls: 'track-fe',   label: 'FE BRIDGE' },
  ent:  { cls: 'track-ent',  label: 'ENTERPRISE' },
};

const ACT_META: Record<number, string> = {
  0: 'Act 0 · Foundations',
  1: 'Act 1 · Design Framework',
  2: 'Act 2 · Building the System',
  3: 'Act 3 · Production-Ready',
  4: 'Act 4 · Go Deeper — AI Toolkit',
  5: 'Act 5 · Transfer & Mastery',
};

interface Props {
  onOpenTutor: () => void;
}

export function Sidebar({ onOpenTutor }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleId } = useParams<{ moduleId: string }>();
  const { completed } = useProgressContext();
  const currentId = Number(moduleId ?? 0);
  const isGlossary = location.pathname === '/glossary';

  const pct = Math.round(completed.size / MODULES.length * 100);

  return (
    <nav id="sidebar">
      <div id="sidebar-header">
        <h2>Scalar Academy</h2>
        <p>Building Production AI Agents</p>
      </div>

      <div id="progress-bar-wrap">
        <div id="progress-label">{completed.size} of {MODULES.length} modules completed</div>
        <div id="progress-bar">
          <div id="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div id="module-list">
        <a
          className={`glossary-sidebar-link ${isGlossary ? 'active' : ''}`}
          href="#"
          onClick={e => { e.preventDefault(); navigate('/glossary'); }}
        >
          📖 Glossary — {' '}
          <span style={{ opacity: 0.7, fontWeight: 400 }}>80 terms explained</span>
        </a>

        <details className="paths-panel">
          <summary>📍 Learning Paths — Skip What You Know</summary>
          {LEARNING_PATHS.map((p, i) => (
            <div key={i} className="path-item">
              <strong>{p.label}</strong>
              <em className="path-outcome">{p.outcome}</em>
              {p.path}
            </div>
          ))}
          <div className="path-item" style={{ marginTop: 10, border: 'none', padding: 0, fontSize: 10, opacity: 0.7 }}>
            <span className="track-tag track-ai">AI FOUND.</span> new to LLMs &nbsp;
            <span className="track-tag track-fe">FE BRIDGE</span> frontend &nbsp;
            <span className="track-tag track-ent">ENTERPRISE</span> scale/compliance
          </div>
        </details>

        {MODULES.map((m, i) => {
          const showActHeader = i === 0 || MODULES[i - 1].act !== m.act;
          const prevCluster = i > 0 ? MODULES[i - 1].cluster : undefined;
          const showClusterHeader = !!m.cluster && m.cluster !== prevCluster;

          const tm = TRACK_META[m.track] ?? TRACK_META.core;
          const trackBadge = m.track !== 'core'
            ? <span className={`track-tag ${tm.cls}`}>{tm.label}</span>
            : null;
          const isActive = m.id === currentId;
          const isDone = completed.has(m.id);
          const checkLabel = isDone ? '✓' : String(i + 1);

          return (
            <div key={m.id}>
              {showActHeader && (
                <div className="act-header">{ACT_META[m.act]}</div>
              )}
              {showClusterHeader && !showActHeader && (
                <div className="cluster-header">── {m.cluster}</div>
              )}
              <a
                className={`mod-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                href="#"
                onClick={e => { e.preventDefault(); navigate(`/module/${m.id}`); }}
              >
                <div className="mod-check">{checkLabel}</div>
                <div className="mod-label">
                  {m.title}{trackBadge}
                  <small>{ACT_META[m.act]}</small>
                </div>
              </a>
            </div>
          );
        })}
      </div>

      <div id="sidebar-footer">
        <button className="ask-ai-btn" onClick={onOpenTutor}>🤖 Ask AI Tutor</button>
      </div>
    </nav>
  );
}
