import styles from './ExtractedTextPanel.module.css'

interface ExtractedTextPanelProps {
  filename: string | null
  text: string
}

export function ExtractedTextPanel({ filename, text }: ExtractedTextPanelProps) {
  return (
    <section aria-label="Extracted document text">
      <p>Extracted from {filename}:</p>
      <div className={styles.panel}>{text}</div>
    </section>
  )
}
