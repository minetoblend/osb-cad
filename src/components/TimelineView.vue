<template>
  <div ref="timelineContainer" class="timeline-view editor-pane" @mousedown="handleTimelineDrag" @wheel="handleScroll">
    <div class="timeline-container">
      <div class="lane-names-background"></div>
      <div class="lane-contents-background">
        <div class="timeline-ticks">
          <div class="tick" v-for="tick in ticks" :key="tick.time" :class="`tick-${tick.type}`"
               :style="{left: `${(tick.time - startTime) / (endTime - startTime) * 100}%`}"/>
        </div>
      </div>
      <div class="lanes" ref="lanesContainer">
        <timeline-lane v-for="node in nodes" :node="node" :start-time="startTime" :end-time="endTime"
                       :active="node === ctx.activeNode.value" @select="ctx.activeNode.value = node"/>
      </div>
      <div class="timeline-overlay">
        <div class="current-time-indicator"/>
      </div>
    </div>
    <div class="timeline-controls">
      <el-checkbox-button :checked="ctx.clock.isPlaying" @change="ctx.clock.togglePlaying()">
        <icon :icon="ctx.clock.isPlaying ? 'pause':'play'"/>
      </el-checkbox-button>
      <div class="current-time">
        {{ formatTime(ctx.clock.animatedTime.value) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import {useContext} from "@/editor/ctx/use";
import TimelineLane from "@/components/TimelineLane.vue";
import {computed, ref, watchEffect} from "vue";
import {drag} from "@/util/event";
import {findCurrentTimingPoint, generateTicks, snapTime} from "@/util/timing";
import gsap from 'gsap'

const ctx = useContext()

const nodeSystem = ctx.activeNodeSystem

const nodes = computed(() => [...nodeSystem.value.nodeList])

let scale = ref(1)
let animatedScale = ref(scale.value)
let scaleTween: gsap.core.Tween | undefined = undefined

watchEffect(() => {
  if (scaleTween)
    scaleTween.kill()
  scaleTween = gsap.to(animatedScale, {value: scale.value, duration: 0.1})
})

const startTime = computed(() => ctx.clock.animatedTime.value - 1000 * animatedScale.value)
const endTime = computed(() => ctx.clock.animatedTime.value + 1000 * animatedScale.value)
const timelineContainer = ref<HTMLDivElement>()
const lanesContainer = ref<HTMLDivElement>()

function formatTime(time: number) {
  const sign = Math.sign(time)
  time = Math.abs(time)
  const minutes = Math.floor(time / 60_000)
  const seconds = Math.floor((time / 1000) % 60)
  const millis = Math.floor(time % 1000)
  const formatted = minutes.toString().padStart(2, '0') + ':' +
      seconds.toString().padStart(2, '0') + ':' +
      millis.toString().padStart(3, '0')
  if (sign < 0)
    return '-' + formatted
  return formatted
}

watchEffect(() => {
  if (lanesContainer.value && ctx.activeNode.value && ctx.activeNode.value.parent === nodeSystem.value) {
    const index = nodes.value.indexOf(ctx.activeNode.value)

    if (index >= 0) {
      lanesContainer.value!.scrollTo({
        //21 -> 14 (half the height of a lane) + 7 padding-top
        top: index * 28 + 21 - lanesContainer.value!.clientHeight / 2,
        behavior: "smooth"
      })
    }
  }
})

function handleTimelineDrag(evt: MouseEvent) {
  if (evt.clientX < timelineContainer.value!.getBoundingClientRect().x + 200)
    return;
  drag(evt, {
    onDrag({delta}) {
      const width = timelineContainer.value!.getBoundingClientRect().width
      const relative = delta.x / (width - 200)

      ctx.clock.seek(ctx.clock.time.value - relative * (endTime.value - startTime.value))
    }
  })
}

function handleScroll(evt: WheelEvent) {
  if (evt.ctrlKey) {
    evt.preventDefault()
    let scrollAmount = -evt.deltaY;
    scale.value *= (1 - scrollAmount / 3000);
  } else if (evt.shiftKey) {
    lanesContainer.value?.scroll({
      behavior: 'smooth',
      top: Math.sign(evt.deltaY) * Math.max(lanesContainer.value!.clientHeight * 0.8, Math.abs(evt.deltaY))
    })
  } else {
    evt.preventDefault()
    const beatmap = ctx.currentBeatmapObject.value
    if (beatmap && beatmap.timingPoints.some(it => it.timingChange)) {
      const timingPoint = findCurrentTimingPoint(beatmap.timingPoints, ctx.time.value)!
      let nextTime = ctx.time.value
      if (evt.deltaY > 0) {
        nextTime += timingPoint.beatLength / 4
      } else {
        nextTime -= timingPoint.beatLength / 4
      }
      ctx.clock.seekAnimated(snapTime(beatmap.timingPoints, nextTime, 4))
    } else {
      ctx.clock.seekAnimated(ctx.clock.time.value + 300 * Math.sign(scale.value))
    }
  }
}

const ticks = computed(() => {
  const beatmap = ctx.currentBeatmapObject.value
  if (beatmap) {
    return [...generateTicks(beatmap.timingPoints, startTime.value, endTime.value, 4)]
  }
  return []
})

</script>

<style lang="scss">

$controls-height: 44px;

.timeline-view {
  position: relative;
  user-select: none;
  height: 100%;

  .timeline-controls {
    position: absolute;
    height: $controls-height;
    width: 100%;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    background-color: #1D1E1F;
    display: flex;
    align-items: center;

    > *:not(:first-child) {
      margin-left: 10px;
    }

    .current-time {
      font-variant-numeric: tabular-nums;
    }
  }

  .timeline-container {
    position: absolute;
    top: 0;
    border-top: 2px solid #414243;
    bottom: $controls-height;
    width: 100%;
    overflow: hidden;
  }

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
    overflow: hidden;
  }

  .current-time-indicator {
    position: absolute;
    width: 4px;
    top: 0;
    bottom: 0;
    background-color: #ffffff;
    transform: translate(-50%, 0);
    left: calc(50%);
  }

  .timeline-overlay {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 200px;
    right: 12px;
    height: 100%;
  }

  .lanes {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    padding-top: 7px;
    padding-bottom: 7px;

    &::-webkit-scrollbar {
      width: 12px;
      height: 2em
    }

    &::-webkit-scrollbar-track {
      padding: 3px;
    }

    /* Handle */
    &::-webkit-scrollbar-thumb {
      box-shadow: inset 0 0 10px 10px #6f7077;
      border-radius: 6px;
      border: 3px solid transparent;
    }
  }

  .timeline-ticks {
    position: absolute;
    top: 0;
    left: 0;
    right: 12px;
    bottom: 0;
  }

  .tick {
    position: absolute;
    top: 0;
    transform: translate(-50%, 0);
    opacity: 0.75;

    &-0 {
      width: 3px;
      height: 40%;
      background-color: white;
      min-height: 56px;
    }

    &-1 {
      width: 2px;
      height: 30%;
      background-color: #ee594d;
      min-height: 28px;
    }

    &-2 {
      width: 2px;
      height: 30%;
      background-color: deeppink;
      min-height: 14px;
    }

    &-3 {
      width: 1.5px;
      height: 20%;
      background-color: dodgerblue;
      min-height: 21px;
    }

    &-4 {
      width: 1px;
      height: 20%;
      background-color: yellow;
      min-height: 21px;
    }

    &-5 {
      width: 1px;
      height: 20%;
      background-color: #42B983;
      min-height: 21px;
    }
  }
}

</style>