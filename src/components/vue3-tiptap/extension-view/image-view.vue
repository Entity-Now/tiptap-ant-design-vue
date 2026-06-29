
<template>
  <!-- inline 节点，用 span 包裹，并禁用编辑 -->
  <node-view-wrapper as="span" :class="imageViewClass" contenteditable="false">
    <!-- 把 div 改成 span，保持合法的内联内容模型 -->
    <span class="image-view__body">
      <a-popover placement="top" trigger="click" :getPopupContainer="(el: any) => el.parentNode">
        <template #content>
          <div class="popover__container">
            <!-- 对齐布局 -->
            <div class="popover__section">
              <span class="popover__section-title">对齐方式</span>
              <div class="popover__buttons">
                <a-tooltip title="行内" :getPopupContainer="(el: any) => el.parentNode">
                  <span
                    :class="['popover__item', display === 'inline' ? 'active' : '']"
                    @click="updateAttributes({ display: 'inline' })"
                  >
                    <PicCenterOutlined />
                  </span>
                </a-tooltip>
                <a-tooltip title="块级居左" :getPopupContainer="(el: any) => el.parentNode">
                  <span
                    :class="['popover__item', display === 'block-left' ? 'active' : '']"
                    @click="updateAttributes({ display: 'block-left' })"
                  >
                    <AlignLeftOutlined />
                  </span>
                </a-tooltip>
                <a-tooltip title="块级居中" :getPopupContainer="(el: any) => el.parentNode">
                  <span
                    :class="['popover__item', display === 'block-center' || display === 'block' ? 'active' : '']"
                    @click="updateAttributes({ display: 'block-center' })"
                  >
                    <AlignCenterOutlined />
                  </span>
                </a-tooltip>
                <a-tooltip title="块级居右" :getPopupContainer="(el: any) => el.parentNode">
                  <span
                    :class="['popover__item', display === 'block-right' ? 'active' : '']"
                    @click="updateAttributes({ display: 'block-right' })"
                  >
                    <AlignRightOutlined />
                  </span>
                </a-tooltip>
                <a-tooltip title="左浮动" :getPopupContainer="(el: any) => el.parentNode">
                  <span
                    :class="['popover__item', display === 'left' ? 'active' : '']"
                    @click="updateAttributes({ display: 'left' })"
                  >
                    <PicLeftOutlined />
                  </span>
                </a-tooltip>
                <a-tooltip title="右浮动" :getPopupContainer="(el: any) => el.parentNode">
                  <span
                    :class="['popover__item', display === 'right' ? 'active' : '']"
                    @click="updateAttributes({ display: 'right' })"
                  >
                    <PicRightOutlined />
                  </span>
                </a-tooltip>
              </div>
            </div>

            <!-- 快捷尺寸 -->
            <div class="popover__section">
              <span class="popover__section-title">快捷尺寸</span>
              <div class="popover__buttons">
                <span class="popover__text-btn" @click="setSizePercent(25)">25%</span>
                <span class="popover__text-btn" @click="setSizePercent(50)">50%</span>
                <span class="popover__text-btn" @click="setSizePercent(100)">100%</span>
                <span class="popover__text-btn" @click="setOriginalSize">原图</span>
              </div>
            </div>

            <!-- 删除 -->
            <div class="popover__section delete-section">
              <span class="popover__text-btn delete-btn" @click="deleteNode()">
                <DeleteOutlined /> 删除图片
              </span>
            </div>
          </div>
        </template>

        <img
          ref="imageRef"
          :src="src"
          :title="props.node.attrs.title"
          :alt="props.node.attrs.alt"
          :width="width"
          :height="height"
          draggable="false"
          @click="selectImage"
        ></img>
      </a-popover>

      <!-- 这里也改成 span（或多个 span），避免块级元素 -->
      <span class="image-resizer" v-show="resizing || selected">
        <span
          v-for="direction in resizeDirections"
          :key="direction"
          :class="`image-resizer__handler--${direction}`"
          class="image-resizer__handler"
          @mousedown="onMouseDown($event, direction)"
        />
      </span>
    </span>
  </node-view-wrapper>
