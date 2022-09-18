<template>
  <div class="node-parameters editor-pane">
    <template v-if="activeNode">
      <div v-for="(item, index) in activeNode.interface" :key="index" class="node-param">
        <label v-if="item.label">
          {{ item.label }}
        </label>
        <component :is="item.component" :node="activeNode" :interface="item" class="param-conents"/>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {useContext} from "@/editor/ctx/use";
import {computed} from "vue";

const ctx = useContext()

const activeNode = computed(() => ctx.activeNode.value)

</script>

<style lang="scss">
.node-param {
  display: flex;
  padding: 10px;

  label {
    width: 120px;
  }

  .param-conents {
    flex-grow: 1;
  }
}

.component-row {
  display: flex;
  justify-content: stretch;

  >:not(:first-child) {
    margin-left: 0.5rem;
  }
}
</style>