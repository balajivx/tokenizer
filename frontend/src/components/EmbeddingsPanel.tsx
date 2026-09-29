import type { EmbeddingResponse } from '../types/api'
import styles from './EmbeddingsPanel.module.css'

interface EmbeddingsPanelProps {
  embeddings: EmbeddingResponse
}

function formatVector(vector: number[]): string {
  return `[${vector.map((v) => (Number.isInteger(v) ? v.toString() : v.toFixed(4))).join(', ')}]`
}

export function EmbeddingsPanel({ embeddings }: EmbeddingsPanelProps) {
  const { token_embeddings, positional_embeddings, final_embeddings } = embeddings

  if (!token_embeddings || token_embeddings.length === 0) {
    return (
      <div className={styles.emptyNotice}>
        No embeddings available for whitespace-only input.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. Token Embeddings */}
      <section className={styles.tableSection}>
        <h3 className={styles.sectionTitle}>Token Embeddings</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Token ID</th>
                <th>Vector</th>
              </tr>
            </thead>
            <tbody>
              {token_embeddings.map((row, index) => (
                <tr key={index}>
                  <td className={styles.tokenCell}>{row.token}</td>
                  <td>{row.token_id}</td>
                  <td className={styles.vectorCell}>{formatVector(row.vector)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Positional Embeddings */}
      <section className={styles.tableSection}>
        <h3 className={styles.sectionTitle}>Positional Embeddings</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Position</th>
                <th>Vector</th>
              </tr>
            </thead>
            <tbody>
              {positional_embeddings.map((row, index) => (
                <tr key={index}>
                  <td>{row.position}</td>
                  <td className={styles.vectorCell}>{formatVector(row.vector)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Final Embeddings */}
      <section className={styles.tableSection}>
        <h3 className={styles.sectionTitle}>Final Embeddings</h3>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Position</th>
                <th>Vector (Token + Positional)</th>
              </tr>
            </thead>
            <tbody>
              {final_embeddings.map((row, index) => (
                <tr key={index}>
                  <td className={styles.tokenCell}>{row.token}</td>
                  <td>{row.position}</td>
                  <td className={styles.vectorCell}>{formatVector(row.vector)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
