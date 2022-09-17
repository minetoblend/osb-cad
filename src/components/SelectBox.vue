<template>
  <div class="select-box" :style="style">

  </div>
</template>

<script setup lang="ts">

import {computed, PropType} from "vue";
import {Vec2} from "@/util/math";

const props = defineProps({
  from: {
    type: Object as PropType<Vec2>,
    required: true,
  },
  to: {
    type: Object as PropType<Vec2>,
    required: true,
  }
})

const style = computed(() => {
  let min = props.from.min(props.to)
  let max = props.from.max(props.to)

  let size = max.sub(min)

  return {
    left: `${min.x}px`,
    top: `${min.y}px`,
    width: `${size.x}px`,
    height: `${size.y}px`,
  }
})

</script>

<style lang="scss">

.select-box {
  position: absolute;
  border: 2px solid #42b983;
}

</style>