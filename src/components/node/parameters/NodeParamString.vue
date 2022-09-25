<template>
  <div class="component-row">
    <el-input v-model="value" @change="commitValue">

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


const param = computed(() => props.node.params.get(props.interface.id) as IntNodeParameter)

const value = ref('')

watchEffect(() => value.value = param.value.get())

function commitValue() {
  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id, value.value)
  )
}

</script>