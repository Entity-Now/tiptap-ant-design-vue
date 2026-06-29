<template>
	<a-tooltip placement="top">
		<template #title>
			<span>图片</span>
		</template>
		<div class="tool" @click="showModal">
			<PictureOutlined style="font-size: 16px; font-weight: 600" />
		</div>
	</a-tooltip>

	<a-modal v-model:open="open" title="插入图片" :footer="null" :destroyOnClose="true">
		<a-tabs v-model:activeKey="activeTab">
			<a-tab-pane key="url" tab="图片链接">
				<a-form :model="forms" ref="formRef" layout="vertical" style="padding-top: 12px;">
					<a-form-item name="url" label="图片地址" :rules="[
						{ required: true, message: '请输入图片链接' },
						{ validator: validateUrl, trigger: 'blur' }
					]">
						<a-input v-model:value="forms.url" placeholder="请输入或粘贴图片链接" />
					</a-form-item>
					<div class="modal-footer">
						<a-button @click="open = false" style="margin-right: 8px;">取消</a-button>
						<a-button type="primary" @click="handleInsertUrl">确定</a-button>
					</div>
				</a-form>
			</a-tab-pane>

			<a-tab-pane key="base64" tab="本地上传">
				<div style="padding: 16px 0 8px;">
					<a-upload-dragger name="file" :multiple="false" :show-upload-list="false"
						:before-upload="beforeUploadBase64">
						<p class="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p class="ant-upload-text">点击或拖拽图片文件到此区域</p>
						<p class="ant-upload-hint">图片将自动转换为 Base64 格式并嵌入编辑器</p>
					</a-upload-dragger>
				</div>
			</a-tab-pane>

			<a-tab-pane v-if="hasUploadCallback" key="server" tab="上传到服务器">
				<div style="padding: 16px 0 8px;">
					<div class="server-upload-zone" @click="handleServerUpload">
						<p class="ant-upload-drag-icon">
							<CloudUploadOutlined />
						</p>
						<p class="ant-upload-text">点击选择并上传图片到后台</p>
						<p class="ant-upload-hint">上传文件到您的云端/服务器</p>
					</div>
				</div>
			</a-tab-pane>
		</a-tabs>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, inject, computed } from "vue";
import { uploadImageKey } from "../../vue3-tiptap";
import { PictureOutlined, CloudUploadOutlined, InboxOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { validateUrl } from "@/utils/pattern";
import { _getBase64 } from "@/utils/index";
import type { Editor } from "@tiptap/core";

interface ToolbarProps {
	editor: Editor;
}

const props = defineProps<ToolbarProps>();

const uploadImage = inject<any>(uploadImageKey);
const open = ref(false);
const activeTab = ref("url");
const formRef = ref();
const forms = reactive({
	url: ""
});

const hasUploadCallback = computed(() => typeof uploadImage === "function");

const showModal = () => {
	forms.url = "";
	activeTab.value = "url";
	open.value = true;
};

const handleInsertUrl = () => {
	formRef.value.validateFields().then(() => {
		props.editor.chain().focus().setImage({ src: forms.url }).run();
		open.value = false;
	});
};

const beforeUploadBase64 = async (file: File) => {
	const isImage = file.type.startsWith("image/");
	if (!isImage) {
		message.error("请上传图片格式文件");
		return false;
	}

	const imgBase64 = await _getBase64(file);
	props.editor.chain().focus().setImage({ src: imgBase64 }).run();
	open.value = false;

	return false;
};

const handleServerUpload = () => {
	if (uploadImage) {
		uploadImage().then((res: { url: string; size?: number; fileName: string }) => {
			if (res && res?.url) {
				props.editor.chain().focus().setImage({ src: res.url }).run();
				open.value = false;
			}
		});
	}
};
</script>

<style lang="scss" scoped>
.modal-footer {
	display: flex;
	justify-content: flex-end;
	margin-top: 24px;
}

.server-upload-zone {
	border: 1px dashed #d9d9d9;
	border-radius: 8px;
	background: #fafafa;
	padding: 24px 0;
	text-align: center;
	cursor: pointer;
	transition: border-color 0.3s, background-color 0.3s;

	&:hover {
		border-color: var(--primary-green, #2f855a);
		background-color: rgba(47, 133, 90, 0.02);
	}

	.ant-upload-drag-icon {
		font-size: 40px;
		color: var(--primary-green, #2f855a);
		margin-bottom: 12px;
		display: inline-block;
	}

	.ant-upload-text {
		font-size: 14px;
		color: #000000d9;
		margin: 0 0 4px;
	}

	.ant-upload-hint {
		font-size: 12px;
		color: #00000073;
	}
}
</style>
