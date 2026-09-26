import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useState } from 'react';

interface Props {
  lang?: string;
  children: string;
}

const darkStyle = {
  ...githubGist,
  hljs: {
    ...githubGist.hljs,
    background: '#161b22',
    color: '#e6edf3',
  },
};

export function CodeBlock({ lang = 'text', children }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ position: 'relative', margin: '16px 0' }}>
      <button
        onClick={copy}
        className="copy-btn"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language={lang}
        style={darkStyle}
        customStyle={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          padding: '20px',
          fontSize: 13,
          lineHeight: '1.6',
          margin: 0,
        }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
