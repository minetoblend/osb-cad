<template>
  <div class="component-row">
    <el-input placeholder="" v-model="value" @change="commitValue">

    </el-input>
  </div>
</template>

<script setup lang="ts">

import {computed, defineProps, PropType, ref, watchEffect} from "vue";
import {Node} from "@/editor/node";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {IntNodeParameter} from "@/editor/node/parameter";
import {useContext} from "@/editor/ctx/use";
import {SetNodeParameterCommand} from "@/editor/ctx/command/parameter";
import {compileExpression} from "@/editor/compile";

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

const value = ref('0')

const param = computed(() => props.node.params.get(props.interface.id) as IntNodeParameter)

watchEffect(() => loadValues() )

function loadValues() {
  if (param.value) {
    value.value = param.value.getText()
  }
}

loadValues()

function commitValue() {

  let val: any = value.value;
  const expr = compileExpression(val, param.value.withIndex)
  if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
    val = expr.cachedValue
  } else {
    val = expr
  }

  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id, val)
  )
}

loadValues()

</script>