<template>
  <div class="timeline-lane">
    <div class="name">
      {{ node.name.value }}
    </div>
    <div class="lane-contents" ref="laneContents">
      <div v-if="timing"
           class="time"
           :class="{invalid: !hasValidTime, [timing.type]: true}"
           :style="styles"
           @mousedown.stop.prevent="handleMouseDown">
        <template v-for="(keyframe, index) in timing.keyframes.slice().reverse()" :key="index">
          <div class="keyframe"
               v-if="keyframe.time + (keyframe.duration || 0) > startTime && keyframe.time < endTime"
               :style="{left: `${(keyframe.time - actualStartTime) / (duration) * 100}%`}">
            <div class="keyframe-handle" @mousedown.stop.prevent="handleKeyframeMousedown($event, keyframe)"
                 :style="{width: keyframe.duration ? `${24 + timeToPixels(keyframe.duration)}px` : undefined}"/>

            <div v-if="keyframe.label" class="keyframe-label" :style="labelStyle(index)">
              {{ keyframe.label }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import {computed, PropType, ref} from "vue";
import {KeyframeInformation, Node} from "@/editor/node";
import {useContext} from "@/editor/ctx/use";
import {drag} from "@/util/event";

const ctx = useContext()

const nodeSystem = ctx.activeNodeSystem

const nodes = computed(() => [...nodeSystem.value.nodeList])

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
  startTime: {
    type: Number,
    required: true,
  },
  endTime: {
    type: Number,
    required: true,
  },
})

const timing = computed(() => props.node.timingInformation)
const hasValidTime = computed(() => timing.value!.startTime <= timing.value!.endTime)
const visibleDuration = computed(() => props.endTime - props.startTime)
const duration = computed(() => Math.abs(timing.value!.endTime - timing.value!.startTime))
const laneContents = ref<HTMLDivElement>()

const actualStartTime = computed(() =>
    Math.min(timing.value!.startTime, timing.value!.endTime)
)

function timeToPercentage(time: number) {
  return time / visibleDuration.value * 100
}

function timeToPixels(time: number) {
  if (!laneContents.value)
    return 0
  const width = laneContents.value!.getBoundingClientRect().width
  return (time / visibleDuration.value) * width
}

const styles = computed(() => {
  const {startTime, endTime} = timing.value!
  return {
    left: `${timeToPercentage(Math.min(startTime, endTime) - props.startTime)}%`,
    width: `${timeToPercentage(Math.abs(startTime - endTime))}%`
  }
})

function labelStyle(index: number) {
  const keyframe = timing.value!.keyframes[index]
  const nextKeyframe = timing.value!.keyframes[index + 1]
  if (nextKeyframe === undefined)
    return {}
  return {
    'max-width': `${Math.max(timeToPixels(nextKeyframe.time - keyframe.time) - 40, 0)}px`
  }
}

function handleMouseDown(evt: MouseEvent) {
  if (timing.value?.drag) {
    drag(evt, {
      el: laneContents.value,
      scale: visibleDuration.value / laneContents.value!.getBoundingClientRect().width,
      ...timing.value.drag
    })
  }
}

function handleKeyframeMousedown(evt: MouseEvent, keyframe: KeyframeInformation) {
  if (keyframe.drag)
    drag(evt, {
      el: laneContents.value,
      scale: visibleDuration.value / laneContents.value!.getBoundingClientRect().width,
      ...keyframe.drag
    })
}

</script>

<style lang="scss">
.timeline-lane {
  position: relative;
  height: 28px;
  align-items: stretch;
  pointer-events: fill;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .name {
    width: 200px;
    position: absolute;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .lane-contents {
    flex-grow: 1;
    position: absolute;
    left: 200px;
    height: 100%;
    right: 0;
    overflow: hidden;

    .time {
      pointer-events: all;
      position: absolute;

      cursor: pointer;
      box-sizing: border-box;

      &.clip {
        top: 2px;
        bottom: 2px;
        background-color: #6f7077;
        border-radius: 2px;
      }

      &.beatmap {
        top: 0;
        bottom: 0;
        height: 100%;
        border-radius: 14px;

        .keyframe {
          display: block;
          position: absolute;
          top: 2px;

          .keyframe-handle {
            height: 24px;
            width: 24px;
            left: -12px;
            position: absolute;
            background-color: #121212;
            border-radius: 12px;
            border: 3px solid #42B983;
            box-sizing: border-box;

            &:hover {
              background-color: white;
            }
          }
        }
      }

      &.animation {
        top: 0;
        bottom: 0;
        height: 8px;
        margin: auto 0;
        background-color: adjust-color(#42B983, $alpha: -0.5);
        border-radius: 2px;

        .keyframe {
          display: block;
          position: absolute;
          top: 4px;


          .keyframe-handle {
            height: 12px;
            width: 12px;
            position: absolute;
            background-color: #42B983;
            transform-origin: center;
            transform: rotate(45deg) translate(-4px, -4px);

            &:hover {
              background-color: white;
            }
          }

          .keyframe-label {
            position: absolute;
            left: 20px;
            top: -10px;
            width: 250px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }
      }

      &.invalid {
        background-image: linear-gradient(45deg, #ee594d 10%, transparent 10%, transparent 50%, #ee594d 50%, #ee594d 60%, transparent 60%, transparent 100%);
        background-size: 7.07px 7.07px;
        border: 2px solid #ee594d;
      }
    }
  }
}
</style>