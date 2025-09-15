import { Extension } from '@tiptap/core'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
} from '@tiptap/pm/state'
import { Fragment, Slice, Node } from '@tiptap/pm/model'
import { EditorView } from '@tiptap/pm/view'

// 假设 serializeForClipboard 已适配 Tiptap 3.0
import { serializeForClipboard } from '../../../utils/clipboard-serializer'

export interface GlobalDragHandleOptions {
  dragHandleWidth: number
  scrollTreshold: number
  dragHandleSelector?: string
  excludedTags: string[]
  customNodes: string[]
}

function absoluteRect(node: Element) {
  const data = node.getBoundingClientRect()
  const modal = node.closest('[role="dialog"]')

  if (modal && window.getComputedStyle(modal).transform !== 'none') {
    const modalRect = modal.getBoundingClientRect()
    return {
      top: data.top - modalRect.top,
      left: data.left - modalRect.left,
      width: data.width,
    }
  }
  return {
    top: data.top,
    left: data.left,
    width: data.width,
  }
}

function nodeDOMAtCoords(coords: { x: number; y: number }, options: GlobalDragHandleOptions) {
  // 更新选择器以支持 Tiptap 3.0 的节点类型
  const selectors = [
    'li',
    'p:not(:first-child)',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    '[data-type="taskItem"]', // 支持任务列表
    ...options.customNodes.map((node) => `[data-type="${node}"]`),
  ].join(', ')
  return document
    .elementsFromPoint(coords.x, coords.y)
    .find(
      (elem: Element) =>
        elem.parentElement?.matches?.('.ProseMirror') ||
        elem.matches(selectors),
    )
}

function nodePosAtDOM(node: Element, view: EditorView, options: GlobalDragHandleOptions) {
  const boundingRect = node.getBoundingClientRect()
  return view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  })?.inside
}

function calcNodePos(pos: number, view: EditorView) {
  const $pos = view.state.doc.resolve(pos)
  return $pos.depth > 1 ? $pos.before($pos.depth) : pos
}

