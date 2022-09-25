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
import {compileExpression} from "@/editor/compile";
import {SetNodeParameterCommand} from "@/editor/ctx/command/parameter";
import {useContext} from "@/editor/ctx/use";

const ctx = useContext()

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
  let val: any = xValue.value;
  const expr = compileExpression(val, params.value.x.withIndex)
  if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
    val = expr.cachedValue
  } else {
    val = expr
  }

  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id + '.x', val)
  )
}

function commitYValue() {
  let val: any = yValue.value;
  const expr = compileExpression(val, params.value.y.withIndex)
  if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
    val = expr.cachedValue
  } else {
    val = expr
  }

  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id + '.y', val)
  )
}

loadValues()

</script>