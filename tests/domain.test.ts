import { describe, expect, it } from 'vitest'
import { DOCUMENT_VERSION, createBlankDocument } from '../src/domain/diagram'

describe('diagram document', () => {
  it('creates an empty versioned document with a valid timestamp', () => {
    const document = createBlankDocument()

    expect(document).toMatchObject({
      id: 'current-diagram',
      title: 'Untitled diagram',
      version: DOCUMENT_VERSION,
      nodes: [],
      edges: [],
    })
    expect(Number.isNaN(Date.parse(document.updatedAt))).toBe(false)
  })
})