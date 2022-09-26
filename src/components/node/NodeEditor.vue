<template>
  <div class="node-editor editor-pane" tabIndex="-1">
    <shortcut-receiver @shortcut="handleShortcut" style="height: 100%;">
      <div style="height: 100% !important;">
        <node-editor-header @createNode="createNode"/>
        <div>
          <div ref="nodePane"
               class="node-pane"
               @mousedown.left.prevent="handleDragSelect"
               @mousedown.middle.prevent="handlePan"
               @wheel="handleScroll">
            <svg class="connections-container" v-if="initialized">
              <g :transform="connectionsTransform">
                <g v-for="connection in connections" :key="connection.id">
                  <node-connection-view :connection="connection"
                                        :from="connection.from"
                                        :to="connection.to"
                                        :editor-id="id"
                                        :bounds="bounds"
                                        :transform="transform"
                                        :circular="connection.circular.value"
                                        v-if="connection !== hiddenConnection"
                                        @update:hovering="handleNodeHoveringChanged(connection, $event)"
                  />
                </g>


                <g v-if="tempConnection.active">
                  <node-connection-view :from="tempConnection.from"
                                        :to="tempConnection.to"
                                        :editor-id="id"
                                        :bounds="bounds"
                                        :transform="transform"
                  />
                </g>
              </g>
            </svg>

            <div class="node-container" :style="styles">
              <node-view v-for="node in nodeSystem.nodeList"
                         :editor-id="id"
                         :node="node"
                         :selecting="selecting"
                         :selection-candidate="isSelectionCandidate(node)"
                         :ctx="ctx"
                         :key="node.name.value"
                         :viewport-scale="transform.scale"
                         :hovered-connections="hoveredConnections"
                         @connection:start="startConnection"
                         @socket:enter="hoveringSocket = $event"
                         @socket:leave="hoveringSocket = undefined"
              />
              <select-box v-if="selecting" :from="selectFrom" :to="selectTo"/>
            </div>
          </div>
        </div>
        <add-node-view/>
      </div>
    </shortcut-receiver>
  </div>
</template>

<script setup lang="ts">
import NodeView from './NodeView.vue';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowReactive,
  shallowRef,
  watch,
  watchPostEffect
} from "vue";
import {drag} from "@/util/event";
import {EditorLocation} from "@/components/node/util";
import {useContext} from "@/editor/ctx/use";
import {Vec2} from "@/util/math";
import SelectBox from "@/components/SelectBox.vue";
import NodeConnectionView from "@/components/node/NodeConnectionView.vue";
import {v4 as uuid} from 'uuid'
import {Node} from "@/editor/node";
import ShortcutReceiver from "@/components/ShortcutReceiver.vue";
import {
  AddConnectionCommand,
  CreateNodeCommand,
  DeleteNodesCommand,
  LayoutNodesCommand,
  RemoveConnectionCommand
} from "@/editor/ctx/command/node";
import {NodeConnection} from "@/editor/node/connection";
import {NodeInput, NodeOutput} from "@/editor/node/input";
import {EditorCommandCollection} from "@/editor/ctx/editorCommand";
import gsap from "gsap";
import AddNodeView from "@/components/node/AddNodeView.vue";
import NodeEditorHeader from "@/components/node/NodeEditorHeader.vue";
import Tween = gsap.core.Tween;

//const stack = reactive(new EditorStack())

const ctx = useContext()

const locations = ctx.locations

const currentLocation = computed(() => {
  const path = ctx.activeNodeSystem.value.path.toString()
  if (!locations.has(path)) {
    locations.set(path, new EditorLocation(path))
  }
  return locations.get(path)!
})


const nodeSystem = ctx.activeNodeSystem

const connections = shallowRef<ReadonlyArray<NodeConnection<any>>>([])

watchPostEffect(() => connections.value = nodeSystem.value.connectionList)

const nodePane = ref<HTMLDivElement>()
const id = uuid().substring(0, 4)
const initialized = ref(false)
const bounds = shallowRef<DOMRect>()

function onResize() {
  bounds.value = nodePane.value?.getBoundingClientRect()
}

const hoveredConnections = shallowReactive(new Set<NodeConnection>())

const observer = new ResizeObserver(onResize)

onMounted(() => {
  // this setup is needed to ensure the component has rendered at least once before the <connection/> elements are shown
  initialized.value = true
  bounds.value = nodePane.value?.getBoundingClientRect()
  observer.observe(nodePane.value!)
})

const transition = reactive({
  scale: 1
})

const transform = computed(() => {
  const location = currentLocation.value.clone()
  location.scale *= transition.scale
  location.position.move(new Vec2(
      -(1 - 1 / transition.scale) * (bounds.value?.width ?? 0) / 2,
      -(1 - 1 / transition.scale) * (bounds.value?.height ?? 0) / 2,
  ))
  return location
})

let tween: Tween | undefined;