</template>


<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import { ref, reactive, computed } from "vue";
import {
  DeleteOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  PicLeftOutlined,
  PicRightOutlined,
  PicCenterOutlined
} from "@ant-design/icons-vue";
import { resolveImg } from "@/utils/image";
import { clamp } from "@/utils/index";

const props = defineProps(nodeViewProps);

const MIN_SIZE = 20;
const MAX_SIZE = 4000;

const displayCollection = reactive(["inline", "block", "left", "right"]);
const maxSize = reactive({
	width: MAX_SIZE,
	height: MAX_SIZE
});
const resizing = ref(false);
const imageRef = ref<HTMLImageElement | null>(null);
const resizeState = reactive({
	w: 0,
	h: 0,
	dir: "",
	x: 0,
	y: 0
});
const resizeDirections = reactive(["tl", "tr", "bl", "br"]);
const originalSize = reactive({
	width: 0,
	height: 0
});

const src = computed(() => props.node.attrs.src);
const width = computed(() => props.node.attrs.width);
const height = computed(() => props.node.attrs.height);
const display = computed(() => props.node.attrs.display);
const imageViewClass = computed(() => ["image-view", `image-view--${display.value}`]);

const loadImage = async (): Promise<void> => {
	const result: any = await resolveImg(src.value);

	if (!result.complete) {
		result.width = MIN_SIZE;
		result.height = MIN_SIZE;
	}

	originalSize.width = result.width;
	originalSize.height = result.height;
};
loadImage();

const selectImage = () => {
	props.editor?.commands.setNodeSelection(props.getPos() as number);
};

// 尺寸预设
const setSizePercent = (percent: number) => {
	props.updateAttributes?.({
		width: `${percent}%`,
		height: null
	});
	selectImage();
};

const setOriginalSize = () => {
	if (originalSize.width > 0) {
		props.updateAttributes?.({
			width: originalSize.width,
			height: originalSize.height
		});
	} else {
		props.updateAttributes?.({
			width: null,
			height: null
		});
	}
	selectImage();
};

// 图片缩放
const onMouseDown = (e: MouseEvent, dir: string) => {
	e.stopPropagation();
	e.preventDefault();

	const currentWidth = imageRef.value ? imageRef.value.clientWidth : originalSize.width || MIN_SIZE;
	const currentHeight = imageRef.value ? imageRef.value.clientHeight : originalSize.height || MIN_SIZE;

	resizeState.x = e.clientX;
	resizeState.y = e.clientY;

	resizeState.w = currentWidth;
	resizeState.h = currentHeight;
	resizeState.dir = dir;
	resizing.value = true;

	onEvents();
};

const onMouseMove = (e: MouseEvent) => {
	e.preventDefault();
	e.stopPropagation();

	const { x, y, w, h, dir } = resizeState;

	const dx = (e.clientX - x) * (/l/.test(dir) ? -1 : 1);
	const dy = (e.clientY - y) * (/t/.test(dir) ? -1 : 1);

	props.updateAttributes?.({
		width: clamp(w + dx, MIN_SIZE, maxSize.width),
		height: Math.max(h + dy, MIN_SIZE)
	});
};

const onMouseUp = (e: MouseEvent) => {
	e.preventDefault();
	e.stopPropagation();
	if (!resizing.value) return;

	resizing.value = false;

	resizeState.x = resizeState.y = resizeState.w = resizeState.h = 0;
	resizeState.dir = "";
	offEvents();
	selectImage();
};

const onEvents = () => {
	document.addEventListener("mousemove", onMouseMove, true);
	document.addEventListener("mouseup", onMouseUp, true);
};
const offEvents = () => {
	document.removeEventListener("mousemove", onMouseMove, true);
	document.removeEventListener("mouseup", onMouseUp, true);
};
</script>

