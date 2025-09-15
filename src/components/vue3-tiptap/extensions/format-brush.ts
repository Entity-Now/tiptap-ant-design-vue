import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import type { Mark } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/core'

interface FormatBrushOptions {
  lastSelectionMarks: Mark[] | null
}

interface FormatBrushStorage {
  isDoubleClick: boolean
  isBrushActive: boolean
}

interface CopyFormatOptions {
  type: 'click' | 'dblclick'
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    formatBrush: {
      copyFormat: (data: CopyFormatOptions) => ReturnType
    }
  }
}

// 获取选区中的所有 marks
function getSelectedTextStyle(state: EditorState): Mark[] {
  const { from, to } = state.selection
  const marks: Mark[] = []

  state.doc.nodesBetween(from, to, (node) => {
    if (node.isText) {
      node.marks.forEach((mark) => {
        if (!marks.includes(mark)) {
          marks.push(mark)
        }
      })
    }
  })

  return marks
}

// 应用 marks 到当前选区
function applyFormatToSelection(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  const { lastSelectionMarks } = FormatBrush.options
  if (!lastSelectionMarks || lastSelectionMarks.length === 0) return false

  const { from, to } = state.selection
  const tr = state.tr

  lastSelectionMarks.forEach((mark) => {
    tr.addMark(from, to, mark)
  })

  if (tr.docChanged) {
    dispatch(tr)
  }

  return true
}

const FormatBrush = Extension.create<FormatBrushOptions, FormatBrushStorage>({
  name: 'formatBrush',

  addOptions() {
    return {
      lastSelectionMarks: null,
    }
  },

  addStorage() {
    return {
      isDoubleClick: false,
      isBrushActive: false,
    }
  },

  addCommands() {
    return {
      copyFormat:
        (options: CopyFormatOptions) =>
        ({ state }) => {
          const tiptap = document.querySelector('.tiptap')
          tiptap?.classList.add('tiptap__brush')

          this.options.lastSelectionMarks = null

          if (options.type === 'dblclick') {
            this.storage.isDoubleClick = true
          }

          this.storage.isBrushActive = true

          if (!state.selection.empty) {
            const marks = getSelectedTextStyle(state)
            this.options.lastSelectionMarks = marks
          }

          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => {
        this.storage.isBrushActive = false
        this.storage.isDoubleClick = false
        const tiptap = document.querySelector('.tiptap')
        tiptap?.classList.remove('tiptap__brush')
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        view: () => {
          return {
            update: (view, prevState) => {
              const state = view.state
              const selectionChanged = !prevState.selection.eq(state.selection)

              if (
                selectionChanged &&
                this.options.lastSelectionMarks &&
                this.storage.isBrushActive
              ) {
                applyFormatToSelection(state, view.dispatch)
              }
            },
          }
        },
        props: {
          handleDOMEvents: {
            mouseup: () => {
              if (!this.storage.isDoubleClick) {
                this.storage.isBrushActive = false
                const tiptap = document.querySelector('.tiptap')
                tiptap?.classList.remove('tiptap__brush')
              }
              return true
            },
          },
        },
      }),
    ]
  },
})

export default FormatBrush
