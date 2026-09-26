import React, { Suspense, lazy, useState, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MODULES } from '../data/modules';
import { useProgressContext } from '../context/ProgressContext';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Sequential IDs (1–50) mapped to Mod*.tsx component files.
// Order: 1→Mod20, 2→Mod16, 3→Mod0, 4→Mod1, 5→Mod13, 6→Mod3, 7→Mod4, 8→Mod2,
//        9→Mod12, 10→Mod17, 11→ModCap2, 12→Mod5, 13→Mod6, 14→Mod18, 15→ModProj3,
//        16→Mod9, 17→Mod7, 18→Mod8, 19→Mod10, 20→Mod11, 21→Mod14, 22→Mod15,
//        23→Mod36, 24→Mod23, 25→Mod24, 26→Mod39, 27→Mod25, 28→Mod26, 29→Mod27,
//        30→Mod28, 31→Mod38, 32→Mod37, 33→Mod44, 34→Mod45, 35→Mod46, 36→Mod47,
//        37→Mod29, 38→Mod30, 39→Mod31, 40→Mod32, 41→Mod33, 42→Mod34, 43→Mod40,
//        44→Mod41, 45→Mod42, 46→Mod19, 47→Mod35, 48→Mod21, 49→Mod22, 50→ModRef
const MODULE_COMPONENTS: Record<number, React.LazyExoticComponent<ComponentType>> = {
  1:  lazy(() => import('../modules/Mod20').then(m => ({ default: m.Mod20 }))),
  2:  lazy(() => import('../modules/Mod16').then(m => ({ default: m.Mod16 }))),
  3:  lazy(() => import('../modules/Mod0').then(m => ({ default: m.Mod0 }))),
  4:  lazy(() => import('../modules/Mod1').then(m => ({ default: m.Mod1 }))),
  5:  lazy(() => import('../modules/Mod13').then(m => ({ default: m.Mod13 }))),
  6:  lazy(() => import('../modules/Mod3').then(m => ({ default: m.Mod3 }))),
  7:  lazy(() => import('../modules/Mod4').then(m => ({ default: m.Mod4 }))),
  8:  lazy(() => import('../modules/Mod2').then(m => ({ default: m.Mod2 }))),
  9:  lazy(() => import('../modules/Mod12').then(m => ({ default: m.Mod12 }))),
  10: lazy(() => import('../modules/Mod17').then(m => ({ default: m.Mod17 }))),
  11: lazy(() => import('../modules/ModCap2').then(m => ({ default: m.ModCap2 }))),
  12: lazy(() => import('../modules/Mod5').then(m => ({ default: m.Mod5 }))),
  13: lazy(() => import('../modules/Mod6').then(m => ({ default: m.Mod6 }))),
  14: lazy(() => import('../modules/Mod18').then(m => ({ default: m.Mod18 }))),
  15: lazy(() => import('../modules/ModProj3').then(m => ({ default: m.ModProj3 }))),
  16: lazy(() => import('../modules/Mod9').then(m => ({ default: m.Mod9 }))),
  17: lazy(() => import('../modules/Mod7').then(m => ({ default: m.Mod7 }))),
  18: lazy(() => import('../modules/Mod8').then(m => ({ default: m.Mod8 }))),
  19: lazy(() => import('../modules/Mod10').then(m => ({ default: m.Mod10 }))),
  20: lazy(() => import('../modules/Mod11').then(m => ({ default: m.Mod11 }))),
  21: lazy(() => import('../modules/Mod14').then(m => ({ default: m.Mod14 }))),
  22: lazy(() => import('../modules/Mod15').then(m => ({ default: m.Mod15 }))),
  23: lazy(() => import('../modules/Mod36').then(m => ({ default: m.Mod36 }))),
  24: lazy(() => import('../modules/Mod23').then(m => ({ default: m.Mod23 }))),
  25: lazy(() => import('../modules/Mod24').then(m => ({ default: m.Mod24 }))),
  26: lazy(() => import('../modules/Mod39').then(m => ({ default: m.Mod39 }))),
  27: lazy(() => import('../modules/Mod25').then(m => ({ default: m.Mod25 }))),
  28: lazy(() => import('../modules/Mod26').then(m => ({ default: m.Mod26 }))),
  29: lazy(() => import('../modules/Mod27').then(m => ({ default: m.Mod27 }))),
  30: lazy(() => import('../modules/Mod28').then(m => ({ default: m.Mod28 }))),
  31: lazy(() => import('../modules/Mod38').then(m => ({ default: m.Mod38 }))),
  32: lazy(() => import('../modules/Mod37').then(m => ({ default: m.Mod37 }))),
  33: lazy(() => import('../modules/Mod44').then(m => ({ default: m.Mod44 }))),
  34: lazy(() => import('../modules/Mod45').then(m => ({ default: m.Mod45 }))),
  35: lazy(() => import('../modules/Mod46').then(m => ({ default: m.Mod46 }))),
  36: lazy(() => import('../modules/Mod47').then(m => ({ default: m.Mod47 }))),
  37: lazy(() => import('../modules/Mod29').then(m => ({ default: m.Mod29 }))),
  38: lazy(() => import('../modules/Mod30').then(m => ({ default: m.Mod30 }))),
  39: lazy(() => import('../modules/Mod31').then(m => ({ default: m.Mod31 }))),
  40: lazy(() => import('../modules/Mod32').then(m => ({ default: m.Mod32 }))),
  41: lazy(() => import('../modules/Mod33').then(m => ({ default: m.Mod33 }))),
  42: lazy(() => import('../modules/Mod34').then(m => ({ default: m.Mod34 }))),
  43: lazy(() => import('../modules/Mod40').then(m => ({ default: m.Mod40 }))),
  44: lazy(() => import('../modules/Mod41').then(m => ({ default: m.Mod41 }))),
  45: lazy(() => import('../modules/Mod42').then(m => ({ default: m.Mod42 }))),
  46: lazy(() => import('../modules/Mod19').then(m => ({ default: m.Mod19 }))),
  47: lazy(() => import('../modules/Mod35').then(m => ({ default: m.Mod35 }))),
  48: lazy(() => import('../modules/Mod21').then(m => ({ default: m.Mod21 }))),
  49: lazy(() => import('../modules/Mod22').then(m => ({ default: m.Mod22 }))),
  50: lazy(() => import('../modules/ModRef').then(m => ({ default: m.ModRef }))),
  51: lazy(() => import('../modules/ModCap4').then(m => ({ default: m.ModCap4 }))),
  52: lazy(() => import('../modules/ModHarness').then(m => ({ default: m.ModHarness }))),
  53: lazy(() => import('../modules/Mod53').then(m => ({ default: m.Mod53 }))),
  54: lazy(() => import('../modules/Mod54').then(m => ({ default: m.Mod54 }))),
};

