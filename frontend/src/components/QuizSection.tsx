import { useState, useCallback } from 'react';
import type { QuizQuestion, QuizResponse } from '../types';

interface Props {
  moduleId: number;
  title: string;
  contentHint: string;
}

interface QuizState {
  questions: QuizQuestion[];
  answers: Record<number, number | string>;
  scores: Record<number, number>;
}

export function QuizSection({ moduleId, title, contentHint }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const loadQuiz = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/learn/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          module_title: title,
          content_snippet: contentHint,
          num_questions: 3,
        }),
      });
      const data: QuizResponse = await res.json();
      if (!data.questions) throw new Error('No questions returned');
      setIsFallback(!!data._fallback);
      setQuiz({ questions: data.questions, answers: {}, scores: {} });
      setState('loaded');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
      setState('error');
    }
  }, [moduleId, title, contentHint]);

  return (
    <div className="quiz-section">
      <div className="quiz-header">
        <h3>Test Your Understanding</h3>
        {state !== 'loaded' && (
          <button
            className="btn btn-primary btn-sm"
            onClick={loadQuiz}
            disabled={state === 'loading'}
          >
            {state === 'loading' ? 'Generating…' : 'Generate Quiz'}
          </button>
        )}
      </div>

      {state === 'idle' && (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Click "Generate Quiz" to get AI-generated questions based on this module.
        </p>
      )}
      {state === 'loading' && <div className="quiz-loading">Generating questions…</div>}
      {state === 'error' && (
        <p style={{ color: 'var(--accent3)', fontSize: 13 }}>Failed to load quiz: {errorMsg}</p>
      )}
      {state === 'loaded' && quiz && (
        <QuizBody
          moduleId={moduleId}
          quiz={quiz}
          isFallback={isFallback}
          onChange={setQuiz}
        />
      )}
    </div>
  );
}

interface QuizBodyProps {
  moduleId: number;
  quiz: QuizState;
  isFallback: boolean;
  onChange: (q: QuizState) => void;
}

