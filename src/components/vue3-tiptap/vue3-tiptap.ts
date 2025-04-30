import type { InjectionKey } from "vue";

export interface TiptapProps {
	mode?: "bubble" | "classic" | undefined; // 气泡菜单 | 经典菜单
	extensions?: any[]; // 插件列表
	content: string; 
}
export interface TiptapEmits {
	['update:content']: (string: string)=>void
}
export const EditorKey = Symbol("Editor")
export const IsFullScreenKey = Symbol("isFullScreen");
export const ToggleFullScreenKey = Symbol("toggleFullscreen") as InjectionKey<() => void>;
