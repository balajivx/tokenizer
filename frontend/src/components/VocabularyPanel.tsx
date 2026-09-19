import type { VocabularyResponse } from '../types/api'
import styles from './VocabularyPanel.module.css'

interface VocabularyPanelProps {
  vocabulary: VocabularyResponse | null
  onReset: () => void
}

export function VocabularyPanel({ vocabulary, onReset }: VocabularyPanelProps) {
  const entries = vocabulary?.entries ?? []

  return (
    <section className={styles.panel} aria-label="Custom Tokenizer vocabulary">
      <button type="button" className={styles.resetButton} onClick={onReset}>
        Reset vocabulary
      </button>
      {entries.length === 0 ? (
        <p>No vocabulary yet — tokenize some text in Custom mode.</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Token</th>
                <th>Frequency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={entry.is_new ? styles.newRow : undefined}>
                  <td>{entry.id}</td>
                  <td>{entry.token}</td>
                  <td>{entry.frequency}</td>
                  <td>{entry.is_new ? 'new' : 'existing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
