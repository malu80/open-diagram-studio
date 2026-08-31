import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { diagramRepository } from '../src/data/diagram-repository'
import { DOCUMENT_VERSION, type DiagramDocument } from '../src/domain/diagram'

const document = (overrides: Partial<DiagramDocument> = {}): DiagramDocument => ({
  id: 'current-diagram',
  title: 'First title',
  version: DOCUMENT_VERSION,
  updatedAt: '2026-08-29T08:00:00.000Z',
  nodes: [],
  edges: [],
  ...overrides,
})

describe('diagram repository', () => {
  it('returns null before saving, then saves and replaces the current diagram', async () => {
    expect(await diagramRepository.load()).toBeNull()

    const initial = document()
    await diagramRepository.save(initial)
    expect(await diagramRepository.load()).toEqual(initial)

    const updated = document({
      title: 'Updated title',
      updatedAt: '2026-08-29T08:01:00.000Z',
    })
    await diagramRepository.save(updated)

    expect(await diagramRepository.load()).toEqual(updated)
  })

  it('migrates a document written by an older build', async () => {
    const legacy = document({ id: 'current-diagram', version: 1 })
    await diagramRepository.save(legacy)

    const loaded = await diagramRepository.load()

    expect(loaded?.version).toBe(DOCUMENT_VERSION)
    expect(loaded?.title).toBe(legacy.title)
  })

  it('starts fresh rather than crashing on an unreadable record', async () => {
    // Half a document — the shape corrupt or truncated data actually takes.
    // It keeps the fields the store itself indexes on, so it writes cleanly
    // and only fails when it is read back.
    await diagramRepository.save({
      id: 'current-diagram',
      updatedAt: '2026-08-29T08:02:00.000Z',
    } as unknown as DiagramDocument)

    expect(await diagramRepository.load()).toBeNull()
  })
})
