import styles from './TokenizeButton.module.css'

interface TokenizeButtonProps {
  onClick: () => void
  disabled: boolean
}

export function TokenizeButton({ onClick, disabled }: TokenizeButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
      Tokenize
    </button>
  )
}
