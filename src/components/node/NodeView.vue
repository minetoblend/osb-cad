<template>
  <div class="node" :style="styles" :id="id" :class="classes">
    <div class="node-contents"
         @mousedown.self.left.stop="handleDrag"
         @click.stop
         @dblclick="handleDblClick"
    >
      <button class="node-toggle">
        <icon :icon="['fas', 'arrow-up']" fixed-width/>
      </button>
      <div class="node-icon">
        <icon icon="rotate" v-if="node.isCooking.value" fixed-width spin/>
        <icon :icon="node.icon" v-else fixed-width/>
      </div>
      <div class="node-status-indicator"></div>
      <button class="node-toggle" :class="{selected: node.isOutput}" @click.prevent="setOutput">
        <icon :icon="['fas', 'flag-checkered']" fixed-width/>
      </button>
    </div>
    <div class="node-inputs">
      <div class="node-socket input-socket" :class="{multiple: socket.multiple}" v-for="socket in node.inputs"
           @mousedown.stop.prevent="startSocketDrag(socket, $event)"
           @mouseenter="$emit('socket:enter', socket)"
           @mouseleave="$emit('socket:leave', socket)"
      />
    </div>
    <div class="node-outputs">
      <div class="node-socket output-socket" v-for="socket in node.outputs"
           @mousedown.stop.prevent="startSocketDrag(socket, $event)"
           @mouseenter="$emit('socket:enter', socket)"
           @mouseleave="$emit('socket:leave', socket)"/>
    </div>
    <div class="node-label" contenteditable="true" @keydown.enter.prevent="updateNodeName" @blur="updateNodeName">
      {{ node.name.value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {Node, NodeStatus} from "@/editor/node";
import {computed, defineEmits, defineProps, PropType, reactive, ref, watchEffect} from "vue";
import {drag} from "@/util/event";
import {MoveNodesOperation} from "@/editor/ctx/operations/move";
import {EditorContext} from "@/editor/ctx/context";
import {AddConnectionCommand, RenameNodeCommand, SetOutputNodeCommand} from "@/editor/ctx/command/node";
import {NodeInput, NodeOutput} from "@/editor/node/input";
import {animateNodePosition, animateNodePositionFlag} from "@/util/flags";
import gsap from 'gsap'
import {nodeAnimationTime} from "@/globals";
import {NodeConnection} from "@/editor/node/connection";
import {EditorCommandCollection, MoveNodesCommand} from "@/editor/ctx/editorCommand";
import {Vec2} from "@/util/math";

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true
  },
  viewportScale: {
    type: Number,
    default: 1
  },
  selecting: {
    type: Boolean,
    required: true,
  },
  selectionCandidate: {
    type: Boolean,
    required: true,
  },
  editorId: {
    type: String,
    required: true,
  },
  ctx: {
    type: Object as PropType<EditorContext>,
    required: true
  },
  hoveredConnections: {
    type: Object as PropType<Set<NodeConnection>>,
    required: true
  }
})

const emit = defineEmits(['connection:start', 'socket:enter', 'socket:leave'])

const id = computed(() => props.editorId + props.node.name.value)

const isDragging = ref(false)

function handleDrag(evt: MouseEvent) {
  if (!props.node.isSelected)
    props.node.parent!.select([props.node], evt.shiftKey)

  const operation = new MoveNodesOperation(props.ctx, props.node.parent!.selectedNodes)

  drag(evt, {
    onDragStart: () => isDragging.value = true,
    onDrag: ({delta}) => operation.move(delta.divF(props.viewportScale)),
    onDragEnd: () => {
      if (props.hoveredConnections.size > 0 && operation.items.length === 1) {
        const connection = [...props.hoveredConnections.values()][0]
        operation.cancel()
        animateNodePosition(() => {
          const deltaY = connection.to.node.position.value.y - connection.from.node.position.value.y - 200
          const dependencies = [connection.from.node, ...connection.from.node.getDependenciesInParent()]
          props.ctx.executeCommand(new EditorCommandCollection(props.ctx, 'Move Node', [
            //new MoveNodesCommand(props.ctx, [operation.items[0].path], [position]),
            new AddConnectionCommand(props.ctx,
                connection.from.node.path,
                connection.from.index,
                props.node.path,
                0
            ),
            new AddConnectionCommand(props.ctx,
                props.node.path,
                0,
                connection.to.node.path,
                connection.to.index,
            ),
            new MoveNodesCommand(
                props.ctx,
                [
                  props.node.path,
                  ...dependencies.map(it => it.path)
                ],
                [
                  connection.from.node.position.value.withY(connection.to.node.position.value.y - 100),
                  ...dependencies.map(it => it.position.value.add(new Vec2(0, deltaY)))
                ]
            )
          ]))
        })
      } else {
        operation.commit()
      }
      isDragging.value = false
    },
  })
}

