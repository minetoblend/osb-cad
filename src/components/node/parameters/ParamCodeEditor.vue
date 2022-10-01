<template>
  <div v-if="param" class="code-param" ref="element" style="height: 500px">
    <code-editor v-model="code" :path="node.path.toString()" :extra-lib="param.typeDefs"
                 :key="param.node.path.toString()"/>
  </div>
</template>

<script setup lang="ts">
import {computed, defineProps, onBeforeUnmount, PropType, ref, watch} from "vue";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {Node} from "@/editor/node";
import {javascript} from '@codemirror/lang-javascript'
import {builtinStatementMethods} from "@/editor/compile";
import CodeEditor from "@/lang/CodeEditor.vue";
import {CodeNodeParameter} from "@/editor/node/parameter";

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
  interface: {
    type: Object as PropType<NodeInterfaceItem>,
    required: true,
  }
})
const lang = javascript()

const methods = [...builtinStatementMethods]

const param = computed(() => props.node.params.get(props.interface.id) as CodeNodeParameter)

const code = ref('')
const dirty = ref(false)

watch(param, () => {
  loadCode()
})

watch(code, () => {
  dirty.value = true
})

function loadCode() {
  if (param.value)
    code.value = param.value!.get()
}

loadCode()

function saveCode() {
  if (dirty.value) {
    param.value?.set(code.value)
    dirty.value = false
  }
}

function isDescendant(parent: HTMLElement, child: HTMLElement): boolean {
  let node = child.parentNode;
  while (node !== null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

const element = ref<HTMLDivElement>()

function onClickAnywhere(evt: MouseEvent) {
  if (evt.target instanceof HTMLElement && !isDescendant(element.value!, evt.target)) {
    saveCode()
  }
}

document.addEventListener('mousedown', onClickAnywhere)

onBeforeUnmount(() => document.removeEventListener('mousedown', onClickAnywhere))
</script>

<style lang="scss">
.code-param {
}
</style>