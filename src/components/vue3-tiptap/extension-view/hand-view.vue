<template>
  <!-- 拖拽和功能下拉菜单 -->
  <div class="vue3-drag-hand">
    <a-dropdown>
      <DragOutlined class="icon drag-hand" />
      <template #overlay>
        <div class="custom-menu-wrapper">
          <a-menu class="custom-menu">
            <!-- 插入功能 -->
            <a-menu-item
              v-for="(item, index) in insertMenu"
              :key="`insert-${index}`"
              class="tool-menu-item"
              @click="item.command"
            >
              <span class="menu-item-text">{{ item.text }}</span>
            </a-menu-item>
           
          </a-menu>
        </div>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { inject, reactive } from 'vue'
import type { Ref } from 'vue'
import type { Editor } from '@tiptap/core'
import { EditorKey } from '../vue3-tiptap'
import { DragOutlined } from '@ant-design/icons-vue'

// 注入 Tiptap 编辑器实例
const props = defineProps<{ editor: Editor }>()

// 插入功能菜单
const insertMenu = reactive([
  {
    text: '插入新行',
    command: () => {
      if (!props.editor) return
      const { state, view } = props.editor
      const { $from } = state.selection
      const insertPos = $from.after()
      const paragraph = state.schema.nodes.paragraph.create()
      const tr = state.tr.insert(insertPos, paragraph)
      view.dispatch(tr)
      props.editor.commands.focus(insertPos + 1)
    },
  },
  {
    text: '换行',
    command: () => props.editor?.chain().focus().setHardBreak().run(),
  },
  {
    text: '代码块',
    command: () => props.editor?.chain().focus().toggleCodeBlock().run(),
  },
  {
    text: '删除',
    command: () => {
      if (!props?.editor) return
      const { state, commands } = props.editor
      const { $from } = state.selection
      const nodeType = $from.node(1).type.name
      if (nodeType === 'table') {
        commands.deleteTable()
      } else {
        commands.deleteNode(nodeType)
      }
    },
  }
])

</script>

<style lang="scss">
.vue3-drag-hand {
  position: fixed !important;
  display: flex;
  flex-direction: row;
  opacity: 1;
  transition: opacity 0.2s ease-in;
  z-index: 50; /* 与代码块协调 */
  width: 24px; /* 调整宽度，仅一个图标 */
  margin-left: -20px; /* 保持偏移，避免遮挡内容 */
  margin-top: 2px; /* 微调垂直位置 */
}

.vue3-drag-hand .icon {
    padding: 4px;
  font-size: 18px; /* 保持原图标大小 */
  font-weight: 600;
  color: white;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
  background:var(--primary-green);
  &:hover {
    background-color: var(--selection-bg); /* 与代码块悬浮效果一致 */
  }
}

.vue3-drag-hand .drag-hand {
  cursor: grab;
}

.vue3-drag-hand.hide {
  opacity: 0;
  pointer-events: none;
}

.custom-menu-wrapper {
  max-height: 240px; /* 紧凑高度 */
  overflow-y: auto; /* 垂直滚动条 */
  padding: 6px;
  background: #ffffff;
  border-radius: 6px; /* 与代码块圆角一致 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 与代码块阴影一致 */
}

.custom-menu {
  display: flex;
  flex-direction: column;
  gap: 6px; /* 紧凑间距 */
  width: auto; /* 紧凑宽度 */
  padding: 0;
  background: transparent;
}

.tool-menu-item {
  display: flex;
  align-items: center;
  justify-content: start;
  padding: 6px; /* 紧凑内边距 */
  min-height: 28px; /* 紧凑高度 */
  border-radius: 4px;
  font-size: 13px; /* 紧凑字体 */
  color: #333;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e6f7ff; /* 与代码块一致 */
  }

  .menu-item-text {
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; /* 长文本省略 */
  }
}

/* 分割线样式 */
:deep(.ant-menu-divider) {
  grid-column: span 3; /* 跨3列 */
  margin: 6px 0;
  border-top: 1px solid #e8ecef; /* 与代码块边框一致 */
}

/* 自定义滚动条样式，与代码块一致 */
.custom-menu-wrapper::-webkit-scrollbar {
  width: 6px;
}

.custom-menu-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.custom-menu-wrapper::-webkit-scrollbar-thumb {
  background: #c1c7d0;
  border-radius: 4px;
}

.custom-menu-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a0a6b0;
}
</style>