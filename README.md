# tiptap-ant-design-vue⚡

> 基于 Vue3 +Ant-Design-Vue+Tiptap 二次开发一个包含常用功能富文本编辑器

## 演示

![tiptap-ant-design-vue](https://github.com/Entity-Now/tiptap-ant-design-vue/blob/master/public/preview.gif)

## 安装

```sh
npm i tiptap-ant-design-vue
```

## 简单使用

```js
<template>
	<Vue3Tiptap v-model:content="content" :uploadImage="uploadImageHandle" mode="bubble"/>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Vue3Tiptap from "@/components/vue3-tiptap/index.vue";
import "highlight.js/scss/github.scss"

const content = ref(``)

const uploadImageHandle = ()=>{
	console.log('上传记录..');
	return Promise.resolve({url: 'http://localhost:8888/src/assets/home-logo.jpeg',size: 123,fileName: 'name.png'})
}

watch(()=> content.value,(val)=>{
	console.log(val);
})
</script>
```

## 技术栈 🥇

核心：vue3 + ant-design-vue + vite

代码提交：husky、commitlint

代码格式化：preitter

## 感谢 🌸

本项目fork自[Vue3-Tiptap](https://github.com/htmlxudong/vue3-tiptap)，由于作者没有将其上传至npm，并且我需要添加一些额外功能，所以fork后重新发布。

## 更新日志 📄

- 2025/4/30
  - first commit
