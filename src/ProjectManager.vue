<template>
  <storyboard-editor v-if="editorContext" :ctx="editorContext" @close="closeProject"/>
  <div v-else class="project-dialog-wrapper" v-loading="loading">
    <el-row class="project-dialog" align="middle" :gutter="30">
      <el-col :span="12">
        <h3>Recent files</h3>
        <div v-if="recentFiles.length === 0">
          You don't have any recent files
        </div>
        <div v-for="file in recentFiles" :key="file">
          <el-button class="recent-document" link @click="openProject(file.path)">
            <div class="name">
              {{ file.path }}
            </div>
            <div class="date">
              {{ formatDate(file.date) }}
            </div>
          </el-button>
        </div>
      </el-col>
      <el-col :span="12">
        <el-button @click="openProject()">
          Open Project
        </el-button>
        <el-button @click="createProject">
          Create Project
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import {addRecentFile, useRecentFiles} from "@/editor/files";
import {ref, shallowRef} from "vue";
import {EditorContext} from "@/editor/ctx/context";
import {animationFrameAsPromise} from "@/util/promise";

const recentFiles = useRecentFiles()
const loading = ref(false)

const editorContext = shallowRef<EditorContext>()

async function createProject() {
  const result = await electronAPI.selectDirectory(electronAPI.getOsuSongsDirectory()!)
  if (!result.canceled && result.filePaths?.length === 1) {
    const path = result.filePaths[0]

    loading.value = true
    await animationFrameAsPromise()

    const ctx = new EditorContext()
    ctx.mapsetPath.value = path
    await ctx.load()
    loading.value = false

    editorContext.value = ctx
  }
}

async function openProject(projectPath?: string) {
  if (!projectPath) {
    const res = await electronAPI.openFileDialog({
      filters: [
        {name: 'osb!cad projects', extensions: ['osbcad']},
      ]
    })
    if (res.canceled || res.filePaths?.length !== 1)
      return;
    projectPath = res.filePaths[0]
  }

  loading.value = true
  await animationFrameAsPromise()

  const ctx = new EditorContext()
  const projectJson = await electronAPI.readTextFile(projectPath!)
  await ctx.loadProject(JSON.parse(projectJson))
  await addRecentFile(projectPath!)

  ctx.projectFilepath.value = projectPath!
  loading.value = false

  editorContext.value = ctx
}

function formatDate(date: Date) {
  const formatter = new Intl.RelativeTimeFormat('en-US', {
    numeric: "auto",
    style: "short"
  })
  const now = new Date()

  const diff = (date.getTime() - now.getTime())

  const minutes = Math.floor(diff / 60_000)
  if (Math.abs(minutes) < 60)
    return formatter.format(minutes, 'minutes')
  const hours = Math.floor(minutes / 60)
  if (Math.abs(hours) < 24)
    return formatter.format(hours, 'hours')

  return new Intl.DateTimeFormat('en-US').format(date)
}

function closeProject() {
  editorContext.value?.destroy()
  editorContext.value = undefined
}


</script>

<style lang="scss">
.project-dialog-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-dialog {
  max-width: 800px;
  width: 100%;

  .el-col {

  }

  .recent-document {
    display: flex;
    width: 100%;

    > span {
      width: 100%;
      justify-content: space-between;

      .name {
        flex-grow: 1;
        //text-align: left;
        max-width: 75%;
        margin-right: 10px;
        text-overflow: ellipsis;
        overflow: hidden;
        direction: rtl;
        text-align: left;
      }

      .date {
        text-align: right;
      }
    }
  }
}
</style>