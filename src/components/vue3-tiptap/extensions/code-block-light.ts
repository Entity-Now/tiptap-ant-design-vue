import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import CodeBlockView from "@/components/vue3-tiptap/extension-view/code-block-view.vue";

const CodeBlockLights = CodeBlockLowlight.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			language: {
				default: "plaintext"
			}
		};
	},
	addNodeView() {
		return VueNodeViewRenderer(CodeBlockView);
	}
});

export default CodeBlockLights;
