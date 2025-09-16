<template>
  <div :class="['vue3-drag-hand', visible ? 'active' : '']">
    <a-dropdown :open="visible" @openChange="e=> visible = e" :trigger="['click']" :getPopupContainer="(el)=> el.parentNode" :destroyPopupOnHide="true">
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

const props = defineProps<{ editor: Editor }>()
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
  transition: opacity 0.3s ease, transform 0.2s ease;
  z-index: 50;
  width: 28px; /* 略增宽度，优化视觉 */
  margin-left: -24px; /* 调整偏移 */
  margin-top: 2px; /* 微调垂直位置 */
  transform: translateY(0); /* 用于动画效果 */
}

.vue3-drag-hand.hide {
  opacity: 0;
  transform: translateY(-10px); /* 隐藏时轻微上移 */
  pointer-events: none;
}
.vue3-drag-hand.active.hide{
  opacity: 1;
  transform: translateY(0); /* 保持位置 */
  pointer-events: auto;
}

.vue3-drag-hand .icon {
  padding: 6px;
  font-size: 18px;
  color: #fff;
  border-radius: 6px;
  background: var(--primary-green, #52c41a); /* 默认绿色背景 */
  transition: all 0.3s ease; /* 统一过渡效果 */
  cursor: grab;
}

.vue3-drag-hand .icon:hover {
  background: var(--selection-bg, #1890ff); /* 悬浮蓝色 */
  transform: scale(1.1); /* 轻微放大 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); /* 增加阴影 */
}

.custom-menu-wrapper {
  max-height: 260px;
  overflow-y: auto;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* 更柔和阴影 */
  animation: fadeIn 0.2s ease-in; /* 淡入动画 */
}

.custom-menu {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 更紧凑间距 */
  width: 140px; /* 固定宽度，优化对齐 */
  padding: 0;
  background: transparent;
}

.tool-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  min-height: 32px;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tool-menu-item:hover {
  background: #e6f7ff;
  color: #1890ff; /* 悬浮时文字变蓝 */
  transform: translateX(2px); /* 轻微右移动画 */
}

.menu-item-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 自定义滚动条样式 */
.custom-menu-wrapper::-webkit-scrollbar {
  width: 6px;
}

.custom-menu-wrapper::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.custom-menu-wrapper::-webkit-scrollbar-thumb {
  background: #bfbfbf;
  border-radius: 4px;
}

.custom-menu-wrapper::-webkit-scrollbar-thumb:hover {
  background: #8c8c8c;
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>