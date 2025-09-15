import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { Image } from '@tiptap/extension-image'
import ImageView from '@/components/vue3-tiptap/extension-view/image-view.vue'

export interface ImageOptions {
  display?: 'inline' | 'block'
}

const CustomImage = Image.extend<ImageOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      display: 'inline',
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      display: {
        default: this.options.display,
        parseHTML: element => element.getAttribute('data-display') || 'inline',
        renderHTML: attributes => {
          return {
            'data-display': attributes.display,
          }
        },
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageView)
  },
})

export default CustomImage
