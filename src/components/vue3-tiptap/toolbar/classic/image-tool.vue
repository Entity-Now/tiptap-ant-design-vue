<template>
	<a-popover placement="bottom" trigger="click">
		<template #content>
			<ul class="dropdown">
				<li class="dropdown__opeartion" @click="insertRef.showModal()">
					<PaperClipOutlined style="margin-right: 5px" />插入URL
				</li>
				<li class="dropdown__opeartion" @click="uploadRef.showModal()">
					<CloudUploadOutlined style="margin-right: 5px" />上传Base64图片
				</li>
				<li class="dropdown__opeartion" @click="customUploadImage">
					<CloudUploadOutlined style="margin-right: 5px" />上传图片到后台
				</li>
			</ul>
		</template>
		<a-tooltip placement="top">
			<template #title>
				<span>图片</span>
			</template>
			<div class="tool">
				<PictureOutlined style="font-size: 16px; font-weight: 600" />
			</div>
		</a-tooltip>
	</a-popover>
	<InsertImage
		ref="insertRef"
		@emitInsert="handleEmit"
		:options="{ title: '插入图片地址', headers }"
	>
	</InsertImage>
	<UploadImage ref="uploadRef" @emitUpload="handleEmit" :options="{ title: '上传图片' }" />
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { uploadImageKey } from '../../vue3-tiptap'
import { PictureOutlined, CloudUploadOutlined, PaperClipOutlined } from "@ant-design/icons-vue";
import { validateUrl } from "@/utils/pattern";
import InsertImage from "./insert-model/index.vue";
import UploadImage from "./upload-model/index.vue";
import { _getBase64 } from "@/utils/index";
import type { Editor } from "@tiptap/core";

interface ToolbarProps {
	editor: Editor;
}

const props = defineProps<ToolbarProps>();

const headers = [
	{
		formItem: {
			name: "url",
			rules: [{ required: true, validator: validateUrl, trigger: "blur" }]
		},
		component: {
			name: "input",
			placeholder: "URL of Image"
		}
	}
];

const uploadImage = inject<any>(uploadImageKey);
const insertRef = ref();
const uploadRef = ref();

const customUploadImage = ()=>{
	uploadImage().then((res: {
		url: string;
		size?: number;
		fileName: string;
	})=>{
		if(res && res?.url){
			props.editor.chain().focus().setImage({ src: res.url }).run();
		}
	})
}

const handleEmit = async ({ url, file, type }: { url: string; file: File; type: string }) => {
	if (type === "upload") {
		const src = await _getBase64(file);
		props.editor.chain().focus().setImage({ src }).run();
	} else {
		props.editor.chain().focus().setImage({ src: url }).run();
	}

	uploadRef.value.closeModal();
	insertRef.value.closeModal();
};
</script>

<style lang="scss" scoped></style>
