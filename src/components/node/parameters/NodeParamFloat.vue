<template>
  <div class="component-row">
    <el-input placeholder="" v-model="value" @change="commitValue">

    </el-input>
  </div>
</template>

<script setup lang="ts">

import {computed, defineProps, PropType, ref, watch} from "vue";
import {Node} from "@/editor/node";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {IntNodeParameter} from "@/editor/node/parameter";

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

const value = ref('0')

const param = computed(() => props.node.params.get(props.interface.id) as IntNodeParameter)

watch(param, () => {
  loadValues()
})

function loadValues() {
  if (param.value) {
    value.value = param.value.getText()
  }
}

loadValues()

function commitValue() {
  param.value.setText(value.value)
}

loadValues()

</script>