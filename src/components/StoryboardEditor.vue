<template>
  <dock-menu :items="menuItems" @selected="onCommandSelected" :theme="{
      primary: '#121212',
      secondary: '#1D1E1F',
      tertiary: '#1D1E1F',
      textColor: '#c8ced3'
  }">

  </dock-menu>
  <div class="storyboard-editor" v-loading="loading">
    <shortcut-receiver @shortcut="handleShortcut">
      <splitpanes horizontal>
        <pane size="100">
          <splitpanes style="height: 100%">
            <pane size="60">
              <storyboard-viewport/>
            </pane>
            <pane size="40">
              <splitpanes horizontal>
                <pane>
                  <node-parameters/>
                </pane>
                <pane>
                  <node-editor/>
                </pane>
              </splitpanes>
            </pane>
          </splitpanes>
        </pane>
        <pane size="20" min-size="5">
          <timeline-view/>
        </pane>
      </splitpanes>
    </shortcut-receiver>
  </div>
</template>

<script setup lang="ts">
import NodeEditor from "@/components/node/NodeEditor.vue";
import {Pane, Splitpanes} from 'splitpanes'
import NodeParameters from "@/components/node/parameters/NodeParameters.vue";
import {defineEmits, defineProps, PropType, provide, reactive, ref, watchEffect} from "vue";
import StoryboardViewport from "@/components/viewport/StoryboardViewport.vue";
import TimelineView from "@/components/TimelineView.vue";
import {DockMenu} from "vue-dock-menu";
import {EditorContext} from "@/editor/ctx/context";
import ShortcutReceiver from "@/components/ShortcutReceiver.vue";

const props = defineProps({
  ctx: {
    type: Object as PropType<EditorContext>,
    required: true
  }
})

provide('ctx', props.ctx)

const beatmaps = props.ctx.fileStore.beatmaps

const emit = defineEmits(['close'])

const diffSelectMenu = reactive({
  name: 'Select Difficulty',
  menu: [] as any[]
})

const menuItems = reactive([
  {
    name: "File",
    menu: [
      {
        name: 'Save'
      },
      {
        name: 'Save As'
      },
      {
        name: 'Close'
      },
      {isDivider: true},
      diffSelectMenu
    ],
  },
  {
    name: "Edit",
    menu: [
      {
        name: "Undo",
      },
      {
        name: "Redo",
      }
    ]
  }
])

watchEffect(() => {
  diffSelectMenu.menu = beatmaps.value.map(it => {
    return {
      name: it.Version,
    }
  })
})

const loading = ref(false)

async function onCommandSelected({name, path}: { name: string, path: string }) {
  console.log(name, path)
  if (path.startsWith('file>select difficulty')) {
    props.ctx.activeBeatmap.value = name
  }
  if (path === 'file>save') {
    loading.value = true
    try {
      await props.ctx.save()
    } catch (e) {
    }
    loading.value = false
  }
  if (path === 'file>save as') {
    loading.value = true
    try {
      await props.ctx.save(true)
    } catch (e) {
    }
    loading.value = false
  }
  if (path === 'file>close') {
    emit('close')
  }
  if (path === 'edit>undo') {
    props.ctx.history.undo()
  }
  if (path === 'edit>redp') {
    props.ctx.history.redo()
  }

}


function handleShortcut(evt: CustomEvent) {
  switch (evt.detail as string) {
    case 'ctrl+z':
      evt.preventDefault()
      props.ctx.history.undo()
      break;
    case 'ctrl+y':
      evt.preventDefault()
      props.ctx.history.redo()
      break;
    case 'ctrl+s':
      evt.preventDefault()
      props.ctx.save()
      break;
    case 'ctrl+shift+s':
      evt.preventDefault()
      props.ctx.save(true)
      break;
    case 'space':
      evt.preventDefault()
      props.ctx.clock.togglePlaying()
      break;
  }
}

</script>

<style lang="scss">

.storyboard-editor {
  position: absolute;
  width: 100vw;
  top: 2.5rem;
  bottom: 0;
}


</style>