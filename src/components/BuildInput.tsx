import { useState, useRef } from 'react'

interface Props {
  onAnalyze: (code: string) => void
  loading: boolean
  error?: string
}

export function BuildInput({ onAnalyze, loading, error }: Props) {
  const [code, setCode] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = code.trim()
    if (trimmed) onAnalyze(trimmed)
  }

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      setCode(text.trim())
      setTimeout(handleSubmit, 50)
    }).catch(() => {
      textareaRef.current?.focus()
    })
  }

  return (
    <div className="panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-poe-gold font-semibold text-lg">Import Build Code</h2>
        <button
          onClick={handlePaste}
          className="btn-ghost text-sm"
          disabled={loading}
        >
          Paste from Clipboard
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Paste your Path of Building code here..."
        className="w-full h-28 bg-black/40 border border-poe-border rounded p-3
                   text-poe-muted text-sm font-mono resize-none
                   focus:outline-none focus:border-poe-gold/60 transition-colors
                   placeholder-poe-muted/40"
        disabled={loading}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
        }}
      />

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded p-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Analyzing...
            </span>
          ) : 'Analyze Build'}
        </button>
        {code && !loading && (
          <button onClick={() => setCode('')} className="btn-ghost text-sm">
            Clear
          </button>
        )}
        <span className="text-poe-muted/60 text-xs ml-auto">
          Ctrl+Enter to analyze
        </span>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
    </svg>
  )
}
