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
import {useContext} from "@/editor/ctx/use";
import {SetNodeParameterCommand} from "@/editor/ctx/command/parameter";
import {compileExpression} from "@/editor/compile";

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

const ctx = useContext()

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
  let val: any = red.value;
  const expr = compileExpression(val, params.value.r.withIndex)
  if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
    val = expr.cachedValue
  } else {
    val = expr
  }
  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id + '.x', val)
  )
}

function commitGreen() {
  let val: any = green.value;
  const expr = compileExpression(val, params.value.g.withIndex)
  if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
    val = expr.cachedValue
  } else {
    val = expr
  }
  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id + '.y', val)
  )
}

function commitBlue() {
  let val: any = blue.value;
  const expr = compileExpression(val, params.value.b.withIndex)
  if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
    val = expr.cachedValue
  } else {
    val = expr
  }
  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id + '.z', val)
  )
}

loadValues()

</script>