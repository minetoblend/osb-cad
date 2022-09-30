<template>
  <!--<el-dropdown placement="bottom-start">
    <el-button link>
      Add
    </el-button>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="node in nodeTypes" :key="node[0]" @click="emit('createNode', node[0])">
          {{ node[0] }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>-->

  <el-menu mode="horizontal" menu-trigger="click" unique-opened active-text-color="#E5EAF3">
    <el-sub-menu index="1">
      <template #title>Add</template>
      <el-sub-menu v-for="(category, index) in categories" :key="category" :index="`1-${index+1}`">
        <template #title>{{ prettyName(category) }}</template>
        <el-menu-item v-for="(node, nodeIndex) in getNodesInCategory(category)"
                      :index="`1-${index+1}-${nodeIndex + 1}`"
                      @click="emit('createNode', node.type)">
          <icon class="mr-1" :icon="node.icon" fixed-width/>
          {{ prettyName(node.label) }}
        </el-menu-item>
      </el-sub-menu>
    </el-sub-menu>
    <el-sub-menu index="2">
      <template #title>Edit</template>
      <el-menu-item index="2-1" @click="layout">Layout Nodes</el-menu-item>
    </el-sub-menu>
    <div class="ml-2" style="display: flex; align-items: center">
      <el-breadcrumb>
        <el-breadcrumb-item @click="ctx.activePath.value = rootPath">
          Storyboard
        </el-breadcrumb-item>
        <el-breadcrumb-item v-for="subPath in ctx.activePath.value.parentPaths" :key="subPath.toString()"
                            @click="ctx.activePath.value = subPath">
          {{ subPath.end }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
  </el-menu>

</template>

<script setup lang="ts">

import {useContext} from "@/editor/ctx/use";
import {EditorPath} from "@/editor/node/path";
import {computed, h} from 'vue'
import {ElDivider} from "element-plus";
import {LayoutNodesCommand} from "@/editor/ctx/command/node";
import {NodeRegistry} from "@/editor/node/registry";

const ctx = useContext()
const nodesSystem = computed(() => ctx.activeNodeSystem.value)
const rootPath = EditorPath.root()

const spacer = h(ElDivider, {direction: 'vertical'})

const emit = defineEmits(['createNode'])

function layout() {
  ctx.executeCommand(new LayoutNodesCommand(ctx, nodesSystem.value.path,
      nodesSystem.value.selection.size > 0 ?
          [...nodesSystem.value.selection.keys()].map(it => it.name.value) :
          [...nodesSystem.value.nodeNames]
  ))
}

const categories = computed(() => [
  ...NodeRegistry[nodesSystem.value.nodeType as keyof typeof NodeRegistry].getNodeCategories()
])

const nodeTypes = computed(() => [
  ...NodeRegistry[nodesSystem.value.nodeType as keyof typeof NodeRegistry].getNodeTypes()
])

function getNodesInCategory(category: string) {
  return NodeRegistry[nodesSystem.value.nodeType as keyof typeof NodeRegistry].getNodesInCategory(category)
}

function prettyName(name: string) {
  name = name.charAt(0).toUpperCase() + name.slice(1)

  return name.replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2")
}

</script>