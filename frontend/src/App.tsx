import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ModuleView } from './components/ModuleView';
import { GlossaryView } from './components/GlossaryView';
import { TutorPanel } from './components/TutorPanel';
import { useProgress } from './hooks/useProgress';
import { useRevealAnimation } from './hooks/useRevealAnimation';
import { ProgressContext } from './context/ProgressContext';

function CourseLayout() {
  const [tutorOpen, setTutorOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onOpenTutor={() => setTutorOpen(true)} />
      <main id="main">
        <ModuleView />
      </main>
      {!tutorOpen && (
        <button id="tutor-fab" onClick={() => setTutorOpen(true)} title="Ask AI Tutor">
          🤖
        </button>
      )}
      <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} />
    </div>
  );
}

function GlossaryLayout() {
  const [tutorOpen, setTutorOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onOpenTutor={() => setTutorOpen(true)} />
      <main id="main">
        <GlossaryView />
      </main>
      <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} />
    </div>
  );
}

export function App() {
  const progress = useProgress();
  useRevealAnimation();

  return (
    <ProgressContext.Provider value={progress}>
      <BrowserRouter basename="/learn">
        <Routes>
          <Route path="/" element={<Navigate to="/module/1" replace />} />
          <Route path="/module/:moduleId" element={<CourseLayout />} />
          <Route path="/glossary" element={<GlossaryLayout />} />
          <Route path="*" element={<Navigate to="/module/1" replace />} />
        </Routes>
      </BrowserRouter>
    </ProgressContext.Provider>
  );
}
