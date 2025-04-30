import type { InjectionKey } from "vue";

export interface TiptapProps {
	mode?: "bubble" | "classic" | undefined; // 气泡菜单 | 经典菜单
	extensions?: any[]; // 插件列表
	content: string; 
	uploadImage?: ()=> Promise<{
		url: string;
		size?: number;
		fileName: string;
	}>
	uploadVideo?: ()=> Promise<{
		url: string;
		size?: number;
		fileName: string;
	}>
}
export interface TiptapEmits {
	['update:content']: (string: string)=>void
}
export const EditorKey = Symbol("Editor")
export const uploadImageKey = Symbol("uploadImage")
export const uploadVideoKey = Symbol("uploadVideo")
export const IsFullScreenKey = Symbol("isFullScreen");
export const ToggleFullScreenKey = Symbol("toggleFullscreen") as InjectionKey<() => void>;
