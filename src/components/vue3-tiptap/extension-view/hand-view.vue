<template>
    <div class="vue3-drag-hand">
        <a-dropdown>
            <PlusOutlined @click.prevent style="font-size: 16px; font-weight: 600" />
            <template #overlay>
                <a-menu>
                    <a-menu-item v-for="(button, index) in moreFunction" :key="index" @click="button.command">{{ button.text }}
                    </a-menu-item>
                </a-menu>
            </template>
        </a-dropdown>
        <a-dropdown>
            <DragOutlined class="drag-hand" style="font-size: 16px; font-weight: 600" />
            <template #overlay>
                <a-menu>
                    <a-menu-item v-for="(button, index) in currentFunction" :key="index" @click="button.command">{{ button.text }}
                    </a-menu-item>
                </a-menu>
            </template>
        </a-dropdown>
    </div>
</template>

<script setup lang='ts'>
import { inject, reactive } from 'vue'
import type { Ref } from 'vue'
import type { Editor } from "@tiptap/core";
import { EditorKey, ToggleFullScreenKey, IsFullScreenKey } from "../vue3-tiptap";
import { PlusOutlined, DragOutlined } from '@ant-design/icons-vue'

const editor = inject<Ref<Editor>>(EditorKey)

const moreFunction = reactive([
    {text: '插入新行', command: ()=>{
        const { state, view } = editor!.value;
        const { $from } = state.selection;

        // 计算插入位置（当前块的末尾）
        const insertPos = $from.after();

        // 创建新段落节点
        const paragraph = state.schema.nodes.paragraph.create();

        // 构建事务
        const tr = state.tr.insert(insertPos, paragraph);
        view.dispatch(tr);

        // 将光标移至新段落
        editor!.value.commands.focus(insertPos + 1);
    }},
    {text: '换行', command: ()=>editor?.value?.chain()?.focus()?.setHardBreak()?.run()},
    {text: '代码块', command: ()=>editor?.value?.chain()?.focus()?.toggleCodeBlock()?.run()},
])
const currentFunction = reactive([
    {text: '删除', command: ()=>{
        const { state, commands } = editor!.value;
        const { $from } = state.selection;
        
        const { name } = state.selection.$from.node(1).type;
        if(name == 'table'){
            commands.deleteTable();
        }else if(name == 'paragraph'){
            commands.deleteNode(name);
            // commands.deleteSelection();
        }else{
            commands.deleteNode(name);
        }
        console.log(name);
    }},
])
</script>

<style>
.vue3-drag-hand {
    position: fixed !important;
    transition: opacity ease-in 0.2s;
    display: flex;
    flex-direction: row;
    gap: 5px;
    opacity: 1;
    z-index: 50;
    width: 40px;
    margin-left: -22px;
    margin-top: 2px;
}
.vue3-drag-hand .drag-hand{
    cursor: grab;
}
.vue3-drag-hand.hide {
    opacity: 0;
    pointer-events: none;
}
</style>