<template>
	<div class="toolbar">
		<ToolTemplate v-for="tool in visibleToolbars" :editor="editor" :option="tool" :key="tool.name" />

		<!-- 链接 -->
		<LinkTool v-if="isToolVisible('link')" :editor="editor" />
		
		<Dvider v-if="isToolVisible('divider') || isToolVisible('|')" />
		<!-- 格式刷 -->
		<FormatBrush v-if="isToolVisible('format-brush') || isToolVisible('formatbrush')" :editor="editor" />
		<!-- 字号 -->
		<FontSize v-if="isToolVisible('font-size') || isToolVisible('fontsize')" :editor="editor" />
		<!-- 行高 -->
		<LineHeight v-if="isToolVisible('line-height') || isToolVisible('lineheight')" :editor="editor" />
		<FontColor v-if="isToolVisible('font-color') || isToolVisible('fontcolor')" :editor="editor" />
		<BgColor v-if="isToolVisible('bg-color') || isToolVisible('bgcolor')" :editor="editor" />
		<HeaderTool v-if="isToolVisible('header')" :editor="editor" />
		<FontFamily v-if="isToolVisible('font-family') || isToolVisible('fontfamily')" :editor="editor" />
		<ImageTool v-if="isToolVisible('image')" :editor="editor" />
		<VideoTool v-if="isToolVisible('video')" :editor="editor" />
		<PdfTool v-if="isToolVisible('pdf')" :editor="editor" />
		<TableTool v-if="isToolVisible('table')" :editor="editor" />
		<!-- 文本对齐 -->
		<FontAlign v-if="isToolVisible('align')" :editor="editor" />
		<!-- 有序列表 -->
		<OrderedList v-if="isToolVisible('ordered-list') || isToolVisible('orderedlist')" :editor="editor" />
		<!-- 无序列表 -->
		<BulletList v-if="isToolVisible('bullet-list') || isToolVisible('bulletlist')" :editor="editor" />

		<!-- 全屏 -->
		<FullScreen v-if="isToolVisible('fullscreen')" :editor="editor" />
		<!-- 查找与替换 -->
		<Teleport to="body">
			<FindReplace :editor="editor" :visible="visible" :closeModal="closeModal" />
		</Teleport>

		<!-- 自定义 toolbar 插槽 -->
		<slot name="tool"></slot>
	</div>
</template>

<script setup lang="ts">
import type { Editor } from "@tiptap/core";
import type { OptionProps } from "./classic";
import { reactive, computed } from "vue";
import { createToolbarOptions } from "./classic-options";
import { useModal } from "@/hooks/useModal";
import ToolTemplate from "./tool-template.vue";
import Dvider from "@/components/dvider";
import FontColor from "./color/font-color.vue";
import BgColor from "./color/bg-color.vue";
import HeaderTool from "./header-tool.vue";
import FontFamily from "./font-style/font-family.vue";
import ImageTool from "./image-tool.vue";
import VideoTool from "./video-tool.vue";
import PdfTool from "./pdf-tool.vue";
import TableTool from "./table/table-tool.vue";
import OrderedList from "./ordered-list.vue";
import BulletList from "./bullet-List.vue";
import LinkTool from "./link-tool.vue";
import FullScreen from "./fullscreen.vue";
import FindReplace from "./find-replace/find-replace.vue";
import FontSize from "./font-style/font-size.vue";
import FontAlign from "./font-style/font-align.vue";
import FormatBrush from "./format-brush.vue";
import LineHeight from "./font-style/line-height.vue";

interface ToolbarProps {
	editor: Editor;
	toolbar?: string[];
}

const props = defineProps<ToolbarProps>();
const { visible, toggleModal, closeModal } = useModal();

const toolbars: OptionProps[] = reactive(
	createToolbarOptions(props.editor, {
		searchoutlined: {
			toggleModal
		}
	})
);

const isToolVisible = (name: string) => {
	if (!props.toolbar || props.toolbar.length === 0) {
		return true;
	}
	const cleanName = name.toLowerCase().replace(/[-_]/g, "");
	return props.toolbar.some(t => {
		const cleanT = t.toLowerCase().replace(/[-_]/g, "");
		return cleanT === cleanName || isNameMatched(cleanName, cleanT);
	});
};

const isNameMatched = (cleanName: string, cleanT: string) => {
	if (cleanT === "undo" && cleanName === "undooutlined") return true;
	if (cleanT === "redo" && cleanName === "redooutlined") return true;
	if ((cleanT === "clearformat" || cleanT === "clear") && cleanName === "deleteoutlined") return true;
	if ((cleanT === "horizontal" || cleanT === "horizontalrule") && cleanName === "minusoutlined") return true;
	if (cleanT === "indent" && cleanName === "menuunfoldoutlined") return true;
	if (cleanT === "outdent" && cleanName === "menufoldoutlined") return true;
	if (cleanT === "codeblock" && cleanName === "codeblock") return true;
	if (cleanT === "search" && cleanName === "searchoutlined") return true;
	if (cleanT === "unsetlink" && cleanName === "unsetlink") return true;
	return false;
};

const visibleToolbars = computed(() => {
	return toolbars.filter(tool => isToolVisible(tool.name));
});
</script>

<style scoped>
.toolbar {
	display: flex;
	align-items: center;
	gap: 3px;
	flex-shrink: 0;
	flex-wrap: wrap;
	box-sizing: border-box;
	padding: 5px 8px;
	position: relative;
}

.toolbar::before {
	bottom: 0;
	background-color: var(--main-primary-border);
	content: "";
	height: 1px;
	left: 0;
	margin: 0 10px;
	right: 0;
	position: absolute;
}
</style>
