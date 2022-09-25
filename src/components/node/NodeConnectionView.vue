<template>
  <path class="node-connection" :class="{circular, hovering, selected}" :d="d"/>
  <rect v-if="connection && line"
        class="connection-hover-area"
        :width="line.length"
        height="20"
        y="-6"
        :style="styles"
        @mouseenter="hovering++"
        @mouseleave="hovering--"
        @click.stop.prevent="handleMouseDown"
  />
</template>

<script setup lang="ts">

import {computed, defineEmits, defineProps, PropType, reactive, ref, shallowRef, watch, watchEffect} from "vue";
import {getTangentsOf2Circles, Line, Vec2} from "@/util/math";
import {EditorLocation} from "@/components/node/util";
import {NodeConnection} from "@/editor/node/connection";
import {NodeInput, NodeOutput} from "@/editor/node/input";
import {getNodeLayout} from "@/components/node/layout";
import {animateNodePositionFlag} from "@/util/flags";
import gsap from "gsap";
import {nodeAnimationTime} from "@/globals";

const props = defineProps({
  connection: {
    type: Object as PropType<NodeConnection>,
    required: false
  },
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

const emit = defineEmits(['update:hovering'])

const hovering = ref(0)

const line = shallowRef<Line>()

const fromPos = computed(() => {
  let from = Vec2.zero()
  if (props.from instanceof Vec2) return props.from
  const fromLayout = getNodeLayout(props.from.node)
  const fromSocketLayout = fromLayout.outputs.find(it => it.output === props.from)

  if (fromSocketLayout)
    from = fromSocketLayout.position.add(fromSocketLayout.size.mulF(0.5))
  return from
})

const toPos = computed(() => {
  let to = Vec2.zero()
  if (props.to instanceof Vec2) return props.to
  const toLayout = getNodeLayout(props.to.node)
  const toSocketLayout = toLayout.inputs.find(it => it.input === props.to)


  if (toSocketLayout)
    to = toSocketLayout.position.add(toSocketLayout.size.mulF(0.5))
  return to
})

let fromInitialized = false

const animatedFrom = reactive({x: 0, y: 0})

let toInitialized = false

const animatedTo = reactive({x: 0, y: 0})

watchEffect(() => {
  if (animateNodePositionFlag && fromInitialized) {
    gsap.to(animatedFrom, {
      duration: nodeAnimationTime,
      x: fromPos.value.x,
      y: fromPos.value.y,
      ease: 'power4.out',
    })
  } else {
    animatedFrom.x = fromPos.value.x
    animatedFrom.y = fromPos.value.y
  }
  fromInitialized = true
})

watchEffect(() => {
  if (animateNodePositionFlag && toInitialized) {
    gsap.to(animatedTo, {
      duration: nodeAnimationTime,
      x: toPos.value.x,
      y: toPos.value.y,
      ease: 'power4.out',
    })
  } else {
    animatedTo.x = toPos.value.x
    animatedTo.y = toPos.value.y
  }
  toInitialized = true
})

const d = computed(() => {
  //const from = outputPosition.value
  //const to = inputPosition.value
  const from = Vec2.from(animatedFrom)
  const to = Vec2.from(animatedTo)

  if (!from || !to)
    return ''

  const parts: string[] = []


  const offset = Math.min(to.sub(from).length, 10)

  const distance = to.sub(new Vec2(0, offset)).sub(
      from.add(new Vec2(0, offset))
  ).length


  const rad = (1 + Math.min(distance / 7, 30))

  let c1 = from.add(new Vec2(-rad, offset))
  let c2 = to.add(new Vec2(rad, -offset))
  if (from.x < to.x) {
    c1 = from.add(new Vec2(rad, offset))
    c2 = to.add(new Vec2(-rad, -offset))
  }


  const lines = getTangentsOf2Circles(c1, rad, c2, rad);

  line.value = (from.x < to.x) ? lines[2] : lines[3];
  if (!line.value)
    return [
      `M ${from.x} ${from.y}`,
      `C ${from.x} ${from.y + 10}, ${to.x} ${to.y - 10}, ${to.x} ${to.y}`
    ].join(' ')

  parts.push(`M ${from.x} ${from.y}`)
  parts.push(`L ${from.x} ${from.y + offset}`)
  parts.push(`A ${rad} ${rad} ${0} ${0} ${from.x > to.x ? 1 : 0} ${line.value.from.x} ${line.value.from.y}`)

  parts.push(`L ${line.value.to.x} ${line.value.to.y}`);
  parts.push(`A ${rad} ${rad} ${0} ${0} ${from.x < to.x ? 1 : 0} ${to.x} ${to.y - offset}`)
  parts.push(`L ${to.x} ${to.y}`)

  return parts.join(' ')
})

const styles = computed(() => ({
  transform: `translate(${line.value?.from.x}px, ${line.value?.from.y}px) rotate(${line.value?.angle}rad)`
}))

function handleMouseDown(evt: MouseEvent) {
  const parent = props.connection?.from.node.parent!
  parent?.selectConnections([props.connection!], evt.shiftKey)
}

const selected = computed(() => !!props.connection?.isSelected)

watch(hovering, () => emit('update:hovering', hovering.value > 0))

</script>

<style lang="scss">
.node-connection {
  stroke: rgba(255, 255, 255, 0.5);
  fill: transparent;
  pointer-events: stroke;
  stroke-width: 2;

  &.circular {
    stroke: #ee594d;
  }

  &.hovering, &.selected {
    stroke: white;
  }
}

.connection-hover-area {
  transform-origin: top left;
  pointer-events: all;
  fill: transparent;

  &:hover {

  }
}
</style>