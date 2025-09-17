import { VueNodeViewRenderer } from "@tiptap/vue-3";
import { Image } from "@tiptap/extension-image";
import ImageView from "@/components/vue3-tiptap/extension-view/image-view.vue";

export interface ImageOptions {
	display?: "inline" | "block";
}

const CustomImage = Image.extend<ImageOptions>({
  
	addOptions() {
		return {
			...this.parent?.(),
			display: "inline"
		};
	},

	addAttributes() {
		const parent = this.parent?.() ?? {};
		return {
			...parent,
			// 明确声明 src 的取值与输出，不加任何校验
			src: {
				default: null,
				parseHTML: el => el.getAttribute("src"),
				renderHTML: attrs => ({ src: attrs.src })
			},
			display: {
				default: this.options.display ?? "inline",
				parseHTML: el => el.getAttribute("data-display") || "inline",
				renderHTML: attrs => ({ "data-display": attrs.display })
			}
		};
	},

	addNodeView() {
		return VueNodeViewRenderer(ImageView);
	}
});

export default CustomImage;
