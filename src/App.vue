<template>
  <project-manager/>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import StoryboardEditor from "@/components/StoryboardEditor.vue";
import ProjectManager from "@/ProjectManager.vue";

export default defineComponent({
  name: 'App',
  components: {
    ProjectManager,
    StoryboardEditor
  }
});
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: v-sans, sans-serif;
}

#app {
  position: absolute;
  width: 100vw;
  height: 100vh;
}
</style>