watch(nodeSystem, (system, old) => {
  tween?.kill()

  if (system.isChildOf(old)) {
    transition.scale = 0.75
    tween = gsap.to(transition, {duration: 0.3, scale: 1})
  } else if (old.isChildOf(system)) {
    transition.scale = 1.5
    tween = gsap.to(transition, {duration: 0.3, scale: 1})
  }
})

onBeforeUnmount(() => {
  observer.disconnect()
})

function handleScroll(evt: WheelEvent) {
  let scrollAmount = evt.deltaY;

  const newScale = currentLocation.value.scale * (1 - scrollAmount / 3000);

  const currentPoint = new Vec2(
      evt.offsetX / currentLocation.value.scale - currentLocation.value.position.x,
      evt.offsetY / currentLocation.value.scale - currentLocation.value.position.y,
  );

  const newPoint = new Vec2(evt.offsetX / newScale - currentLocation.value.position.x, evt.offsetY / newScale - currentLocation.value.position.y)
  const diff = newPoint.sub(currentPoint)
  currentLocation.value.position.move(diff)
  currentLocation.value.scale = newScale
}

function handlePan(evt: MouseEvent) {
  drag(evt, {
    onDrag({delta}) {
      currentLocation.value.position =
          currentLocation.value.position.add(delta.divF(currentLocation.value.scale))
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
          start.x / currentLocation.value.scale - currentLocation.value.position.x,
          start.y / currentLocation.value.scale - currentLocation.value.position.y,
      );
      selectFrom.value = pos
      selectTo.value = pos
      selecting.value = true
    },
    onDrag({current}) {
      selectTo.value = new Vec2(
          current.x / currentLocation.value.scale - currentLocation.value.position.x,
          current.y / currentLocation.value.scale - currentLocation.value.position.y,
      )
    },
    onDragEnd() {
      nodeSystem.value.select(
          [...nodeSystem.value.nodeList].filter(node => isSelectionCandidate(node)),
          additive
      )
      selecting.value = false
    },
    onClick: () => {
      nodeSystem.value.select([])
    }
  })
}

const styles = computed(() =>
    ({
      "transform-origin": "0 0",
      "transform": `scale(${transform.value.scale})`,
      "top": transform.value.scale * transform.value.position.y + "px",
      "left": transform.value.scale * transform.value.position.x + "px"
    })
);

const connectionsTransform = computed(() => `translate(${transform.value.scale * transform.value.position.x}, ${transform.value.scale * transform.value.position.y}) scale(${transform.value.scale})`)

function handleShortcut(evt: CustomEvent) {
  switch (evt.detail as string) {
    case 'delete':
      if (ctx.activeNode.value)
        if (nodeSystem.value.selectedNodes.length > 0)
          ctx.executeCommand(
              new DeleteNodesCommand(ctx, nodeSystem.value.selectedNodes.map(it => it.path))
          )
      if (nodeSystem.value.selectedConnections.length > 0)
        ctx.executeCommand(
            new EditorCommandCollection(ctx, 'Delete Connections', nodeSystem.value.selectedConnections.map(connection =>
                new RemoveConnectionCommand(ctx, connection.from.node.path, connection.from.index, connection.to.node.path, connection.to.index)
            ))
        )
      break;
    case 'l':
      console.log('layout nodes')
      if (nodeSystem.value.selectedNodes.length) {
        ctx.executeCommand(new LayoutNodesCommand(ctx, nodeSystem.value.path, nodeSystem.value.selectedNodes.map(it => it.name.value)))
      } else {
        ctx.executeCommand(new LayoutNodesCommand(ctx, nodeSystem.value.path, [...nodeSystem.value.nodeNames]))
      }
      break;
    case 'ctrl+a':
      evt.preventDefault()
      nodeSystem.value.select([...nodeSystem.value.nodeList])
      break;
    case 'ctrl+d':
      evt.preventDefault()
      nodeSystem.value.select([])
      break;
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
      current = current.clone()
          .divF(transform.value.scale)
          .sub(transform.value.position)


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

function createNode(type: string) {
  const rect = nodePane.value!.getBoundingClientRect()
  ctx.executeCommand(new CreateNodeCommand(ctx, nodeSystem.value.path, type, {
    position: new Vec2(
        -currentLocation.value.position.x + rect.width / 2 / currentLocation.value.scale,
        -currentLocation.value.position.y + rect.height / 2 / currentLocation.value.scale
    )
  }))
}

function handleNodeHoveringChanged(connection: NodeConnection, hovering: boolean) {
  if (hovering)
    hoveredConnections.add(connection)
  else
    hoveredConnections.delete(connection)
}

watch(connections, () => {
  const previous = new Set(hoveredConnections)
  hoveredConnections.clear()
  connections.value.forEach(it => {
    if (previous.has(it))
      hoveredConnections.add(it)
  })
})

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
  pointer-events: none;
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