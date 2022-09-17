<template>
  <div v-if="param" class="node-param code-param">
    <codemirror
        v-model="code"
        placeholder="Code goes here..."
        :style="{ height: '400px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        @blur="saveCode"
    >

    </codemirror>
  </div>
</template>

<script setup lang="ts">
import {computed, defineProps, PropType, ref, watch} from "vue";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {Node} from "@/editor/node";
import {Codemirror} from 'vue-codemirror'
import {javascript} from '@codemirror/lang-javascript'
import {oneDark} from '@codemirror/theme-one-dark'

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

const extensions = [javascript(), oneDark]


const param = computed(() => props.node.params.get(props.interface.id))

const code = ref('')

watch(param, param => {
  if (param)
    code.value = param?.get()
})

function saveCode() {
  param.value?.set(code.value)
}

</script>

<style lang="scss">
.code-param {
  padding: 15px;
}
</style>