function handleDblClick() {
  props.node.handleDoubleClick()
}

function startSocketDrag(socket: NodeInput | NodeOutput, evt: MouseEvent) {
  emit("connection:start", {
    evt,
    socket,
  })
}

const classes = computed(() => {

  let statusClass: string = '';
  switch (props.node.status.value) {
    case NodeStatus.Dirty:
      statusClass = 'dirty';
      break;
    case NodeStatus.Cooked:
      statusClass = 'cooked';
      break;
    case NodeStatus.Error:
      statusClass = 'error';
      break;
  }

  return {
    selected: !props.selecting && props.node.isSelected,
    'selection-candidate': props.selectionCandidate,
    [statusClass]: true,
    dragging: isDragging.value
  }
})

const animatedPosition = reactive({
  x: props.node.position.value.x,
  y: props.node.position.value.y
})

watchEffect(() => {
  if (animateNodePositionFlag) {
    gsap.to(animatedPosition, {
      duration: nodeAnimationTime,
      x: props.node.position.value.x,
      y: props.node.position.value.y,
      ease: 'power4.out',
    })
  } else {
    animatedPosition.x = props.node.position.value.x
    animatedPosition.y = props.node.position.value.y
  }
})

const styles = computed(() => {
  const position = animatedPosition

  return {
    top: `${position.y}px`,
    left: `${position.x}px`,
  }
})


function updateNodeName(evt: Event) {
  const newName = (evt.target as HTMLDivElement).textContent!
  if (newName !== props.node.name.value) {
    props.ctx.executeCommand(
        new RenameNodeCommand(props.ctx, props.node.path, newName)
    )
  }
  window.getSelection()!.removeAllRanges();
}

function setOutput() {
  if (!props.node.isOutput)
    props.ctx.executeCommand(
        new SetOutputNodeCommand(props.ctx, props.node.parent!.path, props.node.name.value)
    )
}

</script>


<style lang="scss">
.node {
  position: absolute;
  pointer-events: all;

  &.dragging, &.dragging * {
    pointer-events: none !important;

  }

  .node-contents {
    background-color: #1D1E1F;
    width: 124px;
    height: 34px;
    border: 2px solid #414243;
    box-sizing: border-box;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &:hover {
      border-color: #6f7077;
    }
  }

  &.selected .node-contents {
    border-color: #42b983;
  }

  &.selection-candidate .node-contents {
    border-color: #42b983;
  }

  .el-card {
    width: 100px;
  }

  .node-inputs {
    position: absolute;
    top: -16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }

  .node-outputs {
    position: absolute;
    bottom: -16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }

  .node-socket {
    padding: 4px;
    cursor: pointer;

    &::after {
      content: "";
      display: block;
      width: 8px;
      height: 8px;
      border: 1px solid gray;
      background-color: white;
      border-radius: 5px;
    }

    &:hover::after {
      border: 3px solid #42B983;
      border-radius: 7px;
    }

    &.multiple::after {
      width: 25px;
    }
  }

  .node-label {
    position: absolute;
    bottom: -30px;
    left: 75%;
    white-space: nowrap;
  }

  .node-icon {
    flex-grow: 1;
    pointer-events: none;
    text-align: center;
    font-size: 1.2em;
  }

  .node-toggle {
    height: 100%;
    margin: -2px;

    background-color: transparent;
    border: none;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0.2);
    }

    &.selected {
      background-color: #42b983;
    }

    &:not(:first-child) {
      border-left: 2px solid #414243;
    }

    &:not(:last-child) {
      border-right: 2px solid #414243;
    }
  }

  .node-status-indicator {
    position: absolute;
    left: 0;
    right: 0;
    width: 50px;
    bottom: 2px;
    height: 2px;
    margin: 0 auto;
    display: none;
  }

  &.dirty .node-status-indicator {
    background-color: #6f7077;
  }

  &.cooking .node-status-indicator {
    background-color: #54a2fc;
  }

  &.cooked .node-status-indicator {
    background-color: #42b983;
  }

  &.error {


    .node-contents {
      border-color: #ee594d;
    }
  }
}
</style>