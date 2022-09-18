<template>
  <div v-if="param" class="code-param">
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
import {javascript, javascriptLanguage} from '@codemirror/lang-javascript'
import {oneDark} from '@codemirror/theme-one-dark'
import {CompletionContext} from '@codemirror/autocomplete'
import {builtinStatementMethods} from "@/editor/compile";

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

function complete(context: CompletionContext) {
  let word = context.matchBefore(/[\w$]*/)!
  if (word.from == word.to && !context.explicit)
    return null
  const options = []

  if ('$pos'.startsWith(word.text)) {
    options.push({label: '$pos', type: 'variable', info: "Sprite position"})
  }
  if ('$img'.startsWith(word.text)) {
    options.push({label: '$img', type: 'variable', info: "Sprite image"})
  }

  methods.forEach(method => {
    if (method.toLowerCase().startsWith(word.text.toLowerCase()))
      options.push({
        label: method,
        type: 'function',
      })
  })

  return {
    from: word!.from,
    options: options
  }
}

const extensions = [javascript(), oneDark, javascriptLanguage.data.of({
  autocomplete: complete
})]

const param = computed(() => props.node.params.get(props.interface.id))

const code = ref('')

watch(param, () => {
  loadCode()
})

function loadCode() {
  if (param.value)
    code.value = param.value!.get()
}

loadCode()

function saveCode() {
  param.value?.set(code.value)
}

</script>

<style lang="scss">
.code-param {
  padding: 15px;
}
</style>