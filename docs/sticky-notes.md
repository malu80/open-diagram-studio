# Sticky Notes: Reference And Behavior

## Reference

The reference is Miro's official [Sticky notes documentation](https://help.miro.com/hc/en-us/articles/360017572054-Sticky-notes), including its [context toolbar and shape-switching example](https://help.miro.com/hc/article_attachments/25382421657490).

The important distinction is the interaction model, not just yellow paper:

- A sticky is a single selectable, movable object with directly editable text.
- Selecting and typing edits the note; ordinary tool shortcuts must not consume that text.
- The selected note has contextual shape, color, and text controls.
- Automatic text sizing and fixed font sizes are separate modes.
- Square and rectangular notes share the same underlying object.

## Implemented Here

- A dedicated `StickyNoteNode` renderer, not the generic shape renderer.
- Click creation at 180 x 180 with the chosen paper color and immediate editing.
- Top-left text and 14px padding, preserving the requested layout rather than copying Miro's default alignment.
- Double-click, select-and-type, or the pencil control to edit; Enter inserts a line break. Escape or Cmd/Ctrl+Enter finishes editing.
- A context toolbar for square/rectangle, 16 paper colors, whole-note bold/alignment, font size, duplicate, and delete.
- Auto measures the browser's actual wrapped text and chooses a fitting size up to 20px. Fixed sizes retain their selected size; overflowing content can scroll within the note. Extremely dense Auto content can also scroll if no supported size fits.
- The editor accepts up to 3,000 characters. Existing saved content is not truncated on load.
- Resize handles outside the paper; text stays in the same object through resizing and dragging.
- One undo step for creation including color, a completed text edit, or a drag/resize gesture. Selection and passive measurements do not add history. History is limited to 100 operations.
- Color, content, geometry, and typography survive duplication, clipboard operations, undo/redo, and IndexedDB reload. Existing sticky notes retain their schema-compatible defaults.

## Deliberately Not Claimed

This is not full Miro parity. Bulk note entry, sticky stacks, spreadsheet-to-notes paste, author labels, tags, reactions, voting, collaboration, rich text within a note, and Miro's quick-connection controls are not implemented.

## Verification

Focused unit coverage exercises creation, selection filtering, grouped history, clipboard, persistence, font-size search, and typing-key precedence.

Browser acceptance uses a separate IndexedDB database namespace, never the user's saved board. Checks cover immediate editing, selected-note typing, multiline wrapping, long text containment, actual mouse drag/resize with undo/redo, context controls, duplication, copy/paste, deletion/undo, persistence, and desktop/narrow-screen layout.