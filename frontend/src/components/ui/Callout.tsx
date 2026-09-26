import type { ReactNode } from 'react';

type CalloutType = 'info' | 'warn' | 'tip' | 'gotcha' | 'maang' | 'misconception' | 'exercise';

interface Props {
  type?: CalloutType;
  children: ReactNode;
}

export function Callout({ type = 'info', children }: Props) {
  return (
    <div className={`callout callout-${type}`}>
      {children}
    </div>
  );
}
