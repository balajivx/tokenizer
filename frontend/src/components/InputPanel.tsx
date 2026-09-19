import type { ChangeEvent } from 'react'
import type { InputMode } from '../state/useTokenizerState'
import type { TokenizerMode } from '../types/api'
import styles from './InputPanel.module.css'

interface InputPanelProps {
  inputMode: InputMode
  text: string
  tokenizerMode: TokenizerMode
  onTextChange: (text: string) => void
  onUseDirectTextEntry: () => void
  onUploadFile: (file: File) => void
  onTokenizerModeChange: (mode: TokenizerMode) => void
}

export function InputPanel({
  inputMode,
  text,
  tokenizerMode,
  onTextChange,
  onUseDirectTextEntry,
  onUploadFile,
  onTokenizerModeChange,
}: InputPanelProps) {
  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onUploadFile(file)
    event.target.value = ''
  }

  const SAMPLE_TEXTS = [
    {
      label: 'OpenAI Sample',
      text: "Tiktoken is a fast BPE tokeniser for use with OpenAI's models.",
    },
    {
      label: 'Code',
      text: 'def count_tokens(text: str) -> int:\n    return len(encoding.encode(text))',
    },
    {
      label: 'Multilingual & Emojis',
      text: 'Hello! Bonjour! こんにちは! 🚀✨',
    },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.controlsRow}>
        <div className={styles.tabs} role="tablist" aria-label="Tokenizer mode">
          <button
            type="button"
            role="tab"
            aria-selected={tokenizerMode === 'tiktoken'}
            className={`${styles.tab} ${tokenizerMode === 'tiktoken' ? styles.tabActive : ''}`}
            onClick={() => onTokenizerModeChange('tiktoken')}
          >
            Tiktoken (OpenAI)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tokenizerMode === 'custom'}
            className={`${styles.tab} ${tokenizerMode === 'custom' ? styles.tabActive : ''}`}
            onClick={() => onTokenizerModeChange('custom')}
          >
            Custom (Regex)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tokenizerMode === 'bpe'}
            className={`${styles.tab} ${tokenizerMode === 'bpe' ? styles.tabActive : ''}`}
            onClick={() => onTokenizerModeChange('bpe')}
          >
            Custom BPE
          </button>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Input mode">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'text'}
            className={`${styles.tab} ${inputMode === 'text' ? styles.tabActive : ''}`}
            onClick={onUseDirectTextEntry}
          >
            Type text
          </button>
          <label className={`${styles.tab} ${inputMode === 'file' ? styles.tabActive : ''}`}>
            Upload file
            <input
              type="file"
              accept=".txt,.pdf"
              aria-label="Upload file"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className={styles.samplesBar}>
        <span className={styles.samplesLabel}>⚡ Quick Samples:</span>
        <div className={styles.sampleButtons}>
          {SAMPLE_TEXTS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              className={styles.sampleBtn}
              onClick={() => {
                onUseDirectTextEntry()
                onTextChange(sample.text)
              }}
            >
              {sample.label}
            </button>
          ))}
          {text && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => onTextChange('')}
              title="Clear input text"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className={styles.textareaWrapper}>
        <textarea
          className={styles.textarea}
          aria-label="Text to tokenize"
          placeholder="Type or paste text here to see real-time token breakdown…"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
        />
        <div className={styles.textareaMeta}>
          <span>{text.length} chars</span>
          <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
        </div>
      </div>
    </div>
  )
}
