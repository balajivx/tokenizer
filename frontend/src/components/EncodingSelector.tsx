import type { EncodingOption } from '../types/api'
import styles from './EncodingSelector.module.css'

interface EncodingSelectorProps {
  options: EncodingOption[]
  value: string
  onChange: (encoding: string) => void
  disabled?: boolean
}

export function EncodingSelector({ options, value, onChange, disabled }: EncodingSelectorProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <label htmlFor="encoding-selector" className={styles.label}>
          Tiktoken encoding
        </label>
        <span className={styles.hint}>Matches OpenAI platform tokenizer</span>
      </div>
      <select
        id="encoding-selector"
        className={styles.select}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.name} value={option.name}>
            {option.display_name || option.name}
            {option.is_default ? ' (default)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
