import { useState } from 'react'
import type { TokenInfo } from '../types/api'
import styles from './TokenVisualization.module.css'

interface TokenVisualizationProps {
  tokens: TokenInfo[]
}

export function TokenVisualization({ tokens }: TokenVisualizationProps) {
  const [viewMode, setViewMode] = useState<'highlight' | 'ids' | 'chips'>('highlight')
  const [showInlineIds, setShowInlineIds] = useState(false)
  const [copiedFormat, setCopiedFormat] = useState<'json' | 'csv' | null>(null)
  const [hoveredToken, setHoveredToken] = useState<TokenInfo | null>(null)

  const tokenIds = tokens.map((t) => t.id)
  const jsonIds = JSON.stringify(tokenIds)
  const csvIds = tokenIds.join(', ')

  const handleCopy = async (format: 'json' | 'csv') => {
    const textToCopy = format === 'json' ? jsonIds : csvIds
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch {
      // Ignore clipboard error if not permitted
    }
  }

  const colorCount = 7

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.viewTabs} role="tablist" aria-label="Token view modes">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'highlight'}
            className={`${styles.viewTab} ${viewMode === 'highlight' ? styles.viewTabActive : ''}`}
            onClick={() => setViewMode('highlight')}
          >
            🎨 Text Highlight
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'ids'}
            className={`${styles.viewTab} ${viewMode === 'ids' ? styles.viewTabActive : ''}`}
            onClick={() => setViewMode('ids')}
          >
            🔢 Token IDs ({tokens.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'chips'}
            className={`${styles.viewTab} ${viewMode === 'chips' ? styles.viewTabActive : ''}`}
            onClick={() => setViewMode('chips')}
          >
            🧩 Token Breakdown
          </button>
        </div>

        <div className={styles.actions}>
          {viewMode === 'highlight' && (
            <label className={styles.inlineCheckbox}>
              <input
                type="checkbox"
                checked={showInlineIds}
                onChange={(e) => setShowInlineIds(e.target.checked)}
              />
              Show IDs inline
            </label>
          )}

          <div className={styles.copyGroup}>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => handleCopy('json')}
              title="Copy token IDs as JSON array"
            >
              {copiedFormat === 'json' ? '✓ Copied JSON' : 'Copy [IDs]'}
            </button>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => handleCopy('csv')}
              title="Copy comma-separated token IDs"
            >
              {copiedFormat === 'csv' ? '✓ Copied CSV' : 'Copy CSV'}
            </button>
          </div>
        </div>
      </div>

      {hoveredToken && viewMode === 'highlight' && (
        <div className={styles.hoverInfo} aria-live="polite">
          <span className={styles.hoverItem}>
            <strong>Token #{hoveredToken.index}</strong>
          </span>
          <span className={styles.hoverItem}>
            Token ID: <code className={styles.hoverCode}>{hoveredToken.id}</code>
          </span>
          <span className={styles.hoverItem}>
            Text: <code className={styles.hoverCode}>{JSON.stringify(hoveredToken.text)}</code>
          </span>
          {hoveredToken.bytes_repr && (
            <span className={styles.hoverItem}>
              Hex: <code className={styles.hoverCode}>0x{hoveredToken.bytes_repr}</code>
            </span>
          )}
          {hoveredToken.is_new && <span className={styles.newBadge}>NEW</span>}
        </div>
      )}

      {viewMode === 'highlight' && (
        <ul className={styles.highlightView} aria-label="Token breakdown">
          {tokens.map((token) => {
            const colorClass = styles[`tokenColor${token.index % colorCount}`]
            return (
              <li
                key={token.index}
                className={`${styles.tokenSpan} ${colorClass} ${token.is_new ? styles.new : ''}`}
                onMouseEnter={() => setHoveredToken(token)}
                onMouseLeave={() => setHoveredToken(null)}
                title={`index ${token.index}, id ${token.id}`}
              >
                <span className={styles.tokenText}>{token.text}</span>
                {showInlineIds && <sub className={styles.subId}>#{token.id}</sub>}
                {token.is_new && <span className={styles.newBadge}>new</span>}
              </li>
            )
          })}
        </ul>
      )}

      {viewMode === 'ids' && (
        <div className={styles.idsContainer}>
          <div className={styles.idsBox}>
            <div className={styles.idsBoxHeader}>
              <span>Numeric Token IDs Array</span>
              <span className={styles.idsCount}>{tokens.length} tokens</span>
            </div>
            <pre className={styles.idsCode}>
              <code>{jsonIds}</code>
            </pre>
          </div>

          <ul className={styles.idsList} aria-label="Token breakdown">
            {tokens.map((token) => (
              <li
                key={token.index}
                className={`${styles.idCard} ${token.is_new ? styles.new : ''}`}
                title={`index ${token.index}, id ${token.id}`}
              >
                <span className={styles.idCardIndex}>#{token.index}</span>
                <span className={styles.idCardValue}>{token.id}</span>
                <span className={styles.idCardText}>{token.text}</span>
                {token.is_new && <span className={styles.newBadge}>new</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {viewMode === 'chips' && (
        <ul className={styles.chips} aria-label="Token breakdown">
          {tokens.map((token) => {
            const colorClass = styles[`tokenColor${token.index % colorCount}`]
            return (
              <li
                key={token.index}
                className={`${styles.chip} ${token.is_new ? styles.new : ''} ${colorClass}`}
                title={`index ${token.index}, id ${token.id}`}
              >
                <span className={styles.index}>#{token.index}</span>
                <span className={styles.id}>{token.id}</span>
                <span className={styles.tokenText}>{token.text}</span>
                {token.is_new && <span className={styles.newBadge}>new</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
