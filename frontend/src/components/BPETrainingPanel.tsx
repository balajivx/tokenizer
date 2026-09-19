import { useState } from 'react'
import type { BPETrainingResult } from '../types/api'
import styles from './BPETrainingPanel.module.css'

interface BPETrainingPanelProps {
  trainingText: string
  targetVocabSize: number
  bpeModel: BPETrainingResult | null
  isLoading: boolean
  onTrainingTextChange: (text: string) => void
  onTargetVocabSizeChange: (size: number) => void
  onTrain: () => Promise<void>
  onReset: () => Promise<void>
}

const SAMPLE_CORPUS = [
  {
    label: 'Classic Subwords',
    text: 'low low low low low lower lower widest newest',
    size: 16,
  },
  {
    label: 'Word Families',
    text: 'the other others another brother mother father',
    size: 25,
  },
  {
    label: 'Code Syntax',
    text: 'function calculate_sum(a, b) { return a + b; }\nfunction calculate_diff(a, b) { return a - b; }',
    size: 30,
  },
]

export function BPETrainingPanel({
  trainingText,
  targetVocabSize,
  bpeModel,
  isLoading,
  onTrainingTextChange,
  onTargetVocabSizeChange,
  onTrain,
  onReset,
}: BPETrainingPanelProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'steps' | 'vocab'>('rules')
  const [searchTerm, setSearchTerm] = useState('')

  const isTrained = Boolean(bpeModel?.is_trained)

  const filteredVocab =
    bpeModel?.vocabulary.filter((entry) =>
      entry.token.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  return (
    <div className={styles.panel} aria-label="BPE Training Flow">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>1. BPE Model Training</h3>
          <p className={styles.subtitle}>
            Enter training text to learn frequent adjacent pairs, build subword vocabulary, and generate ordered merge rules.
          </p>
        </div>
        {isTrained && (
          <div className={styles.statusBadge}>
            <span className={styles.statusDot}></span>
            Trained ({bpeModel?.final_vocab_size} tokens)
          </div>
        )}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <div className={styles.labelBar}>
            <label htmlFor="bpe-training-text" className={styles.label}>
              Training Corpus
            </label>
            <div className={styles.sampleButtons}>
              <span className={styles.sampleHint}>Presets:</span>
              {SAMPLE_CORPUS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  className={styles.sampleBtn}
                  onClick={() => {
                    onTrainingTextChange(sample.text)
                    onTargetVocabSizeChange(sample.size)
                  }}
                >
                  {sample.label}
                </button>
              ))}
              {trainingText && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => onTrainingTextChange('')}
                  title="Clear training text"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            id="bpe-training-text"
            className={styles.textarea}
            placeholder="Type or paste training text here…"
            value={trainingText}
            onChange={(e) => onTrainingTextChange(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.vocabSizeControl}>
            <label htmlFor="bpe-target-vocab-size" className={styles.label}>
              Target Vocabulary Size:
            </label>
            <div className={styles.numberInputGroup}>
              <input
                id="bpe-target-vocab-size"
                type="number"
                min={1}
                max={5000}
                className={styles.numberInput}
                value={targetVocabSize}
                onChange={(e) => onTargetVocabSizeChange(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <div className={styles.quickSizes}>
                {[16, 24, 32, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.sizeTag} ${targetVocabSize === size ? styles.sizeTagActive : ''}`}
                    onClick={() => onTargetVocabSizeChange(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.trainButton}
              disabled={isLoading || !trainingText.trim()}
              onClick={onTrain}
            >
              {isLoading ? 'Training BPE…' : isTrained ? 'Re-Train BPE' : 'Train BPE Tokenizer'}
            </button>
            {isTrained && (
              <button
                type="button"
                className={styles.resetButton}
                onClick={onReset}
                disabled={isLoading}
              >
                Reset BPE Model
              </button>
            )}
          </div>
        </div>
      </div>

      {isTrained && bpeModel && (
        <div className={styles.resultsSection}>
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Initial Base Chars:</span>
              <strong className={styles.statValue}>{bpeModel.initial_vocab_size}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Merges Learned:</span>
              <strong className={styles.statValue}>{bpeModel.total_merges}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Final Vocab Size:</span>
              <strong className={styles.statValue}>{bpeModel.final_vocab_size}</strong>
            </div>
          </div>

          <div className={styles.tabsHeader} role="tablist" aria-label="BPE Model Details">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'rules'}
              className={`${styles.tabBtn} ${activeTab === 'rules' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              Ordered Merge Rules ({bpeModel.merge_rules.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'steps'}
              className={`${styles.tabBtn} ${activeTab === 'steps' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              Step-by-Step Merge Log ({bpeModel.training_steps.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'vocab'}
              className={`${styles.tabBtn} ${activeTab === 'vocab' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('vocab')}
            >
              Learned Vocabulary ({bpeModel.vocabulary.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'rules' && (
              <div className={styles.tableWrapper}>
                <table className={styles.table} aria-label="BPE Merge Rules">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Pair (Token A + Token B)</th>
                      <th>Merged Result</th>
                      <th>Assigned ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bpeModel.merge_rules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={styles.emptyCell}>
                          No merges required (target size equals base characters).
                        </td>
                      </tr>
                    ) : (
                      bpeModel.merge_rules.map((rule) => (
                        <tr key={rule.rank}>
                          <td className={styles.rankCell}>#{rule.rank}</td>
                          <td>
                            <code className={styles.pairCode}>
                              {JSON.stringify(rule.pair[0])} + {JSON.stringify(rule.pair[1])}
                            </code>
                          </td>
                          <td>
                            <span className={styles.mergedToken}>
                              {JSON.stringify(rule.merged_token)}
                            </span>
                          </td>
                          <td className={styles.idCell}>{rule.token_id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className={styles.tableWrapper}>
                <table className={styles.table} aria-label="BPE Training Steps Log">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>Selected Pair</th>
                      <th>Corpus Frequency</th>
                      <th>Merged Token</th>
                      <th>New Token ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bpeModel.training_steps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyCell}>
                          No training steps executed.
                        </td>
                      </tr>
                    ) : (
                      bpeModel.training_steps.map((step) => (
                        <tr key={step.step}>
                          <td className={styles.rankCell}>Step {step.step}</td>
                          <td>
                            <code className={styles.pairCode}>
                              {JSON.stringify(step.pair[0])} + {JSON.stringify(step.pair[1])}
                            </code>
                          </td>
                          <td>
                            <span className={styles.freqBadge}>{step.frequency}x</span>
                          </td>
                          <td>
                            <span className={styles.mergedToken}>
                              {JSON.stringify(step.merged_token)}
                            </span>
                          </td>
                          <td className={styles.idCell}>{step.token_id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'vocab' && (
              <div>
                <div className={styles.vocabFilterBar}>
                  <input
                    type="text"
                    placeholder="Search vocabulary tokens…"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className={styles.vocabCount}>
                    Showing {filteredVocab.length} of {bpeModel.vocabulary.length} entries
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table} aria-label="BPE Vocabulary Table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Token String</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVocab.map((entry) => (
                        <tr key={entry.id}>
                          <td className={styles.idCell}>{entry.id}</td>
                          <td>
                            <code className={styles.vocabCode}>{JSON.stringify(entry.token)}</code>
                          </td>
                          <td>
                            {entry.is_base_char ? (
                              <span className={styles.baseBadge}>Base Character</span>
                            ) : (
                              <span className={styles.mergedBadge}>Merged Subword</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
