import { X } from 'lucide-react'
import { IconButton } from '../../design-system'
import type { DiagramNodeKind } from '../../domain/diagram'
import { kindsInGroup } from '../../domain/node-kinds'
import { useToolStore } from '../../stores/tool-store'
import { ShapeButton } from './ToolRail'

const SECTIONS: { title: string; kinds: DiagramNodeKind[] }[] = [
  { title: 'Shapes', kinds: kindsInGroup('shape') },
  { title: 'Architecture', kinds: kindsInGroup('architecture') },
]

/**
 * The full shape catalogue, docked against the left edge with the tool rail
 * sitting beside it.
 *
 * Picking a shape leaves the panel open: browsing is the point, and a panel
 * that closed on every pick would make placing three shapes a chore.
 */
export function ShapeLibrary() {
  const libraryOpen = useToolStore((state) => state.libraryOpen)
  const setLibraryOpen = useToolStore((state) => state.setLibraryOpen)
  const tool = useToolStore((state) => state.tool)
  const setTool = useToolStore((state) => state.setTool)

  if (!libraryOpen) return null
  const activeShape = tool.kind === 'shape' ? tool.shape : null

  return (
    <aside className="shape-library" aria-label="Shape library">
      <div className="shape-library-header">
        <h2>Shapes</h2>
        <IconButton
          label="Close shape library"
          tooltipPlacement="bottom"
          icon={<X size={16} />}
          onClick={() => setLibraryOpen(false)}
        />
      </div>

      <div className="shape-library-body ds-scroll">
        {SECTIONS.map((section) => (
          <section key={section.title} className="shape-library-section">
            <p className="ds-eyebrow">{section.title}</p>
            <div className="shape-grid">
              {section.kinds.map((kind) => (
                <ShapeButton
                  key={kind}
                  kind={kind}
                  active={activeShape === kind}
                  onPick={(picked) => setTool({ kind: 'shape', shape: picked })}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  )
}
