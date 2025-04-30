import { createApp } from "vue";
import App from "./App.vue";
import "@/styles/reset.scss";
import "@/styles/tiptap.scss";
import AntdCom from "demo/plugin/antd";

const app = createApp(App);

app.use(AntdCom).mount("#app");