function QuizBody({ moduleId, quiz, isFallback, onChange }: QuizBodyProps) {
  const [feedbacks, setFeedbacks] = useState<Record<number, { text: string; correct: boolean }>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const selectMCQ = (qi: number, oi: number, q: QuizQuestion) => {
    const correct = String(oi) === String(q.answer) || oi === parseInt(q.answer);
    setFeedbacks(prev => ({
      ...prev,
      [qi]: {
        correct,
        text: `${correct ? '✓ Correct! ' : '✗ Incorrect. '}${q.explanation ?? ''}`,
      },
    }));
    onChange({
      ...quiz,
      answers: { ...quiz.answers, [qi]: oi },
      scores: { ...quiz.scores, [qi]: correct ? 100 : 0 },
    });
  };

  const submitShort = async (qi: number, q: QuizQuestion, userAnswer: string) => {
    if (!userAnswer.trim()) return;
    setLoading(prev => ({ ...prev, [qi]: true }));
    try {
      const res = await fetch('/learn/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          user_answer: userAnswer,
          correct_answer: q.answer,
          question_type: q.type,
        }),
      });
      const data = await res.json();
      setFeedbacks(prev => ({
        ...prev,
        [qi]: {
          correct: data.score >= 60,
          text: `Score: ${data.score}/100 — ${data.feedback}${data.what_to_review ? `\nReview: ${data.what_to_review}` : ''}`,
        },
      }));
      onChange({
        ...quiz,
        scores: { ...quiz.scores, [qi]: data.score },
      });
    } catch {
      setFeedbacks(prev => ({ ...prev, [qi]: { correct: false, text: 'Evaluation failed.' } }));
    } finally {
      setLoading(prev => ({ ...prev, [qi]: false }));
    }
  };

  const avgScore = Object.values(quiz.scores).length > 0
    ? Math.round(Object.values(quiz.scores).reduce((a, b) => a + b, 0) / Object.values(quiz.scores).length)
    : null;

  return (
    <>
      {isFallback && (
        <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 12 }}>
          ⚡ Using pre-seeded questions (AI quiz generation offline)
        </p>
      )}
      {quiz.questions.map((q, qi) => (
        <QuizQuestion
          key={qi}
          qi={qi}
          moduleId={moduleId}
          question={q}
          selectedAnswer={quiz.answers[qi]}
          feedback={feedbacks[qi]}
          isLoading={!!loading[qi]}
          onSelectMCQ={(oi) => selectMCQ(qi, oi, q)}
          onSubmitShort={(ans) => submitShort(qi, q, ans)}
        />
      ))}
      {avgScore !== null && (
        <div className="quiz-score">
          <div
            className="score-circle"
            style={{
              color: avgScore >= 80 ? 'var(--accent2)' : avgScore >= 50 ? 'var(--accent5)' : 'var(--accent3)',
              borderColor: avgScore >= 80 ? 'var(--accent2)' : avgScore >= 50 ? 'var(--accent5)' : 'var(--accent3)',
            }}
          >
            {avgScore}%
          </div>
          <div>
            <strong style={{ color: avgScore >= 80 ? 'var(--accent2)' : avgScore >= 50 ? 'var(--accent5)' : 'var(--accent3)' }}>
              {avgScore >= 80 ? 'Excellent!' : avgScore >= 50 ? 'Good progress' : 'Keep reviewing'}
            </strong>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {Object.keys(quiz.scores).length} of {quiz.questions.length} answered
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface QuestionProps {
  qi: number;
  moduleId: number;
  question: QuizQuestion;
  selectedAnswer: number | string | undefined;
  feedback: { text: string; correct: boolean } | undefined;
  isLoading: boolean;
  onSelectMCQ: (oi: number) => void;
  onSubmitShort: (ans: string) => void;
}

function QuizQuestion({ qi, question: q, selectedAnswer, feedback, isLoading, onSelectMCQ, onSubmitShort }: QuestionProps) {
  const [shortAnswer, setShortAnswer] = useState('');
  const [hintShown, setHintShown] = useState(false);

  if (q.type === 'mcq') {
    return (
      <div className="quiz-question">
        <div className="quiz-q-text">{qi + 1}. {q.question}</div>
        <div className="quiz-options">
          {(q.options ?? []).map((opt, oi) => {
            let cls = 'quiz-opt';
            if (selectedAnswer !== undefined) {
              if (oi === selectedAnswer) cls += Number(selectedAnswer) === parseInt(q.answer) ? ' correct' : ' wrong';
              else if (oi === parseInt(q.answer) && Number(selectedAnswer) !== parseInt(q.answer)) cls += ' correct';
            }
            return (
              <div key={oi} className={cls} onClick={() => !feedback && onSelectMCQ(oi)}>
                {opt}
              </div>
            );
          })}
        </div>
        {feedback && (
          <div className={`quiz-feedback ${feedback.correct ? 'fb-correct' : 'fb-wrong'}`}>
            {feedback.text}
          </div>
        )}
        {q.hint && (
          <div className="quiz-hint" onClick={() => setHintShown(true)}>
            {hintShown ? `Hint: ${q.hint}` : '💡 Show hint'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="quiz-question">
      <div className="quiz-q-text">
        {qi + 1}. {q.question} <span style={{ fontSize: 11, color: 'var(--accent4)' }}>({q.type})</span>
      </div>
      <textarea
        className="quiz-short-input"
        placeholder="Type your answer…"
        value={shortAnswer}
        onChange={e => setShortAnswer(e.target.value)}
      />
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onSubmitShort(shortAnswer)}
        disabled={isLoading || !shortAnswer.trim()}
      >
        {isLoading ? 'Evaluating…' : 'Check this answer'}
      </button>
      {feedback && (
        <div className={`quiz-feedback ${feedback.correct ? 'fb-correct' : 'fb-wrong'}`}>
          {feedback.text}
        </div>
      )}
      {q.hint && (
        <div className="quiz-hint" onClick={() => setHintShown(true)}>
          {hintShown ? `Hint: ${q.hint}` : '💡 Show hint'}
        </div>
      )}
    </div>
  );
}
