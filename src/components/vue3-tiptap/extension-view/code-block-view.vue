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
      <pre class="code-block-content">
        <node-view-content
          :class="`hljs language-${selectedLanguage}`"
          as="code"
        />
      </pre>
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
  //margin: 12px 0; /* 与拖拽把手协调的垂直间距 */
  border-radius: 6px; /* 圆角，现代感 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  overflow: hidden; /* 确保圆角生效 */
}

.code-block-container {
  position: relative;
  border: 1px solid #e8ecef; /* 柔和边框 */
  background: #f9fafb; /* 浅灰背景 */
  min-height: 120px; /* 紧凑最小高度 */
  max-height: 400px; /* 限制最大高度 */
  overflow-y: auto; /* 垂直滚动条 */
  padding: 0;
  box-sizing: border-box;

  .code-block-tools {
    position: sticky; /* 工具栏随滚动保持可见 */
    top: 0;
    z-index: 10;
    width: 100%;
    height: 42px; /* 进一步减小工具栏高度 */
    background: #ffffff; /* 白色背景 */
    border-bottom: 1px solid #e8ecef; /* 分隔线 */
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 8px;

    .language-select {
      width: 120px; /* 固定宽度 */
      font-size: 13px; /* 小字体 */
      color: #333;

      :deep(.ant-select-selector) {
        background: #f0f2f5 !important; /* 下拉框背景 */
        border-radius: 4px !important;
        height: 24px !important; /* 减小选择框高度 */
        display: flex;
        align-items: center;
        transition: background 0.2s;
      }

      :deep(.ant-select-selector:hover) {
        background: #e6f7ff !important; /* 悬浮效果，与拖拽把手一致 */
      }
    }
  }

  .code-block-content {
    margin: 0 !important; /* 移除 pre 的默认外边距 */
    padding: 4px  !important; /* 适配工具栏高度，优化间距 */
    background: transparent;
    overflow-x: auto; /* 横向滚动条 */
    font-family: 'Fira Code', 'Consolas', monospace; /* 代码字体 */
    font-size: 14px; /* 字体大小 */
    line-height: 1.4; /* 减小行高，紧凑布局 */

    .hljs, code {
      background: transparent !important; /* 避免高亮库干扰 */
      color: #24292e; /* 代码颜色 */
      margin: 0; /* 移除 code 的默认外边距 */
      padding: 0; /* 移除 code 的内边距 */
      display: block; /* 确保 code 块级显示 */
    }
  }
}

/* 自定义滚动条样式 */
.code-block-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-block-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.code-block-container::-webkit-scrollbar-thumb {
  background: #c1c7d0;
  border-radius: 4px;
}

.code-block-container::-webkit-scrollbar-thumb:hover {
  background: #a0a6b0;
}
</style>