<template>
  <div class="node-parameters editor-pane">
    <template v-if="activeNode">
      <component v-for="(item, index) in activeNode.interface" :key="index" :is="item.component" :node="activeNode" :interface="item" />
    </template>
  </div>
</template>

<script setup lang="ts">
import {useContext} from "@/editor/ctx/context";
import {computed} from "vue";

const ctx = useContext()

const activeNode = computed(() => ctx.activeNode.value)

</script>