<template>
  <div class="component-row">
    <el-input placeholder="red" v-model="red" @change="commitRed">
    </el-input>
    <el-input placeholder="green" v-model="green" @change="commitGreen">
    </el-input>
    <el-input placeholder="blue" v-model="blue" @change="commitBlue">
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

const red = ref('0')
const green = ref('0')
const blue = ref('0')

const params = computed(() => ({
  r: props.node.params.get(props.interface.id + '.x') as FloatNodeParameter,
  g: props.node.params.get(props.interface.id + '.y') as FloatNodeParameter,
  b: props.node.params.get(props.interface.id + '.z') as FloatNodeParameter,
}))

watch(params, () => {
  loadValues()
})

function loadValues() {
  if (params.value) {
    red.value = params.value.r.getText()
    green.value = params.value.g.getText()
    blue.value = params.value.b.getText()
  }
}

function commitRed() {
  params.value.r.setText(red.value)
}

function commitGreen() {
  params.value.g.setText(green.value)
}

function commitBlue() {
  params.value.b.setText(blue.value)
}

loadValues()

</script>