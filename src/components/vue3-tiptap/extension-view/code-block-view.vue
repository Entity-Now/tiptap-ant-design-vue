<template>
	<node-view-wrapper as="div" class="code-block-view">
		<div class="code-block-container">
			<div class="code-block-tools">
				<a-select ref="select" v-model:value="selectedLanguage" @click.prevent>
					<a-select-option v-for="(language, index) in languages" :value="language" :key="index">{{
						language
					}}</a-select-option>
				</a-select>
			</div>
			<!-- NodeViewContent将可编辑内容添加到节点视图中 -->
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
import { NodeViewWrapper, nodeViewProps, NodeViewContent } from "@tiptap/vue-3";
import { ref, computed } from "vue";

const props = defineProps(nodeViewProps);
const languages = ref(props.extension.options.lowlight.listLanguages());

const selectedLanguage = computed({
	get() {
		return props.node.attrs.language;
	},
	set(language) {
		props.updateAttributes({ language });
	}
});
</script>

<style lang="scss" scoped>
.code-block-view{
	margin: 10px 0;
}
.code-block-container{
	position: relative;
	border: 2px rgb(250,250,250) solid;
	min-height: 200px;
	padding: 0;
	& .code-block-tools{
		position: absolute;
		z-index: 10;
		top: 0;
		left: 0;
		width: 100%;
		height: 40px;
		background: rgb(250,250,250);
		display: flex;
		flex-direction: row;
		justify-content: end;
		align-items: center;
		padding: 0 4px;
	}
	& .code-block-content{
		position: absolute;
		top: 0px;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 0 !important;
		margin: 0 !important;
		.hljs,.code{
			padding: 40px 3px 3px 3px;
		}
	}
}
</style>
