<template>
  <storyboard-editor />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import StoryboardEditor from "@/components/StoryboardEditor.vue";

export default defineComponent({
  name: 'App',
  components: {
    StoryboardEditor
  }
});
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: v-sans sans-serif;
}
</style>
