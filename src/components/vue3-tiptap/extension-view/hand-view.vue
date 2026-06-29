<template>
  <div :class="['vue3-drag-hand', 'hide', visible ? 'active' : '']">
    <a-dropdown :open="visible" @openChange="(e: any) => visible = e" :trigger="['click']" :getPopupContainer="(el: any) => el.parentNode" :destroyPopupOnHide="true">
      <DragOutlined class="icon drag-hand" />
      <template #overlay>
        <div class="custom-menu-wrapper">
          <a-menu class="custom-menu">
            <a-menu-item
              v-for="(item, index) in insertMenu"
              :key="`insert-${index}`"
              class="tool-menu-item"
              @click="handCommand(item.command)"
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
import { ref, reactive } from 'vue'
import { Editor } from '@tiptap/core'
import { Node } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import { DragOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ editor?: Editor }>()
const visible = ref(false)

interface InsertMenuItem {
  text: string
  command: (editor: Editor) => void
}

const insertMenu = reactive<InsertMenuItem[]>([
  {
    text: '插入新行',
    command: (editor: Editor) => {
      if (!editor) {
        console.warn('Editor is not initialized')
        return
      }
      editor.commands.createParagraphNear()
    },
  },
  {
    text: '代码块',
    command: (editor: Editor) => {
      if (!editor) {
        console.warn('Editor is not initialized')
        return
      }
      // 切换代码块状态
      editor.chain().focus().toggleCodeBlock().run()
    },
  },
  {
    text: '恢复默认节点',
    command: (editor: Editor) => {
      if (!editor) {
        console.warn('Editor is not initialized')
        return
      }
      editor.commands.clearNodes();
    }
  },
  {
    text: '删除',
    command: (editor: Editor) => {
      if (!editor) {
        console.warn('Editor is not initialized')
        return
      }
      editor.commands.deleteSelection();
    }
  },
])

const handCommand = (command: (editor: Editor) => void) => {
  if (props.editor) {
    command(props.editor)
    visible.value = false
  } else {
    console.warn('Editor instance is not available')
  }
}

</script>

<style lang="scss">
.vue3-drag-hand {
  position: fixed;
  display: flex;
  align-items: center;
  opacity: 1;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 50;
  width: 24px;
  height: 24px;
  transform: translateY(0);
}

.vue3-drag-hand.hide {
  opacity: 0;
  transform: translateY(-5px);
  pointer-events: none;
}
.vue3-drag-hand.active.hide{
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.vue3-drag-hand .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 16px;
  color: var(--accent-gray, #a0aec0);
  border-radius: 4px;
  background: transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
  border: 1px solid transparent;
}

.vue3-drag-hand .icon:hover {
  background: rgba(47, 133, 90, 0.08); /* 契合主题绿的半透明背景 */
  color: var(--primary-green, #2f855a);
  border-color: rgba(47, 133, 90, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.vue3-drag-hand .icon:active {
  cursor: grabbing;
  transform: scale(0.95);
  background: rgba(47, 133, 90, 0.15);
}

.custom-menu-wrapper {
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--secondary-gray, #e2e8f0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 130px;
  padding: 0;
  background: transparent;
  border: none;
}

.tool-menu-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  min-height: 32px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--primary-gray, #4a5568);
  transition: all 0.15s ease;
  cursor: pointer;
}

.tool-menu-item:hover {
  background: rgba(47, 133, 90, 0.08);
  color: var(--primary-green, #2f855a) !important;
  transform: translateX(2px);
}

.menu-item-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 自定义滚动条样式 */
.custom-menu-wrapper::-webkit-scrollbar {
  width: 4px;
}

.custom-menu-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.custom-menu-wrapper::-webkit-scrollbar-thumb {
  background: var(--accent-gray, #a0aec0);
  border-radius: 4px;
}

.custom-menu-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--primary-gray, #4a5568);
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>