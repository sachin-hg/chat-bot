import { createContext, useContext } from 'react';

interface ProgressContextValue {
  completed: Set<number>;
  markComplete: (id: number) => void;
}

export const ProgressContext = createContext<ProgressContextValue>({
  completed: new Set(),
  markComplete: () => {},
});

export const useProgressContext = () => useContext(ProgressContext);
