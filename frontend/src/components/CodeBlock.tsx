import { useState, useRef } from 'react'

// Language → pill colour mapping (Manifesto P2)
const LANG_META: Record<string, { label: string; color: string }> = {
  python:     { label: 'Python',     color: 'var(--accent)'  },
  py:         { label: 'Python',     color: 'var(--accent)'  },
  typescript: { label: 'TypeScript', color: 'var(--accent)'  },
  javascript: { label: 'JavaScript', color: 'var(--accent)'  },
  yaml:       { label: 'YAML',       color: 'var(--accent5)' },
  bash:       { label: 'Bash',       color: 'var(--accent2)' },
  shell:      { label: 'Shell',      color: 'var(--accent2)' },
  sh:         { label: 'Shell',      color: 'var(--accent2)' },
  sql:        { label: 'SQL',        color: 'var(--accent4)' },
  json:       { label: 'JSON',       color: 'var(--muted)'   },
  text:       { label: 'Text',       color: 'var(--muted)'   },
  plaintext:  { label: 'Text',       color: 'var(--muted)'   },
}

function getLangMeta(language: string) {
  return LANG_META[language.toLowerCase()] ?? { label: language.toUpperCase(), color: 'var(--muted)' }
}

// Detect line-level comments for P7 amber styling
function renderLineWithComment(line: string, language: string): React.ReactNode {
  const commentPatterns: Record<string, RegExp> = {
    python: /(#.*)$/,
    bash: /(#.*)$/,
    shell: /(#.*)$/,
    yaml: /(#.*)$/,
    sql: /(--.*|\/\*.*)$/,
    typescript: /(\/\/.*)$/,
    javascript: /(\/\/.*)$/,
  }
  const pattern = commentPatterns[language.toLowerCase()]
  if (!pattern) return line
  const match = line.match(pattern)
  if (!match || !match.index) return line
  const code = line.slice(0, match.index)
  const comment = line.slice(match.index)
  return (
    <>
      {code}
      <span style={{ color: '#f9e2af', fontStyle: 'italic' }}>{comment}</span>
    </>
  )
}

export interface CodeBlockProps {
  title: string
  language?: string
  children: string
  // P3: key line annotation (1-indexed)
  keyLine?: number
  keyNote?: string
  // P4: progressive disclosure (auto-enabled for >COLLAPSE_THRESHOLD lines)
  collapsible?: boolean
  // P5: variant for WRONG/RIGHT contrast
  variant?: 'default' | 'broken' | 'fixed'
  // Disable amber comment rendering (for blocks where it causes noise)
  noCommentStyle?: boolean
}

const COLLAPSE_THRESHOLD = 20

export function CodeBlock({
  title,
  language = 'text',
  children,
  keyLine,
  keyNote,
  collapsible = true,
  variant = 'default',
  noCommentStyle = false,
}: CodeBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)

  const lang = language.toLowerCase()
  const { label: langLabel, color: langColor } = getLangMeta(lang)
  const lines = children.split('\n')
  const isLong = lines.length > COLLAPSE_THRESHOLD
  const isCollapsed = collapsible && isLong && !expanded

  const variantBorderColor =
    variant === 'broken' ? 'var(--accent3)' : variant === 'fixed' ? 'var(--accent2)' : 'var(--border)'
  const variantTopColor =
    variant === 'broken' ? 'var(--accent3)' : variant === 'fixed' ? 'var(--accent2)' : 'var(--border)'

  function handleCopy() {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function renderLines() {
    return lines.map((line, i) => {
      const lineNum = i + 1
      const isKey = keyLine === lineNum
      return (
        <div
          key={i}
          style={isKey ? {
            background: 'rgba(249,226,175,.08)',
            borderLeft: '3px solid #f9e2af',
            paddingLeft: '5px',
            marginLeft: '-8px',
          } : undefined}
        >
          {noCommentStyle || isKey
            ? line
            : renderLineWithComment(line, lang)}
          {isKey && keyNote && (
            <span style={{
              marginLeft: '12px', fontSize: '11px', color: '#f9e2af',
              fontStyle: 'italic', fontFamily: 'var(--font-sans, sans-serif)',
            }}>
              ← {keyNote}
            </span>
          )}
        </div>
      )
    })
  }

  // Use simple <pre><code> with className so PrismJS can highlight it
  // For key-line or amber-comment rendering, fall back to manual line rendering
  const needsLineRender = keyLine !== undefined || !noCommentStyle

  return (
    <div
      className="code-wrap"
      style={{
        margin: '16px 0',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: `1px solid ${variantBorderColor}`,
        borderTop: `4px solid ${variantTopColor}`,
      }}
    >
      {/* P1: Header bar */}
      <div style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0 12px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {variant !== 'default' && (
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '.06em',
            color: variantBorderColor,
            background: `${variantBorderColor}18`,
            padding: '2px 7px', borderRadius: '3px',
            textTransform: 'uppercase',
          }}>
            {variant === 'broken' ? '✗ broken' : '✓ fixed'}
          </span>
        )}
        {/* P1: title */}
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {/* P2: language pill */}
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '.06em',
          color: langColor, background: `${langColor}1a`,
          padding: '2px 8px', borderRadius: '10px',
          textTransform: 'uppercase', flexShrink: 0,
        }}>
          {langLabel}
        </span>
        {/* P1: copy button */}
        <button
          onClick={handleCopy}
          style={{
            background: 'none', border: 'none',
            color: copied ? 'var(--accent2)' : 'var(--muted)',
            fontSize: '11px', cursor: 'pointer',
            padding: '2px 6px', borderRadius: '4px',
            transition: 'color .15s', flexShrink: 0,
          }}
          title="Copy to clipboard"
        >
          {copied ? '✓ copied' : 'Copy'}
        </button>
      </div>

      {/* Code body */}
      <div ref={codeRef} style={{ position: 'relative' }}>
        {needsLineRender ? (
          // Manual line rendering for key-line + amber comments (P3, P7)
          <pre style={{
            margin: 0, borderRadius: 0, overflow: 'auto',
            maxHeight: isCollapsed ? '220px' : 'none',
            padding: '14px 16px', fontSize: '13px', lineHeight: '1.65',
          }}>
            {renderLines()}
          </pre>
        ) : (
          // Prism.js syntax highlighting path
          <div style={{ maxHeight: isCollapsed ? '220px' : 'none', overflow: 'hidden' }}>
            <pre style={{ margin: 0, borderRadius: 0 }}>
              <code className={`language-${lang}`}>{children}</code>
            </pre>
          </div>
        )}

        {/* P4: progressive disclosure fade + button */}
        {isCollapsed && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '80px',
            background: 'linear-gradient(transparent, var(--bg2))',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: '8px',
          }}>
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: '6px',
                padding: '5px 18px', fontSize: '12px',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Show full implementation ({lines.length} lines) ↓
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle after expanding */}
      {expanded && isLong && (
        <div style={{ textAlign: 'center', padding: '4px 0 8px', background: 'var(--bg2)' }}>
          <button
            onClick={() => setExpanded(false)}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '11px', cursor: 'pointer' }}
          >
            ↑ Collapse
          </button>
        </div>
      )}
    </div>
  )
}

// P5: Side-by-side diff layout
export function CodeDiff({
  brokenTitle,
  fixedTitle,
  language = 'python',
  broken,
  fixed,
}: {
  brokenTitle: string
  fixedTitle: string
  language?: string
  broken: string
  fixed: string
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, margin: '16px 0' }}>
      <CodeBlock title={brokenTitle} language={language} variant="broken" collapsible={false}>
        {broken}
      </CodeBlock>
      <CodeBlock title={fixedTitle} language={language} variant="fixed" collapsible={false}>
        {fixed}
      </CodeBlock>
    </div>
  )
}
