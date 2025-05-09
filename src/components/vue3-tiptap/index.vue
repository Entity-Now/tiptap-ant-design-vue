<template>
	<a-config-provider :getPopupContainer="getPopupContainer">
		<div ref="Vue3TiptapContainer" :class="['vue3-tiptap', isFullScreen ? 'editor--fullscreen' : '']">
			<template v-if='editor'>
				<Toolbar :editor="editor">
					<template #tool>
						<slot name="tool"></slot>
					</template>
				</Toolbar>
				<editor-content :editor="editor" class="editor" />
			</template>
			<handView />
			<!-- <span class="words">{{ wordCount }}字</span> -->
		</div>
	</a-config-provider>
</template>

<script setup lang="ts">
import { watch, onMounted, provide, ref } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Toolbar from "./toolbar/classic/index.vue";
import type { TiptapProps, TiptapEmits } from "./vue3-tiptap";
import { EditorKey, ToggleFullScreenKey, IsFullScreenKey, uploadImageKey, uploadVideoKey } from "./vue3-tiptap";
import handView from "./extension-view/hand-view.vue";
import {
	Focus,
	Underline,
	Color,
	Highlight,
	TextAlign,
	FontFamily,
	Link,
	Images,
	Video,
	Table,
	TableHeader,
	TableRow,
	CustomTableCell,
	CustomOrderedList,
	CustomBulletList,
	CustomIndent,
	CodeBlockLights,
	lowlight,
	searchReplace,
	Iframe,
	CustomTextStyle,
	FormatBrush,
	LineHeight,
	Hand
} from "./extensions/index";

const props = defineProps<TiptapProps>();
const emits = defineEmits(['update:content'])

const Vue3TiptapContainer = ref<HTMLDivElement | undefined>();
const extensions = [
	StarterKit.configure({
		orderedList: false,
		bulletList: false,
		codeBlock: false,
		blockquote: {
			HTMLAttributes: {
				class: "x-blockquote"
			}
		}
	}),
	Hand.configure({
		dragHandleSelector: ".vue3-drag-hand"
	}),
	Focus.configure({
		className: 'x-node-focused',
		mode: 'all',
	}),
	Underline.configure({
		HTMLAttributes: {
			class: "x-underline"
		}
	}),
	Color,
	Highlight.configure({
		multicolor: true
	}),
	TextAlign.configure({
		types: ["heading", "paragraph"]
	}),
	FontFamily,
	Link.configure({
		openOnClick: true,
		HTMLAttributes: {
			class: "x-link"
		}
	}),
	Images,
	Video,
	Table.configure({
		HTMLAttributes: {
			class: "vue3-table-view"
		},
		allowTableNodeSelection: true
	}),
	TableHeader,
	TableRow,
	CustomTableCell,
	CustomOrderedList,
	CustomBulletList,
	CustomIndent,
	CodeBlockLights.configure({ lowlight }),
	searchReplace,
	Iframe,
	CustomTextStyle,
	FormatBrush,
	LineHeight,
];

const wordCount = ref(0);
const editor = useEditor({
	content: props.content,
	editorProps: {
		attributes: {
			class: 'vue3-tiptap'
		}
	},
	extensions: props.extensions || extensions,
	onUpdate({ editor }) {
		getWordCount(editor);
		emits('update:content', editor.getHTML())
	}
});

const isFullScreen = ref(false);
const toggleFullscreen = () => {
	isFullScreen.value = !isFullScreen.value;
};
const getWordCount = (editor: any) => {
	const text = editor.getText();
	wordCount.value = text.length;
};
const getPopupContainer = (el: any, dialogContext: any)=>{
	return Vue3TiptapContainer.value;
}

provide(EditorKey, editor)
provide(uploadImageKey, props.uploadImage)
provide(uploadVideoKey, props.uploadVideo)
provide(IsFullScreenKey, isFullScreen.value);
provide(ToggleFullScreenKey, toggleFullscreen);


onMounted(() => {
	getWordCount(editor.value);
});
</script>

<style scoped>
.vue3-tiptap {
	height: 100%;
	border: 1px solid var(--main-primary-border);
	overflow: auto;
	border-radius: 5px;
	background-color: #fff;
}

:deep(.x-node-focused:not(.code-block-view):not(.vue3-table-view):not(table)) {
	background: rgb(245, 248, 252);
}

:deep(.vue3-tiptap) {
	padding-left: 50px;
}
</style>
