<template>
  <div class="node-editor editor-pane" tabindex="-1">
    <shortcut-receiver @shortcut="handleShortcut" style="height: 100%;">
      <el-container style="height: 100% !important;">
        <el-header style="display: flex; align-items: center; border-bottom: 1px solid var(--el-border-color)">
          <el-breadcrumb>
            <el-breadcrumb-item @click="ctx.activePath.value = rootPath">
              Storyboard
            </el-breadcrumb-item>
            <el-breadcrumb-item v-for="(path) in ctx.activePath.value.parentPaths" :key="path.toString()"
                                @click="ctx.activePath.value = path">
              {{ path.current }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </el-header>
        <el-main style="padding:0">
          <div ref="nodePane"
               class="node-pane"
               @mousedown.left="handleDragSelect"
               @mousedown.middle="handlePan"
               @click.left="deselectAll"
               @wheel="handleScroll">
            <svg class="connections-container" v-if="initialized">
              <g v-for="connection in nodeSystem.connectionList" :key="connection.id">
                <node-connection-view :from="connection.from" :to="connection.to" :editor-id="id" :bounds="bounds"
                                      :transform="stack.current"
                                      :circular="connection.circular.value"
                                      v-if="connection !== hiddenConnection"
                />
              </g>


              <g v-if="tempConnection.active">
                <node-connection-view :from="tempConnection.from" :to="tempConnection.to" :editor-id="id"
                                      :bounds="bounds"
                                      :transform="stack.current"/>
              </g>
            </svg>

            <div class="node-container" :style="styles">
              <node-view v-for="node in nodeSystem.nodeList"
                         :editor-id="id"
                         :node="node"
                         :selecting="selecting"
                         :selection-candidate="isSelectionCandidate(node)"
                         :ctx="ctx"
                         :key="node.name"
                         :viewport-scale="stack.current.scale"
                         @connection:start="startConnection"
                         @socket:enter="hoveringSocket = $event"
                         @socket:leave="hoveringSocket = undefined"
              />
              <select-box v-if="selecting" :from="selectFrom" :to="selectTo"/>
            </div>
          </div>
        </el-main>
      </el-container>
    </shortcut-receiver>
  </div>
</template>

<script setup lang="ts">
import NodeView from './NodeView.vue';
import {computed, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, shallowRef} from "vue";
import {drag} from "@/util/event";
import {EditorStack} from "@/components/node/util";
import {useContext} from "@/editor/ctx/use";
import {Vec2} from "@/util/math";
import SelectBox from "@/components/SelectBox.vue";
import NodeConnectionView from "@/components/node/NodeConnectionView.vue";
import {NodeSystem} from "@/editor/node/system";
import {v4 as uuid} from 'uuid'
import {Node, NodeInput, NodeOutput} from "@/editor/node";
import ShortcutReceiver from "@/components/ShortcutReceiver.vue";
import {AddConnectionCommand, DeleteNodesCommand, RemoveConnectionCommand} from "@/editor/ctx/command/node";
import {NodeConnection} from "@/editor/node/connection";
import {NodePath} from "@/editor/node/path";

const stack = reactive(new EditorStack())

const ctx = useContext()

const nodeSystem = computed(() =>
    ctx.getObject(ctx.activePath.value) as NodeSystem<any>
  )

const rootPath = NodePath.root()

const nodePane = ref<HTMLDivElement>()

const id = uuid().substring(0, 4)
const initialized = ref(false)
const bounds = shallowRef<DOMRect>()

function onResize() {
  bounds.value = nodePane.value?.getBoundingClientRect()
}

const observer = new ResizeObserver(onResize)

onMounted(() => {
  // this setup is needed to ensure the component has rendered at least once before the <connection/> elements are shown
  initialized.value = true
  bounds.value = nodePane.value?.getBoundingClientRect()
  observer.observe(nodePane.value!)
})

onBeforeUnmount(() => {
  observer.disconnect()
})


function handleScroll(evt: WheelEvent) {
  let scrollAmount = evt.deltaY;

  const newScale = stack.current.scale * (1 - scrollAmount / 3000);

  const currentPoint = new Vec2(
      evt.offsetX / stack.current.scale - stack.current.position.x,
      evt.offsetY / stack.current.scale - stack.current.position.y,
  );

  const newPoint = new Vec2(evt.offsetX / newScale - stack.current.position.x, evt.offsetY / newScale - stack.current.position.y)
  const diff = newPoint.sub(currentPoint)
  stack.current.position.move(diff)
  stack.current.scale = newScale;
}

function handlePan(evt: MouseEvent) {
  drag(evt, {
    onDrag({delta}) {
      stack.current.position =
          stack.current.position.add(delta.divF(stack.current.scale))
    }
  })
}

const selecting = ref(false)
const selectFrom = ref<Vec2>()
const selectTo = ref<Vec2>()

function isSelectionCandidate(node: Node) {
  if (!selecting.value)
    return false
  const min = selectFrom.value!.min(selectTo.value!)
  const max = selectFrom.value!.max(selectTo.value!)
  return node.isInRect(min, max)
}

function handleDragSelect(evt: MouseEvent) {
  const additive = evt.shiftKey
  drag(evt, {
    el: nodePane.value,
    onDragStart({start}) {
      const pos = new Vec2(
          start.x / stack.current.scale - stack.current.position.x,
          start.y / stack.current.scale - stack.current.position.y,
      );
      selectFrom.value = pos
      selectTo.value = pos
      selecting.value = true
    },
    onDrag({current}) {
      selectTo.value = new Vec2(
          current.x / stack.current.scale - stack.current.position.x,
          current.y / stack.current.scale - stack.current.position.y,
      )
    },
    onDragEnd() {
      nodeSystem.value.select(
          [...nodeSystem.value.nodeList].filter(node => isSelectionCandidate(node)),
          additive
      )
      selecting.value = false
    }
  })
}


function deselectAll() {
  nodeSystem.value.select([])
}

const styles = computed(() =>
    ({
      "transform-origin": "0 0",
      "transform": `scale(${stack.current.scale})`,
      "top": stack.current.scale * stack.current.position.y + "px",
      "left": stack.current.scale * stack.current.position.x + "px"
    })
);

function handleShortcut(shortcut: string) {
  switch (shortcut) {
    case 'delete': {
      if (ctx.activeNode.value)
        ctx.executeCommand(
            new DeleteNodesCommand(ctx, nodeSystem.value.selectedNodes.map(it => it.path))
        )
    }
  }
}

const tempConnection = shallowReactive({
  active: false,
  from: Vec2.zero() as Vec2 | NodeOutput,
  to: Vec2.zero() as Vec2 | NodeInput
})

const hoveringSocket = shallowRef<NodeInput | NodeOutput>()

let hiddenConnection = shallowRef<NodeConnection>()

function startConnection({evt, socket}: { socket: NodeInput | NodeOutput, evt: MouseEvent }) {
  drag(evt, {
    el: nodePane.value,
    onDragStart({current}) {
      tempConnection.active = true
      if (socket instanceof NodeInput) {
        const existingConnections = nodeSystem.value.getConnectionsLeadingTo(socket)
        if (existingConnections.length) {
          hiddenConnection.value = existingConnections[0]
          tempConnection.from = existingConnections[0].from
          socket = existingConnections[0].from
          tempConnection.to = current
        } else {
          tempConnection.to = socket
          tempConnection.from = current
        }
      } else {
        tempConnection.to = current
        tempConnection.from = socket
      }
    },
    onDrag({current}) {
      if (socket instanceof NodeInput) {
        if (hoveringSocket.value instanceof NodeOutput)
          tempConnection.from = hoveringSocket.value
        else
          tempConnection.from = current
      } else {
        if (hoveringSocket.value instanceof NodeInput)
          tempConnection.to = hoveringSocket.value
        else
          tempConnection.to = current
      }
    },
    onDragEnd() {
      if (hiddenConnection.value) {
        const connection = hiddenConnection.value!
        ctx.executeCommand(new RemoveConnectionCommand(ctx,
            connection.from.node.path,
            connection.from.index,
            connection.to.node.path,
            connection.to.index,
        ))
        hiddenConnection.value = undefined
      }

      if (socket instanceof NodeInput && hoveringSocket.value instanceof NodeOutput) {
        ctx.executeCommand(new AddConnectionCommand(ctx,
            hoveringSocket.value.node.path,
            hoveringSocket.value.index,
            socket.node.path,
            socket.index,
        ))
      } else if (socket instanceof NodeOutput && hoveringSocket.value instanceof NodeInput) {
        ctx.executeCommand(new AddConnectionCommand(ctx,
            socket.node.path,
            socket.index,
            hoveringSocket.value.node.path,
            hoveringSocket.value.index,
        ))
      }
      tempConnection.active = false
    }
  })
}

</script>


<style lang="scss">
.node-pane {
  position: absolute;
  width: 100%;
  height: 100%;
  user-select: none;
  overflow: hidden;
}


.node-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.connections-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none !important;
}


</style>