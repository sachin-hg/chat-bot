import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MODULES } from '../data/modules';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TutorPanel({ open, onClose }: Props) {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hi! I'm your AI tutor for this course. Ask me anything about building production AI agents — I'll give you a direct, practical answer.\n\nWhat would you like to understand better?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentModule = MODULES.find(m => m.id === Number(moduleId));

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const res = await fetch('/learn/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: currentModule ? `${currentModule.badge}: ${currentModule.title}` : '',
          course_section: currentModule?.title ?? '',
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.answer ?? 'Sorry, I had trouble answering that.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: `Error: ${e instanceof Error ? e.message : 'Unknown error'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!open) return null;

  return (
    <div id="tutor-panel" className="open">
      <div className="tutor-header" onClick={onClose}>
        <div className="tutor-avatar">AI</div>
        <div className="tutor-name">
          AI Tutor <span style={{ color: 'var(--accent2)', fontSize: 11 }}>● online</span>
        </div>
        <button className="tutor-close">✕</button>
      </div>
      <div id="tutor-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`tutor-msg ${msg.role}`}>
            {msg.text.split('\n').map((line, j) => (
              <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
            ))}
          </div>
        ))}
        {loading && <div className="tutor-msg typing">Thinking…</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="tutor-input-wrap">
        <textarea
          id="tutor-input"
          rows={1}
          placeholder="Ask anything about the course…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button id="tutor-send" onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}
