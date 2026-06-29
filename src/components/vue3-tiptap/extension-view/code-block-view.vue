<template>
  <node-view-wrapper as="div" class="code-block-view">
    <div class="code-block-container">
      <div class="code-block-tools">
        <a-select
          ref="select"
          v-model:value="selectedLanguage"
          class="language-select"
          :bordered="false"
          :dropdown-match-select-width="false"
          @click.prevent
        >
          <a-select-option v-for="(language, index) in languages" :value="language" :key="index">
            {{ language }}
          </a-select-option>
        </a-select>
      </div>
      <!-- 代码块内容 -->
      <pre class="code-block-content"><node-view-content :class="`hljs language-${selectedLanguage}`" as="code" /></pre>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps, NodeViewContent } from '@tiptap/vue-3'
import { ref, computed } from 'vue'

const props = defineProps(nodeViewProps)
const languages = ref(props.extension.options.lowlight.listLanguages())

// 动态计算语言属性
const selectedLanguage = computed({
  get() {
    return props.node.attrs.language
  },
  set(language) {
    props.updateAttributes({ language })
  }
})
</script>

<style lang="scss" scoped>
.code-block-view {
  margin: 16px 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--secondary-gray, #e2e8f0);
  background: #f8fafc; /* Slate 50 background */
}

.code-block-container {
  position: relative;
  min-height: 80px;
  max-height: 450px;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;

  .code-block-tools {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    height: 32px; /* 紧凑高度 */
    background: #f1f5f9; /* Slate 100 background */
    border-bottom: 1px solid var(--secondary-gray, #e2e8f0);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 12px;

    .language-select {
      width: 95px; /* 更紧凑的宽度 */
      font-size: 12px;
      color: var(--accent-gray, #64748b);

      :deep(.ant-select-selector) {
        background: transparent !important;
        border-radius: 4px !important;
        height: 20px !important;
        display: flex;
        align-items: center;
        padding: 0 6px !important;
        transition: all 0.2s;
      }

      :deep(.ant-select-selector:hover) {
        background: rgba(47, 133, 90, 0.08) !important;
        color: var(--primary-green, #2f855a) !important;
      }

      :deep(.ant-select-selection-item) {
        font-size: 11px !important;
        line-height: 20px !important;
        font-weight: 500;
        color: var(--accent-gray, #64748b) !important;
      }
      
      :deep(.ant-select-arrow) {
        font-size: 9px;
        color: var(--accent-gray, #64748b) !important;
      }
    }
  }

  .code-block-content {
    margin: 0 !important;
    padding: 14px 18px !important; /* 舒适的代码缩进间距 */
    background: transparent;
    overflow-x: auto;
    font-family: Consolas, "Fira Code", "JetBrains Mono", Courier, monospace;
    font-size: 13px; /* 经典代码大小 */
    line-height: 1.55;

    .hljs, code {
      background: transparent !important;
      color: #334155; /* Slate 700 standard text */
      margin: 0;
      padding: 0;
      display: block;
    }
  }
}

/* 自定义滚动条样式 */
.code-block-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.code-block-container::-webkit-scrollbar-track {
  background: transparent;
}

.code-block-container::-webkit-scrollbar-thumb {
  background: var(--secondary-gray, #cbd5e1);
  border-radius: 3px;
}

.code-block-container::-webkit-scrollbar-thumb:hover {
  background: var(--accent-gray, #94a3b8);
}
</style>