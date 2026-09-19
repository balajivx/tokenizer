import type { Status } from '../state/useTokenizerState'
import styles from './StatusBanner.module.css'

interface StatusBannerProps {
  status: Status
  errorMessage: string | null
}

const EMPTY_TEXT = 'Enter text or upload a file, then tokenize to see results.'
const LOADING_TEXT = 'Tokenizing…'
const SUCCESS_TEXT = 'Tokenization complete.'

export function StatusBanner({ status, errorMessage }: StatusBannerProps) {
  if (status === 'error') {
    return (
      <div role="alert" className={`${styles.banner} ${styles.error}`}>
        {errorMessage ?? 'Something went wrong.'}
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div role="status" className={`${styles.banner} ${styles.loading}`}>
        {LOADING_TEXT}
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div role="status" className={`${styles.banner} ${styles.success}`}>
        {SUCCESS_TEXT}
      </div>
    )
  }

  return (
    <div role="status" className={`${styles.banner} ${styles.empty}`}>
      {EMPTY_TEXT}
    </div>
  )
}
