import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmbeddingsPanel } from '../src/components/EmbeddingsPanel'
import type { EmbeddingResponse } from '../src/types/api'

describe('EmbeddingsPanel', () => {
  const mockEmbeddings: EmbeddingResponse = {
    token_embeddings: [
      { token: 'Hello', token_id: 15496, vector: [0.1234, -0.5678, 0.9012, 0.3456] },
      { token: 'world', token_id: 995, vector: [0.2222, -0.3333, 0.4444, -0.5555] },
    ],
    positional_embeddings: [
      { position: 0, vector: [0.0101, 0.0202, 0.0303, 0.0404] },
      { position: 1, vector: [0.0505, 0.0606, 0.0707, 0.0808] },
    ],
    final_embeddings: [
      { token: 'Hello', position: 0, vector: [0.1335, -0.5476, 0.9315, 0.386] },
      { token: 'world', position: 1, vector: [0.2727, -0.2727, 0.5151, -0.4747] },
    ],
  }

  it('renders three plain table sections in correct order with headings', () => {
    render(<EmbeddingsPanel embeddings={mockEmbeddings} />)

    expect(screen.getByText('Token Embeddings')).toBeInTheDocument()
    expect(screen.getByText('Positional Embeddings')).toBeInTheDocument()
    expect(screen.getByText('Final Embeddings')).toBeInTheDocument()
  })

  it('displays vectors formatted in square brackets', () => {
    render(<EmbeddingsPanel embeddings={mockEmbeddings} />)

    expect(screen.getByText('[0.1234, -0.5678, 0.9012, 0.3456]')).toBeInTheDocument()
    expect(screen.getByText('[0.0101, 0.0202, 0.0303, 0.0404]')).toBeInTheDocument()
    expect(screen.getByText('[0.1335, -0.5476, 0.9315, 0.3860]')).toBeInTheDocument()
  })

  it('displays token names, ids, and positions correctly', () => {
    render(<EmbeddingsPanel embeddings={mockEmbeddings} />)

    expect(screen.getAllByText('Hello').length).toBe(2) // in Token and Final tables
    expect(screen.getAllByText('world').length).toBe(2)
    expect(screen.getByText('15496')).toBeInTheDocument()
    expect(screen.getByText('995')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBe(2) // pos 0 in Positional and Final tables
    expect(screen.getAllByText('1').length).toBe(2)
  })

  it('renders empty message when no non-whitespace tokens exist', () => {
    render(
      <EmbeddingsPanel
        embeddings={{
          token_embeddings: [],
          positional_embeddings: [],
          final_embeddings: [],
        }}
      />,
    )

    expect(screen.getByText(/No embeddings available for whitespace-only input/i)).toBeInTheDocument()
  })
})
