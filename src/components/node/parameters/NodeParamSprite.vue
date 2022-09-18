<template>
  <div class="component-row">
    <el-select :model-value="spriteName" @update:model-value="param.set($event)">
      <el-option :value="-1">
        None
      </el-option>
      <el-option v-for="(sprite, index) in sprites" :key="index" :value="index" class="sprite-selectitem">
        <img :src="sprite.url" alt="">
        {{ sprite.name }}
      </el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">

import {computed, defineProps, PropType, ref, watch} from "vue";
import {Node} from "@/editor/node";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {IntNodeParameter} from "@/editor/node/parameter";
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

const value = ref('0')

const param = computed(() => props.node.params.get(props.interface.id) as IntNodeParameter)

watch(param, () => {
  loadValues()
})

const sprites = computed(() => ctx.textureStore.textures)

function loadValues() {
  if (param.value) {
    value.value = param.value.getText()
  }
}

const spriteName = computed(() => sprites.value[param.value.get()]?.name ?? 'None')

loadValues()

function commitValue() {
  param.value.setText(value.value)
  value.value = param.value.getText()
}

loadValues()

</script>

<style lang="scss">
.sprite-selectitem {
  height: unset !important;

  img {
    max-height: 64px;
    max-width: 64px;
  }
}
</style>