<style lang="scss" scoped>
.popover__container {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 4px;
	min-width: 180px;

	.popover__section {
		display: flex;
		flex-direction: column;
		gap: 6px;

		&-title {
			font-size: 11px;
			color: #94a3b8;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.popover__buttons {
			display: flex;
			gap: 4px;
			flex-wrap: wrap;
		}
	}

	.popover__item {
		box-sizing: border-box;
		cursor: pointer;
		width: 28px;
		height: 28px;
		transition: 0.2s all;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e2e8f0;
		color: #475569;
		background: #fff;

		&:hover {
			background-color: rgba(47, 133, 90, 0.08);
			color: var(--primary-green, #2f855a);
			border-color: rgba(47, 133, 90, 0.3);
		}

		&.active {
			background-color: rgba(47, 133, 90, 0.12);
			color: var(--primary-green, #2f855a);
			border-color: var(--primary-green, #2f855a);
			font-weight: bold;
		}

		.icon-wrapper {
			font-size: 12px;
			font-weight: bold;
		}
	}

	.popover__text-btn {
		box-sizing: border-box;
		cursor: pointer;
		padding: 4px 8px;
		font-size: 12px;
		transition: 0.2s all;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
		color: #475569;
		background: #fff;
		text-align: center;
		flex: 1;

		&:hover {
			background-color: rgba(47, 133, 90, 0.08);
			color: var(--primary-green, #2f855a);
			border-color: rgba(47, 133, 90, 0.3);
		}
	}

	.delete-section {
		border-top: 1px solid #e2e8f0;
		padding-top: 8px;
	}

	.delete-btn {
		border-color: #fee2e2;
		color: #ef4444;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-weight: 500;

		&:hover {
			background-color: #fef2f2;
			color: #dc2626;
			border-color: #fca5a5;
		}
	}
}

.image-view {
	$root: &;
	display: inline-block;
	float: none;
	line-height: 0;
	margin: 12px 0;
	max-width: 100%;
	user-select: none;
	vertical-align: baseline;

	&--inline {
		margin-left: 12px;
		margin-right: 12px;
	}

	&--block,
	&--block-center {
		display: block;
		text-align: center;
	}

	&--block-left {
		display: block;
		text-align: left;
	}

	&--block-right {
		display: block;
		text-align: right;
	}

	&--left {
		float: left;
		margin-left: 0;
		margin-right: 12px;
	}

	&--right {
		float: right;
		margin-left: 12px;
		margin-right: 0;
	}

	&__body {
		clear: both;
		display: inline-block;
		max-width: 100%;
		outline-color: transparent;
		outline-style: solid;
		outline-width: 2px;
		transition: all 0.2s ease-in;
		position: relative;
		&:hover {
			outline-color: #ffc83d;
		}

		&--focused:hover,
		&--resizing:hover {
			outline-color: transparent;
		}

		&__placeholder {
			height: 100%;
			left: 0;
			position: absolute;
			top: 0;
			width: 100%;
			z-index: -1;
		}

		&__image {
			cursor: pointer;
			margin: 0;
		}
		.image-resizer {
			position: absolute;
			left: 0;
			top: 0;
			right: 0;
			bottom: 0;
			margin: 0 auto;
			border: 1px solid #409eff;
			&__handler {
				position: absolute;
				width: 12px;
				height: 12px;
				background-color: #409eff;
				&--tl {
					left: -6px;
					top: -6px;
					cursor: nw-resize;
				}
				&--tr {
					right: -6px;
					top: -6px;
					cursor: ne-resize;
				}
				&--br {
					right: -6px;
					bottom: -6px;
					cursor: se-resize;
				}
				&--bl {
					left: -6px;
					bottom: -6px;
					cursor: sw-resize;
				}
			}
		}
	}
}
</style>
