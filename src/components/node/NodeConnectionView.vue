<template>
  <path class="node-connection" :class="{circular}" :d="d" :stroke-width="transform.scale * 2"/>
</template>

<script setup lang="ts">

import {computed, defineProps, PropType} from "vue";
import {getTangentsOf2Circles, Vec2} from "@/util/math";
import {NodeInput, NodeOutput} from "@/editor/node";
import {EditorLocation} from "@/components/node/util";


const props = defineProps({
  from: {
    type: Object as PropType<NodeOutput | Vec2>,
    required: true
  },
  editorId: {
    type: String,
    required: true,
  },
  to: {
    type: Object as PropType<NodeInput | Vec2>,
    required: true
  },
  bounds: {
    type: Object as PropType<DOMRect>,
    required: true
  },
  transform: {
    type: Object as PropType<EditorLocation>,
    required: true
  },
  circular: {
    type: Boolean
  }
})

const fromSocketElement = computed(() => {
  if (props.from instanceof Vec2) return undefined
  const element = document.getElementById(props.editorId + props.from.node.name.value)
  const sockets = element?.getElementsByClassName('output-socket')
  return sockets?.item(props.from.index)
})

const toSocketElement = computed(() => {
  if (props.to instanceof Vec2) return undefined
  const element = document.getElementById(props.editorId + props.to.node.name.value)
  const sockets = element?.getElementsByClassName('input-socket')
  return sockets?.item(props.to.index)
})

const outputPosition = computed(() => {
  if (props.from instanceof Vec2) return props.from
  const nodePos = props.from.node.position.value
  const pos = props.transform.position
  const scale = props.transform.scale

  const socket = fromSocketElement.value

  if (socket) {
    const rect = socket.getBoundingClientRect()
    return new Vec2(
        rect.x - props.bounds.x + rect.width * 0.5,
        rect.y - props.bounds.y + rect.width * 0.5
    )
  }
})

const inputPosition = computed(() => {
  if (props.to instanceof Vec2) return props.to
  const nodePos = props.to.node.position.value
  const pos = props.transform.position
  const scale = props.transform.scale

  const socket = toSocketElement.value

  if (socket) {
    const rect = socket.getBoundingClientRect()
    return new Vec2(
        rect.x - props.bounds.x + rect.width * 0.5,
        rect.y - props.bounds.y + rect.width * 0.5
    )
  }
})

const d = computed(() => {
  const from = outputPosition.value
  const to = inputPosition.value

  if (!from || !to)
    return ''

  const parts: string[] = []


  const offset = Math.min(to.sub(from).length, 10) * props.transform.scale

  const distance = to.sub(new Vec2(0, offset)).sub(
      from.add(new Vec2(0, offset))
  ).length


  const rad = (1 + Math.min(distance / 7, 30)) * props.transform.scale

  let c1 = from.add(new Vec2(-rad, offset))
  let c2 = to.add(new Vec2(rad, -offset))
  if (from.x < to.x) {
    c1 = from.add(new Vec2(rad, offset))
    c2 = to.add(new Vec2(-rad, -offset))
  }


  const lines = getTangentsOf2Circles(c1, rad, c2, rad);

  let line = (from.x < to.x) ? lines[2] : lines[3];
  if (!line)
    return [
      `M ${from.x} ${from.y}`,
      `C ${from.x} ${from.y + 10}, ${to.x} ${to.y - 10}, ${to.x} ${to.y}`
    ].join(' ')

  parts.push(`M ${from.x} ${from.y}`)
  parts.push(`L ${from.x} ${from.y + offset}`)
  parts.push(`A ${rad} ${rad} ${0} ${0} ${from.x > to.x ? 1 : 0} ${line.from.x} ${line.from.y}`)
  //parts.push(`M ${line.from.x} ${line.from.y}`);
  parts.push(`L ${line.to.x} ${line.to.y}`);
  parts.push(`A ${rad} ${rad} ${0} ${0} ${from.x < to.x ? 1 : 0} ${to.x} ${to.y - offset}`)
  parts.push(`L ${to.x} ${to.y}`)

  return parts.join(' ')
})

</script>

<style lang="scss">
.node-connection {
  stroke: rgba(255, 255, 255, 0.5);
  fill: transparent;
  pointer-events: stroke;

  &.circular {
    stroke: #ee594d;
  }
}
</style>