function DragHandlePlugin(options: GlobalDragHandleOptions & { pluginKey: string }) {
  let listType = ''

  function handleDragStart(event: DragEvent, view: EditorView) {
    view.focus()
    if (!event.dataTransfer) return

    const node = nodeDOMAtCoords(
      { x: event.clientX + 50 + options.dragHandleWidth, y: event.clientY },
      options,
    )
    if (!(node instanceof Element)) return

    let draggedNodePos = nodePosAtDOM(node, view, options)
    if (draggedNodePos == null || draggedNodePos < 0) return
    draggedNodePos = calcNodePos(draggedNodePos, view)

    const { from, to } = view.state.selection
    const diff = from - to
    const fromSelectionPos = calcNodePos(from, view)
    let differentNodeSelected = false

    const nodePos = view.state.doc.resolve(fromSelectionPos)
    if (nodePos.node().type.name === 'doc') {
      differentNodeSelected = true
    } else {
      const nodeSelection = NodeSelection.create(view.state.doc, nodePos.before())
      differentNodeSelected = !(
        draggedNodePos + 1 >= nodeSelection.$from.pos &&
        draggedNodePos <= nodeSelection.$to.pos
      )
    }

    let selection = view.state.selection
    if (!differentNodeSelected && diff !== 0 && !(view.state.selection instanceof NodeSelection)) {
      const endSelection = NodeSelection.create(view.state.doc, to - 1)
      selection = TextSelection.create(view.state.doc, draggedNodePos, endSelection.$to.pos)
    } else {
      selection = NodeSelection.create(view.state.doc, draggedNodePos)
      if (
        (selection as NodeSelection).node.type.isInline ||
        (selection as NodeSelection).node.type.name === 'tableRow'
      ) {
        const $pos = view.state.doc.resolve(selection.from)
        selection = NodeSelection.create(view.state.doc, $pos.before())
      }
    }
    view.dispatch(view.state.tr.setSelection(selection))

    if (
      view.state.selection instanceof NodeSelection &&
      view.state.selection.node.type.name === 'listItem'
    ) {
      listType = node.parentElement!.tagName
    }

    const slice = view.state.selection.content()
    const { dom, text } = serializeForClipboard(view, slice)

    event.dataTransfer.clearData()
    event.dataTransfer.setData('text/html', dom.innerHTML)
    event.dataTransfer.setData('text/plain', text)
    event.dataTransfer.effectAllowed = 'copyMove'
    event.dataTransfer.setDragImage(node, 0, 0)
    view.dragging = { slice, move: event.ctrlKey }
  }

  let dragHandleElement: HTMLElement | null = null

  function hideDragHandle() {
    if (dragHandleElement) {
      dragHandleElement.classList.add('hide')
    }
  }

  function showDragHandle() {
    if (dragHandleElement) {
      dragHandleElement.classList.remove('hide')
    }
  }

  function hideHandleOnEditorOut(event: MouseEvent) {
    if (event.relatedTarget instanceof Element) {
      const relatedTarget = event.relatedTarget as HTMLElement
      const isInsideEditor =
        relatedTarget?.classList.contains('tiptap') ||
        relatedTarget?.classList.contains('drag-handle')
      if (isInsideEditor) return
    }
    hideDragHandle()
  }

  return new Plugin({
    key: new PluginKey(options.pluginKey),
    view: (view) => {
      const handleBySelector = options.dragHandleSelector
        ? document.querySelector<HTMLElement>(options.dragHandleSelector)
        : null
      dragHandleElement = handleBySelector ?? document.createElement('div')
      dragHandleElement.draggable = true
      dragHandleElement.dataset.dragHandle = ''
      dragHandleElement.classList.add('drag-handle')

      dragHandleElement.addEventListener('dragstart', (e) => handleDragStart(e, view))
      dragHandleElement.addEventListener('drag', (e) => {
        hideDragHandle()
        const scrollY = window.scrollY
        if (e.clientY < options.scrollTreshold) {
          window.scrollTo({ top: scrollY - 30, behavior: 'smooth' })
        } else if (window.innerHeight - e.clientY < options.scrollTreshold) {
          window.scrollTo({ top: scrollY + 30, behavior: 'smooth' })
        }
      })

      hideDragHandle()
      if (!handleBySelector) {
        view?.dom?.parentElement?.appendChild(dragHandleElement)
      }
      view?.dom?.parentElement?.addEventListener('mouseout', hideHandleOnEditorOut)

      return {
        destroy: () => {
          if (!handleBySelector) {
            dragHandleElement?.remove?.()
          }
          dragHandleElement?.removeEventListener('dragstart', (e) => handleDragStart(e, view))
          dragHandleElement?.removeEventListener('drag', () => {})
          dragHandleElement = null
          view?.dom?.parentElement?.removeEventListener('mouseout', hideHandleOnEditorOut)
        },
      }
    },
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!view.editable) return

          const node = nodeDOMAtCoords(
            { x: event.clientX + 50 + options.dragHandleWidth, y: event.clientY },
            options,
          )
          const notDraggable = node?.closest('.not-draggable')
          const excludedTagList = options.excludedTags.concat(['ol', 'ul']).join(', ')

          if (!(node instanceof Element) || node.matches(excludedTagList) || notDraggable) {
            hideDragHandle()
            return
          }

          const compStyle = window.getComputedStyle(node)
          const parsedLineHeight = parseInt(compStyle.lineHeight, 10)
          const lineHeight = isNaN(parsedLineHeight) ? parseInt(compStyle.fontSize) * 1.2 : parsedLineHeight
          const paddingTop = parseInt(compStyle.paddingTop, 10)

          const rect = absoluteRect(node)
          rect.top += (lineHeight - 24) / 2
          rect.top += paddingTop
          if (node.matches('ul:not([data-type=taskList]) li, ol li')) {
            rect.left -= options.dragHandleWidth
          }
          rect.width = options.dragHandleWidth

          if (!dragHandleElement) return
          dragHandleElement.style.left = `${rect.left - rect.width}px`
          dragHandleElement.style.top = `${rect.top}px`
          showDragHandle()
        },
        keydown: () => hideDragHandle(),
        wheel: () => hideDragHandle(), // 替换 mousewheel 为 wheel
        dragstart: (view) => view.dom.classList.add('dragging'),
        drop: (view, event) => {
          view.dom.classList.remove('dragging')
          hideDragHandle()
          let droppedNode: Node | null = null
          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!dropPos) return

          if (view.state.selection instanceof NodeSelection) {
            droppedNode = view.state.selection.node
          }
          if (!droppedNode) return

          const resolvedPos = view.state.doc.resolve(dropPos.pos)
          const isDroppedInsideList = resolvedPos.parent.type.name === 'listItem'

          if (
            view.state.selection instanceof NodeSelection &&
            view.state.selection.node.type.name === 'listItem' &&
            !isDroppedInsideList &&
            listType === 'OL'
          ) {
            const newList = view.state.schema.nodes.orderedList?.createAndFill(null, droppedNode)
            if (newList) {
              const slice = new Slice(Fragment.from(newList), 0, 0)
              view.dragging = { slice, move: event.ctrlKey }
            }
          }
        },
        dragend: (view) => view.dom.classList.remove('dragging'),
      },
    },
  })
}

const GlobalDragHandle = Extension.create<GlobalDragHandleOptions>({
  name: 'globalDragHandle',

  addOptions() {
    return {
      dragHandleWidth: 20,
      scrollTreshold: 100,
      excludedTags: [],
      customNodes: [],
    }
  },

  addProseMirrorPlugins() {
    return [
      DragHandlePlugin({
        pluginKey: 'globalDragHandle',
        dragHandleWidth: this.options.dragHandleWidth,
        scrollTreshold: this.options.scrollTreshold,
        dragHandleSelector: this.options.dragHandleSelector,
        excludedTags: this.options.excludedTags,
        customNodes: this.options.customNodes,
      }),
    ]
  },
})

export default GlobalDragHandle