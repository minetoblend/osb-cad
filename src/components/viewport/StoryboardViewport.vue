<template>
  <div class="editor-pane">
    <div class="viewport-container" ref="viewportContainer">

      <div class="viewport-handles">
        {{ctx.time}}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from "vue";
import * as PIXI from 'pixi.js'
import {PlayfieldContainer} from "@/components/viewport/playfield";
import {useContext} from "@/editor/ctx/use";

const viewportContainer = ref<HTMLDivElement>()

let app!: PIXI.Application
const ctx = useContext()

const resizeObserver = new ResizeObserver(([entry]) => {
  app.resize()

  const padding = 20

  const scale = Math.min(
      entry.contentRect.width / (640 + padding * 2),
      entry.contentRect.height / (480 + padding * 2)
  )

  app.stage.scale.set(scale, scale)

  app.stage.position.set(
      (entry.contentRect.width - scale * 640) / 2,
      (entry.contentRect.height - scale * 480) / 2,
  )
})

onMounted(() => {
  app = new PIXI.Application({
    width: 640,
    height: 480,
    antialias: false,
    resizeTo: viewportContainer.value
  })
  viewportContainer.value!.appendChild(app.view)
  resizeObserver.observe(viewportContainer.value!)
  init()
})

onBeforeUnmount(() => resizeObserver.disconnect())

function init() {
  addViewportContainer()
}

function addViewportContainer() {
  app.stage.addChild(new PlayfieldContainer(ctx))
}

</script>

<style>
.viewport-container {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>