function ModuleFallback() {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)' }}>
      Loading module…
    </div>
  );
}

export function ModuleView() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { completed, markComplete } = useProgressContext();
  const id = Number(moduleId);

  const idx = MODULES.findIndex(m => m.id === id);
  const m = MODULES[idx];

  if (!m) {
    return <p style={{ color: 'var(--accent3)' }}>Module {id} not found.</p>;
  }

  const ModContent = MODULE_COMPONENTS[id];
  const prevM = idx > 0 ? MODULES[idx - 1] : null;
  const nextM = idx < MODULES.length - 1 ? MODULES[idx + 1] : null;

  const isDone = completed.has(id);
  const [showCelebration, setShowCelebration] = useState(false);

  function handleComplete() {
    if (!isDone) {
      markComplete(id);
      setShowCelebration(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#3fb950', '#58a6ff', '#d2a8ff', '#ffa657', '#f78166'],
      });
      setTimeout(() => setShowCelebration(false), 2500);
    }
  }

  return (
    <div>
      <div className="module-header">
        <div className="module-badge">{m.badge}</div>
        <div className="module-title">{m.title}</div>
        <div className="module-subtitle">{m.subtitle}</div>
      </div>

      <Suspense fallback={<ModuleFallback />}>
        {ModContent ? <ModContent /> : <p>Coming soon.</p>}
      </Suspense>

      <div className="complete-section">
        <button
          className={`complete-btn ${isDone ? 'done' : ''}`}
          onClick={handleComplete}
        >
          {isDone ? '✓ Completed' : '☐ Mark as complete'}
        </button>
      </div>

      <div className="mod-nav">
        {prevM ? (
          <a className="nav-btn" href="#" onClick={e => { e.preventDefault(); navigate(`/module/${prevM.id}`); window.scrollTo(0, 0); }}>
            ← <span><div className="nav-btn-label">Previous</div>{prevM.title}</span>
          </a>
        ) : <span />}
        {nextM ? (
          <a className="nav-btn" href="#" onClick={e => { e.preventDefault(); navigate(`/module/${nextM.id}`); window.scrollTo(0, 0); }}>
            <span><div className="nav-btn-label">Next</div>{nextM.title}</span> →
          </a>
        ) : <span />}
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg2)', border: '1px solid var(--accent2)',
              borderRadius: '12px', padding: '14px 28px',
              display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: '0 8px 32px rgba(63,185,80,.3)', zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <motion.circle cx="12" cy="12" r="11" stroke="#3fb950" strokeWidth="2"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }} />
              <motion.path d="M6 12l4 4 8-8" stroke="#3fb950" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }} />
            </motion.svg>
            <span style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: '15px' }}>Module complete!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
