import type { TokenizeResponse } from '../types/api'
import styles from './StatsPanel.module.css'

interface StatsPanelProps {
  result: TokenizeResponse
}

export function StatsPanel({ result }: StatsPanelProps) {
  const tiles: Array<[string, string]> = [
    ['Characters', String(result.character_count)],
    ['Words', String(result.word_count)],
    ['Tokens', String(result.token_count)],
    ['Tokens / word', result.tokens_per_word.toFixed(2)],
    ['Tokens / char', result.tokens_per_character.toFixed(2)],
  ]

  return (
    <div className={styles.grid}>
      {tiles.map(([label, value]) => (
        <div key={label} className={styles.tile}>
          <div className={styles.value}>{value}</div>
          <div className={styles.label}>{label}</div>
        </div>
      ))}
    </div>
  )
}
