export type Track = 'core' | 'ai' | 'fe' | 'ent';
export type Act = 0 | 1 | 2 | 3 | 4 | 5;

export interface ModuleDefinition {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  track: Track;
  act: Act;
  cluster?: string;   // thematic sub-group label, used for Act 4 sidebar headers
}

export interface LearningPath {
  label: string;
  outcome: string;    // one-sentence learning contract: "By the end, you can..."
  path: string;
}

export interface QuizQuestion {
  type: 'mcq' | 'short' | 'long' | 'design' | 'gotcha';
  question: string;
  answer: string;
  options?: string[];
  hint?: string;
  explanation?: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  _fallback?: boolean;
}
