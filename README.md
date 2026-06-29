# tiptap-ant-design-vue ⚡

> 基于 **Vue 3** + **Ant-Design-Vue** + **Tiptap** 二次开发的高开箱即用富文本编辑器。

本项目在原生 `Tiptap` 的基础上进行了深度的定制化组件封装与交互优化，支持行内图片调整、拖动调节大小、全局块级元素无缝拖拽、动态上传配置以及自定义工具栏布局等高级交互，旨在打造一个流畅、优雅的现代富文本编辑体验。

---

## 演示 🎬

![tiptap-ant-design-vue](https://github.com/Entity-Now/tiptap-ant-design-vue/blob/master/public/preview.gif)

---

## 特性 🌟

- **无缝全局拖拽**: 集成全局块级拖拽手柄，支持一键上下拖拽块级元素（如段落、标题、代码块、列表项等），并解决拖拽后元素在原位置残留/复制的 Bug。
- **优雅的图片管理**:
  - 点击图片后提供丰富的定位快捷工具栏：**行内排列**、**块级左对齐**、**块级居中**、**块级右对齐**、**向左浮动**、**向右浮动**。
  - 支持 **25%**、**50%**、**100%** 的百分比宽度预设，且可以一键恢复**原图大小**。
  - 全新升级的鼠标拖拽调节尺寸算法：自动从当前视觉 client bounds 开启计算，彻底解决百分比模式下尺寸错乱问题。
- **统一图片插入模态框**: 抛弃繁杂的 popover，点击图片工具直接弹出 Tab 式对话框，支持 **图片链接**、**本地上传 (Base64)**、**上传到服务器**。
- **自定义工具栏 (Toolbar)**: 支持传入 `toolbar` 列表，完美适配不同业务场景（如：全功能博客编辑模式 vs 极简评论/回复框模式）。
- **动态上传配置**: 自动检测用户是否传入了特定的媒体上传回调事件（图片、视频、PDF）。若未配置，相关插入选项/标签页会在工具栏中智能隐藏，避免暴露不可用功能。

---

## 安装 📦

使用你喜爱的包管理器安装组件：

```sh
# npm
npm i tiptap-ant-design-vue

# pnpm
pnpm add tiptap-ant-design-vue

# yarn
yarn add tiptap-ant-design-vue
```

---

## 快速使用 🚀

```vue
<template>
  <div style="height: 600px;">
    <Vue3Tiptap 
      v-model:content="content" 
      :uploadImage="uploadImageHandle" 
      mode="classic"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Vue3Tiptap from "tiptap-ant-design-vue";
import "tiptap-ant-design-vue/lib/tiptap-ant-design-vue.css"
import "highlight.js/scss/github.scss" // 代码块高亮样式

const content = ref('<p>Hello <b>Tiptap</b>!</p>')

// 模拟图片上传接口
const uploadImageHandle = () => {
  console.log('开始图片上传流程...');
  return Promise.resolve({
    url: 'https://picsum.photos/400/300',
    size: 20480,
    fileName: 'demo.png'
  })
}

watch(() => content.value, (val) => {
  console.log('编辑器内容更新:', val);
})
</script>
```

---

## 属性配置 (Props) ⚙️

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `content` | `string` | `''` | 编辑器的 HTML 内容（支持 `v-model:content` 双向绑定） |
| `mode` | `'classic' \| 'bubble'` | `'classic'` | 编辑器模式。`classic`：传统顶部工具栏；`bubble`：选中悬浮气泡菜单 |
| `toolbar` | `string[]` | `[]` | 自定义工具栏的展示项。如果为空或不传，则默认显示全部功能。 |
| `uploadImage` | `() => Promise<UploadResponse>` | `undefined` | 图片上传到后台的回调。若未定义，图片上传模态框中的“上传到服务器” Tab 会被自动隐藏。 |
| `uploadVideo` | `() => Promise<UploadResponse>` | `undefined` | 视频上传到后台的回调。若未定义，整个视频工具栏按钮将默认隐藏。 |
| `uploadPdf` | `() => Promise<UploadResponse>` | `undefined` | PDF上传到后台的回调。若未定义，整个PDF工具栏按钮将默认隐藏。 |

### `UploadResponse` 结构说明

所有后台上传回调都需要返回一个满足以下结构的 `Promise`：
```typescript
interface UploadResponse {
  url: string;      // 上传成功后的外链地址 (必填)
  size?: number;    // 文件大小 (选填)
  fileName: string; // 文件名 (必填)
}
```

---

## Toolbar 布局定制 🛠️

你可以通过给 `toolbar` 属性传入指定的字符串列表来过滤可见的工具项，以适配不同的业务场景（例如评论回复模式）：

```vue
<!-- 极简评论模式 -->
<Vue3Tiptap 
  v-model:content="commentText" 
  :toolbar="['bold', 'italic', 'underline', 'image']" 
/>
```

### 支持的工具项别名 (Alias)

系统支持大小写不敏感且自动兼容连字符/下划线的别名过滤：

- **撤销/重做**: `undo`, `redo`
- **基础格式**: `bold` (粗体), `italic` (斜体), `underline` (下划线), `strike` (删除线), `clear-format` (清除格式)
- **排版对齐**: `align` (居左/居中/居右/两端对齐), `indent` (缩进), `outdent` (取消缩进), `horizontal-rule` (水平分割线), `line-height` (行高)
- **字体样式**: `font-size` (字号), `font-family` (字体), `font-color` (字色), `bg-color` (背景色), `header` (标题层级)
- **区块控制**: `blockquote` (引用区块), `code-block` (代码块), `table` (表格)
- **高级媒体**: `link` (添加链接), `image` (图片), `video` (视频), `pdf` (PDF阅读器)
- **辅助功能**: `search` (文本查找与替换), `fullscreen` (全屏切换)

---

## 功能列表与开发进度 📋

- [x] **文字基本排版** (粗体、斜体、下划线、删除线、清除格式)
- [x] **段落装饰** (自定义字号、字体系列、文本颜色、背景高亮、段落行高、对齐方式)
- [x] **区块引用** (Blockquote) 与 **行内/区块代码高亮** (lowlight)
- [x] **块级全局无缝拖拽** (基于 GlobalDragHandle)
- [x] **图片深度管理** (支持百分比快捷缩放、鼠标点选按比例拉伸、多种块/浮动布局排列、本地 Base64 / 远程 URL / 后端直传 Tab 对话框)
- [x] **视频媒体嵌入** (支持网络地址引入、Base64视频预览、后台视频上传过滤)
- [x] **PDF 附件与内联展示** (支持链接式附件插入、内嵌 Iframe PDF 阅读器渲染、后台上传控制)
- [x] **响应式表格操作** (动态插入行/列，合并单元格，清除表格，可视化拖拉高宽)
- [x] **多端模式切换** (传统顶部 Classic 布局、轻量化选中 Bubble 悬浮弹窗)
- [x] **辅助工具** (全局查找与替换、一键全屏编辑)

---

## 感谢 💖

本项目 fork 自 [Vue3-Tiptap](https://github.com/htmlxudong/vue3-tiptap)。在此基础上完成了对于 Ant Design Vue v4/v3 的深度适配，增加了大量实用的交互特性与 BUG 修复，并正式打包上传至 npm。

---

## 开源协议 📄

本项目基于 [MIT](LICENSE) 协议开源。
