<template>
  <div class="editor-pane">
    <div class="viewport-container" ref="viewportContainer">
      <div class="viewport-overlay">
        <div class="command-stats">
          <div>
            Command count: {{ statistics.commandCount }}
          </div>
          <template v-if="statistics.spritesWithOverlappingCommandCount">
            <div>
              Sprites with overlapping commands: {{ statistics.spritesWithOverlappingCommandCount }}
            </div>
            <div>
              Total overlapping commands: {{ statistics.overlappingCommandCount }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, shallowRef, watchEffect} from "vue";
import * as PIXI from 'pixi.js'
import {PlayfieldContainer} from "@/components/viewport/playfield";
import {useContext} from "@/editor/ctx/use";
import {StoryboardStatistics} from "@/components/viewport/statistics";

const viewportContainer = ref<HTMLDivElement>()

//let app!: PIXI.Application
const ctx = useContext()
const stage = new PIXI.Container()
const playfield = shallowRef<PlayfieldContainer>()

const renderer = new PIXI.Renderer({
  width: 640,
  height: 480,
  antialias: false,
})

const resizeObserver = new ResizeObserver(([entry]) => {
  renderer.resize(entry.contentRect.width, entry.contentRect.height)

  const padding = 20

  const scale = Math.min(
      entry.contentRect.width / (640 + padding * 2),
      entry.contentRect.height / (480 + padding * 2)
  )

  stage.scale.set(scale, scale)

  stage.position.set(
      (entry.contentRect.width - scale * 640) / 2,
      (entry.contentRect.height - scale * 480) / 2,
  )

  renderer.render(stage)
})

onMounted(() => {
  viewportContainer.value!.appendChild(renderer.view)
  resizeObserver.observe(viewportContainer.value!)
  init()
})

onBeforeUnmount(() => resizeObserver.disconnect())

function init() {
  addViewportContainer()
}

function addViewportContainer() {
  playfield.value = new PlayfieldContainer(ctx)
  stage.addChild(playfield.value)
}

const statistics = shallowRef(new StoryboardStatistics())

watchEffect(() => {
  if (playfield.value) {
    statistics.value = playfield.value.updateSprites(ctx.currentGeometry.value, ctx.clock.animatedTime.value)
    renderer.render(stage)
  }
})

</script>

<style>
.viewport-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.viewport-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  bottom: 0;

}
</style>