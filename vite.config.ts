import path from "path";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

// https://vite.dev/config/
const libDir = path.resolve(__dirname, "lib");
const srcDir = path.resolve(__dirname, "src");
export default ({ mode }: any) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
	const IS_DEMO = process.env.VITE_BUILD_TARGET == "demo";
	return defineConfig({
		base: IS_DEMO ? '/tiptap-ant-design-vue/' : undefined,
		plugins: [
			vue(),
			Components({
				resolvers: [
					AntDesignVueResolver({
					importStyle: false, // css in js
					}),
				],
			}),
			IS_DEMO
				? null
				: dts({
						include: ["src"],
						insertTypesEntry: true
					})
		],
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
				"demo": resolve(__dirname, "./demo"),
				"tiptap-ant-design-vue": resolve(__dirname, "./src")
			}
		},
		build: IS_DEMO
			? undefined
			: {
					outDir: libDir,
					minify: "esbuild",
					lib: {
						entry: path.resolve(srcDir, "index.ts"),
						name: "tiptap-ant-design-vue",
						fileName: "tiptap-ant-design-vue"
					},
					// https://rollupjs.org/guide/en/#big-list-of-options
					rollupOptions: {
						// 确保外部化处理那些你不想打包进库的依赖
						external: ["vue"],
						output: {
							exports: "named",
							// https://github.com/henriquehbr/svelte-typewriter/issues/21#issuecomment-968835822
							inlineDynamicImports: true,
							// 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
							globals: {
								vue: "vue"
							}
						},
						plugins: []
					}
				},
		server: {
			host: "0.0.0.0",
			port: 8888,
			open: false
		}
	});
};
