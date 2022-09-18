<template>
  <div class="component-row">
    <el-input placeholder="x" v-model="xValue" @change="commitXValue">

    </el-input>
    <el-input placeholder="y" v-model="yValue" @change="commitYValue">

    </el-input>
  </div>
</template>

<script setup lang="ts">

import {computed, defineProps, PropType, ref, watch} from "vue";
import {Node} from "@/editor/node";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {FloatNodeParameter} from "@/editor/node/parameter";

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

const xValue = ref('0')
const yValue = ref('0')

const params = computed(() => ({
  x: props.node.params.get(props.interface.id + '.x') as FloatNodeParameter,
  y: props.node.params.get(props.interface.id + '.y') as FloatNodeParameter
}))

watch(params, () => {
  loadValues()
})

function loadValues() {
  if (params.value) {
    xValue.value = params.value.x.getText()
    yValue.value = params.value.y.getText()
  }
}

function commitXValue() {
  params.value.x.setText(xValue.value)
}

function commitYValue() {
  params.value.y.setText(yValue.value)
}

loadValues()

</script>