<template>
  <div ref="editorContainer" class="editor-container editor-pane">

  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor';
import {onBeforeUnmount, onMounted, ref} from "vue";

const props = defineProps({
  path: String,
  modelValue: String,
  extraLib: String
})

const editorContainer = ref<HTMLDivElement>()
const emit = defineEmits(['update:modelValue'])

let editor: monaco.editor.IStandaloneCodeEditor;

function init(el: HTMLDivElement) {

  editor = monaco.editor.create(el, {
    value: props.modelValue,
    language: 'javascript',
    theme: 'myCustomTheme',
    "semanticHighlighting.enabled": true,
    automaticLayout: true
  });

  editor.onDidChangeModelContent(event => {
    const value = editor.getValue()
    if (props.modelValue !== value) {
      emit('update:modelValue', value, event)
    }
  })

  if (props.extraLib)
    monaco.languages.typescript.javascriptDefaults.addExtraLib(props.extraLib, 'ts:filename/current.wrangle.d.ts')
  console.log(props.extraLib)
  console.log(monaco.languages.typescript.javascriptDefaults.getExtraLibs())
}


onMounted(() => init(editorContainer.value!))

onBeforeUnmount(() => editor.dispose())

</script>