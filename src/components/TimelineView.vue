<template>
  <div ref="timelineContainer" class="timeline-view editor-pane" @mousedown="handleTimelineDrag" @wheel="handleScroll">
    <div class="lane-names-background"></div>
    <div class="lane-contents-background"></div>
    <timeline-lane v-for="node in nodes" :node="node" :start-time="startTime" :end-time="endTime"/>
    <div class="current-time-indicator"/>
  </div>
</template>

<script setup lang="ts">

import {useContext} from "@/editor/ctx/use";
import TimelineLane from "@/components/TimelineLane.vue";
import {computed, ref} from "vue";
import {drag} from "@/util/event";

const ctx = useContext()

const nodeSystem = ctx.activeNodeSystem

const nodes = computed(() => [...nodeSystem.value.nodeList])

let scale = ref(1)

const startTime = computed(() => ctx.time.value - 1000 * scale.value)
const endTime = computed(() => ctx.time.value + 1000 * scale.value)

const timelineContainer = ref<HTMLDivElement>()

function handleTimelineDrag(evt: MouseEvent) {
  if (evt.clientX < timelineContainer.value!.getBoundingClientRect().x + 200)
    return;
  drag(evt, {
    onDrag({delta}) {
      const width = timelineContainer.value!.getBoundingClientRect().width
      const relative = delta.x / (width - 200)

      ctx.time.value -= relative * (endTime.value - startTime.value)
    }
  })
}

function handleScroll(evt: WheelEvent) {
  let scrollAmount = -evt.deltaY;

  scale.value *= (1 - scrollAmount / 3000);


}

</script>

<style lang="scss">
.timeline-view {
  position: relative;
  user-select: none;

  .lane-names-background {
    position: absolute;
    width: 200px;
    top: 0;
    bottom: 0;
    left: 0;
    border-right: 2px solid #414243;
    background-color: #1D1E1F;
  }

  .lane-contents-background {
    position: absolute;
    left: 200px;
    top: 0;
    bottom: 0;
    right: 0;
  }

  .current-time-indicator {
    position: absolute;
    width: 1px;
    top: 0;
    bottom: 0;
    background-color: #42B983;
    left: calc(50% + 100px);
  }
}

</style>