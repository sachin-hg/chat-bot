import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOSSARY, type GlossaryCategory } from '../data/glossary';

const CATEGORIES: GlossaryCategory[] = [
  'LLM Fundamentals',
  'RAG',
  'Agents',
  'Infrastructure',
  'Evaluation',
  'Graph',
];

const CAT_COLOR: Record<GlossaryCategory, string> = {
  'LLM Fundamentals': '#89b4fa',
  'RAG':              '#a6e3a1',
  'Agents':           '#cba6f7',
  'Infrastructure':   '#fab387',
  'Evaluation':       '#f38ba8',
  'Graph':            '#f9e2af',
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function GlossaryView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | 'All'>('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return GLOSSARY.filter(t => {
      const matchCat = activeCategory === 'All' || t.category === activeCategory;
      const matchSearch = !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      return matchCat && matchSearch;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, activeCategory]);

  const availableLetters = useMemo(() => {
    const set = new Set(filtered.map(t => t.term[0].toUpperCase()));
    return set;
  }, [filtered]);

  function scrollToLetter(letter: string) {
    const el = document.getElementById(`glossary-letter-${letter}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const grouped = useMemo(() => {
    const map: Record<string, typeof GLOSSARY> = {};
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(t);
    }
    return map;
  }, [filtered]);

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>AI Engineering Glossary</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
          {GLOSSARY.length} terms across {CATEGORIES.length} categories
        </p>
      </div>

      <div className="glossary-controls">
        <input
          className="glossary-search"
          type="search"
          placeholder="Search terms or definitions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="glossary-cat-pills">
          <button
            className={`glossary-cat-pill ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All ({GLOSSARY.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = GLOSSARY.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                className={`glossary-cat-pill ${activeCategory === cat ? 'active' : ''}`}
                style={activeCategory === cat ? { borderColor: CAT_COLOR[cat], color: CAT_COLOR[cat] } : {}}
                onClick={() => setActiveCategory(cat === activeCategory ? 'All' : cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="glossary-alpha-bar">
        {ALPHABET.map(letter => (
          <button
            key={letter}
            className={`alpha-btn ${availableLetters.has(letter) ? 'available' : 'unavailable'}`}
            onClick={() => availableLetters.has(letter) && scrollToLetter(letter)}
            disabled={!availableLetters.has(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
          No terms match your search.
        </p>
      )}

      <div className="glossary-grid">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([letter, terms]) => (
          <div key={letter}>
            <div id={`glossary-letter-${letter}`} className="glossary-letter-anchor">{letter}</div>
            {terms.map(term => (
              <div key={term.slug} id={term.slug} className="glossary-term-card">
                <div className="glossary-term-head">
                  <h3 className="glossary-term-name">{term.term}</h3>
                  <span
                    className="glossary-cat-badge"
                    style={{ backgroundColor: CAT_COLOR[term.category] + '22', color: CAT_COLOR[term.category], borderColor: CAT_COLOR[term.category] + '55' }}
                  >
                    {term.category}
                  </span>
                </div>
                <p className="glossary-definition">{term.definition}</p>
                {term.codeSnippet && (
                  <pre className="glossary-snippet"><code>{term.codeSnippet}</code></pre>
                )}
                {term.moduleRef !== undefined && (
                  <button
                    className="glossary-mod-link"
                    onClick={() => navigate(`/module/${term.moduleRef}`)}
                  >
                    → Module {term.moduleRef}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
