<template>
  <div class="storyboard-editor">
    <splitpanes style="height: 100%">
      <pane>
        <storyboard-viewport/>
      </pane>
      <pane>
        <splitpanes horizontal>
          <pane>
            <node-parameters />
          </pane>
          <pane>
            <node-editor/>
          </pane>
        </splitpanes>
      </pane>
    </splitpanes>
  </div>

</template>
<script setup lang="ts">
import NodeEditor from "@/components/node/NodeEditor";
import {EditorContext} from "@/editor/ctx/context";
import {Splitpanes, Pane} from 'splitpanes'
import NodeParameters from "@/components/node/parameters/NodeParameters.vue";
import {provide} from "vue";
import StoryboardViewport from "@/components/viewport/StoryboardViewport.vue";

const ctx = new EditorContext()

provide('ctx', ctx)

</script>

<style lang="scss">

.storyboard-editor {
  width: 100vw;
  height: 100vh;
}


</style>