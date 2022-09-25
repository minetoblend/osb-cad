<template>
  <div class="component-row">
    <el-select :model-value="spriteName" @update:model-value="param.set($event)" clearable>
      <template #empty>
        None
      </template>
      <el-option v-for="(sprite, index) in sprites" :key="index" :value="sprite.name" class="sprite-selectitem">
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

const sprites = computed(() => ctx.fileStore.textures)

function loadValues() {
  if (param.value) {
    value.value = param.value.get()
  }
}

const spriteName = computed(() => param.value.get() ?? 'None')

loadValues()

function commitValue() {
  param.value.set(value.value)
  value.value = param.value.get()
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