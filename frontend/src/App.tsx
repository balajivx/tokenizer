import styles from './App.module.css'
import { BPETrainingPanel } from './components/BPETrainingPanel'
import { EncodingSelector } from './components/EncodingSelector'
import { ExtractedTextPanel } from './components/ExtractedTextPanel'
import { InputPanel } from './components/InputPanel'
import { StatsPanel } from './components/StatsPanel'
import { StatusBanner } from './components/StatusBanner'
import { TokenizeButton } from './components/TokenizeButton'
import { TokenVisualization } from './components/TokenVisualization'
import { VocabularyPanel } from './components/VocabularyPanel'
import { useTokenizerState } from './state/useTokenizerState'

function App() {
  const state = useTokenizerState()

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brandBadge}>
            <span className={styles.brandDot} />
            <span>Tokenizer Studio</span>
          </div>
          <div className={styles.statusIndicator}>
            <span>● Engine Active</span>
          </div>
        </div>
        <h1 className={styles.title}>Interactive Tokenizer & BPE Visualizer</h1>
        <p className={styles.description}>
          Explore how text becomes tokens with OpenAI Tiktoken parity, Byte-Pair Encoding (BPE) training lab, or custom vocabulary tracking.
        </p>
      </header>

      {state.tokenizerMode === 'bpe' && (
        <BPETrainingPanel
          trainingText={state.bpeTrainingText}
          targetVocabSize={state.bpeTargetVocabSize}
          bpeModel={state.bpeModel}
          isLoading={state.status === 'loading'}
          onTrainingTextChange={state.setBpeTrainingText}
          onTargetVocabSizeChange={state.setBpeTargetVocabSize}
          onTrain={state.trainBPE}
          onReset={state.resetBPE}
        />
      )}

      <section className={styles.section}>
        {state.tokenizerMode === 'bpe' && (
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>2. BPE Tokenization</h3>
            <p className={styles.sectionSubtitle}>
              Tokenize text using the trained BPE model and its learned merge rules.
            </p>
          </div>
        )}

        <InputPanel
          inputMode={state.inputMode}
          text={state.text}
          tokenizerMode={state.tokenizerMode}
          onTextChange={state.setText}
          onUseDirectTextEntry={state.useDirectTextEntry}
          onUploadFile={state.uploadFile}
          onTokenizerModeChange={state.setTokenizerMode}
        />

        {state.tokenizerMode === 'tiktoken' && (
          <EncodingSelector
            options={state.encodingOptions}
            value={state.encoding}
            onChange={state.setEncoding}
          />
        )}

        {state.inputMode === 'file' && state.uploadedFilename && (
          <ExtractedTextPanel filename={state.uploadedFilename} text={state.text} />
        )}

        <TokenizeButton onClick={state.tokenize} disabled={!state.text.trim()} />
      </section>

      <StatusBanner status={state.status} errorMessage={state.errorMessage} />

      {state.result && (
        <section className={styles.section}>
          <h2>Tokenization Results</h2>
          <StatsPanel result={state.result} />
          <TokenVisualization tokens={state.result.tokens} />
        </section>
      )}

      {state.tokenizerMode === 'custom' && (
        <section className={styles.section}>
          <h2>Custom Tokenizer vocabulary</h2>
          <VocabularyPanel vocabulary={state.vocabulary} onReset={state.resetVocabulary} />
        </section>
      )}
    </main>
  )
}

export default App
