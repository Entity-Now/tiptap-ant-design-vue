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
  dropTargetClass?: string
}

function absoluteRect(node: Element) {
  const data = node.getBoundingClientRect()
  const modal = node.closest('[data-display="translate"]')
  const displayModal = node.closest('[data-display="flex"]')

  if (modal && window.getComputedStyle(modal).transform !== 'none') {
    const modalRect = modal.getBoundingClientRect()
    return {
      top: data.top - modalRect.top,
      left: data.left - modalRect.left,
      width: data.width,
    }
  }
  if(displayModal && window.getComputedStyle(displayModal)){
    const modalRect = displayModal.getBoundingClientRect()
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
    '[data-type="taskItem"]',
    'table',
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

function isBlockContainer(name: string) {
  return name === 'doc' || name === 'tableCell' || name === 'bulletList' || name === 'orderedList' || name === 'taskList' || name === 'blockquote'
}

function calcNodePos(pos: number, view: EditorView) {
  const $pos = view.state.doc.resolve(pos)
  for (let d = $pos.depth; d >= 0; d--) {
    const nodeName = $pos.node(d).type.name
    if (isBlockContainer(nodeName)) {
      if ($pos.depth > d) {
        return $pos.before(d + 1)
      }
    }
  }
  return pos
}

function DragHandlePlugin(options: GlobalDragHandleOptions & { pluginKey: string }) {
  let listType = ''
  let dragHandleElement: HTMLElement | null = null
  let draggedDOMElement: HTMLElement | null = null
  let lastDropTargetDOM: HTMLElement | null = null
  let dragStartFrom = -1
  let dragStartTo = -1
  let draggedNode: Node | null = null

  let boundDragStart: ((e: DragEvent) => void) | null = null
  let boundClick: ((e: MouseEvent) => void) | null = null
  let boundDrag: ((e: DragEvent) => void) | null = null

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

  function handleDrag(e: DragEvent) {
    hideDragHandle()
    const scrollY = window.scrollY
    if (e.clientY < options.scrollTreshold) {
      window.scrollTo({ top: scrollY - 30, behavior: 'smooth' })
    } else if (window.innerHeight - e.clientY < options.scrollTreshold) {
      window.scrollTo({ top: scrollY + 30, behavior: 'smooth' })
    }
  }

  function clearDropTarget() {
    const dropTargetClass = options.dropTargetClass || 'tiptap-drop-target'
    if (lastDropTargetDOM) {
      lastDropTargetDOM.classList.remove(dropTargetClass)
      lastDropTargetDOM.classList.remove(`${dropTargetClass}-above`)
      lastDropTargetDOM.classList.remove(`${dropTargetClass}-below`)
      lastDropTargetDOM = null
    }
    const targets = document.querySelectorAll(
      `.${dropTargetClass}, .${dropTargetClass}-above, .${dropTargetClass}-below`
    )
    targets.forEach((el) => {
      el.classList.remove(dropTargetClass)
      el.classList.remove(`${dropTargetClass}-above`)
      el.classList.remove(`${dropTargetClass}-below`)
    })
  }

  function getDragHandle(view: EditorView): HTMLElement {
    if (dragHandleElement) return dragHandleElement

    const handleBySelector = options.dragHandleSelector
      ? view.dom.parentElement?.querySelector<HTMLElement>(options.dragHandleSelector) || document.querySelector<HTMLElement>(options.dragHandleSelector)
      : null

    dragHandleElement = handleBySelector ?? document.createElement('div')
    
    if (!dragHandleElement.dataset.dragHandleInitialized) {
      dragHandleElement.draggable = true
      dragHandleElement.dataset.dragHandle = ''
      dragHandleElement.dataset.dragHandleInitialized = 'true'
      if (!dragHandleElement.classList.contains('drag-handle')) {
        dragHandleElement.classList.add('drag-handle')
      }

      boundDragStart = (e) => handleDragStart(e, view)
      boundClick = (e) => handleClick(e, view)
      boundDrag = handleDrag

      dragHandleElement.addEventListener('dragstart', boundDragStart)
      dragHandleElement.addEventListener('click', boundClick)
      dragHandleElement.addEventListener('drag', boundDrag)

      if (!handleBySelector) {
        view?.dom?.parentElement?.appendChild(dragHandleElement)
      }
    }

    return dragHandleElement
  }

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
    dragStartFrom = selection.from
    dragStartTo = selection.to
    draggedNode = selection instanceof NodeSelection ? selection.node : null

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
    view.dragging = { slice, move: !event.ctrlKey }

    // Fade out original source block
    let blockDOM = node
    while (blockDOM && blockDOM.parentElement && !blockDOM.parentElement.classList.contains('ProseMirror')) {
      blockDOM = blockDOM.parentElement
    }
    if (blockDOM) {
      draggedDOMElement = blockDOM as HTMLElement
      setTimeout(() => {
        if (draggedDOMElement) {
          draggedDOMElement.classList.add('tiptap-dragging-source')
        }
      }, 0)
    }
  }

  function handleClick(event: MouseEvent, view: EditorView) {
    view.focus()

    const node = nodeDOMAtCoords(
      { x: event.clientX + 50 + options.dragHandleWidth, y: event.clientY },
      options,
    )
    if (!(node instanceof Element)) return

    let nodePos = nodePosAtDOM(node, view, options)
    if (nodePos == null || nodePos < 0) return
    nodePos = calcNodePos(nodePos, view)

    const selection = NodeSelection.create(view.state.doc, nodePos)
    view.dispatch(view.state.tr.setSelection(selection))
  }

  function handleDragOver(view: EditorView, event: DragEvent) {
    const coords = { x: event.clientX, y: event.clientY }
    const node = nodeDOMAtCoords(coords, options)
    const dropTargetClass = options.dropTargetClass || 'tiptap-drop-target'

    if (node instanceof Element) {
      let blockNode = node
      while (blockNode.parentElement && !blockNode.parentElement.classList.contains('ProseMirror')) {
        blockNode = blockNode.parentElement
      }

      if (blockNode && blockNode.parentElement?.classList.contains('ProseMirror')) {
        const blockEl = blockNode as HTMLElement
        if (blockEl !== lastDropTargetDOM) {
          clearDropTarget()
          lastDropTargetDOM = blockEl
        }
        
        blockEl.classList.add(dropTargetClass)
        
        const rect = blockEl.getBoundingClientRect()
        const relativeY = event.clientY - rect.top
        if (relativeY < rect.height / 2) {
          blockEl.classList.add(`${dropTargetClass}-above`)
          blockEl.classList.remove(`${dropTargetClass}-below`)
        } else {
          blockEl.classList.add(`${dropTargetClass}-below`)
          blockEl.classList.remove(`${dropTargetClass}-above`)
        }
      } else {
        clearDropTarget()
      }
    } else {
      clearDropTarget()
    }
  }

  function hideHandleOnEditorOut(event: MouseEvent) {
    if (event.relatedTarget instanceof Element) {
      const relatedTarget = event.relatedTarget as HTMLElement
      const isInsideEditor =
        relatedTarget?.classList.contains('tiptap') ||
        relatedTarget?.closest('.tiptap') ||
        relatedTarget?.classList.contains('drag-handle') ||
        relatedTarget?.closest('.drag-handle') ||
        relatedTarget?.closest('.vue3-drag-hand')
      if (isInsideEditor) return
    }
    hideDragHandle()
  }

  return new Plugin({
    key: new PluginKey(options.pluginKey),
    view: (view) => {
      // Lazy initialization triggered on mousemove
      view?.dom?.parentElement?.addEventListener('mouseout', hideHandleOnEditorOut)

      return {
        destroy: () => {
          const handleBySelector = options.dragHandleSelector
            ? document.querySelector<HTMLElement>(options.dragHandleSelector)
            : null
          if (!handleBySelector && dragHandleElement) {
            dragHandleElement.remove?.()
          }
          if (dragHandleElement) {
            if (boundDragStart) dragHandleElement.removeEventListener('dragstart', boundDragStart)
            if (boundClick) dragHandleElement.removeEventListener('click', boundClick)
            if (boundDrag) dragHandleElement.removeEventListener('drag', boundDrag)
          }
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

          let draggedNodePos = nodePosAtDOM(node, view, options)
          if (draggedNodePos == null || draggedNodePos < 0) {
            hideDragHandle()
            return
          }
          draggedNodePos = calcNodePos(draggedNodePos, view)

          const blockDOM = view.nodeDOM(draggedNodePos)
          if (!(blockDOM instanceof Element)) {
            hideDragHandle()
            return
          }

          const handle = getDragHandle(view)

          if (handle.classList.contains('active')) {
            return;
          }

          const compStyle = window.getComputedStyle(blockDOM)
          const parsedLineHeight = parseInt(compStyle.lineHeight, 10)
          const lineHeight = isNaN(parsedLineHeight) ? parseInt(compStyle.fontSize) * 1.2 : parsedLineHeight
          const paddingTop = parseInt(compStyle.paddingTop, 10)

          const rect = absoluteRect(blockDOM)
          rect.top += paddingTop
          if (blockDOM.matches('ul:not([data-type=taskList]) li, ol li')) {
            rect.left -= options.dragHandleWidth
          }
          rect.width = options.dragHandleWidth

          handle.style.left = `${rect.left - rect.width}px`
          handle.style.top = `${rect.top}px`
          showDragHandle()
        },
        keydown: () => hideDragHandle(),
        wheel: () => hideDragHandle(),
        dragstart: (view) => {
          view.dom.classList.add('dragging')
        },
        dragover: (view, event) => {
          handleDragOver(view, event)
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move'
          }
          return false
        },
        dragleave: (view, event) => {
          if (!view.dom.contains(event.relatedTarget as any)) {
            clearDropTarget()
          }
          return false
        },
        drop: (view, event) => {
          clearDropTarget()
          if (draggedDOMElement) {
            draggedDOMElement.classList.remove('tiptap-dragging-source')
            draggedDOMElement = null
          }
          view.dom.classList.remove('dragging')
          hideDragHandle()
          
          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!dropPos) return false

          const resolvedPos = view.state.doc.resolve(dropPos.pos)
          const isDroppedInsideList = resolvedPos.parent.type.name === 'listItem'

          if (
            draggedNode &&
            draggedNode.type.name === 'listItem' &&
            !isDroppedInsideList &&
            listType === 'OL'
          ) {
            const newList = view.state.schema.nodes.orderedList?.createAndFill(null, draggedNode)
            if (newList) {
              const slice = new Slice(Fragment.from(newList), 0, 0)
              view.dragging = { slice, move: !event.ctrlKey }
            }
          }

          const dragging = view.dragging as any
          if (!dragging || !dragging.slice) return false

          let insertPos = dropPos.pos
          let tr = view.state.tr
          const isMove = dragging.move

          if (isMove && dragStartFrom !== -1 && dragStartTo !== -1) {
            tr.delete(dragStartFrom, dragStartTo)
            insertPos = tr.mapping.map(insertPos)
          }

          tr.replace(insertPos, insertPos, dragging.slice)
          view.dispatch(tr)

          // Reset tracking variables after successful drop
          dragStartFrom = -1
          dragStartTo = -1
          draggedNode = null

          event.preventDefault()
          return true
        },
        dragend: (view) => {
          clearDropTarget()
          if (draggedDOMElement) {
            draggedDOMElement.classList.remove('tiptap-dragging-source')
            draggedDOMElement = null
          }
          view.dom.classList.remove('dragging')

          // Reset tracking variables in dragend as a fallback
          dragStartFrom = -1
          dragStartTo = -1
          draggedNode = null
        },
      },
    },
  })
}

const GlobalDragHandle = Extension.create<GlobalDragHandleOptions>({
  name: 'globalDragHandle',

  addOptions() {
    return {
      dragHandleWidth: 35,
      scrollTreshold: 100,
      excludedTags: [],
      customNodes: [],
      dropTargetClass: 'tiptap-drop-target',
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
        dropTargetClass: this.options.dropTargetClass,
      }),
    ]
  },
})

export default GlobalDragHandle