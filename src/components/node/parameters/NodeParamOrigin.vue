<template>
  <div class="component-row">
    <div class="origin-select-box">
      <div class="row">
        <button class="origin-select-button" :class="{selected: value === Origin.TopLeft}"
                @click="setParam(Origin.TopLeft)"/>
        <button class="origin-select-button" :class="{selected: value === Origin.TopCentre}"
                @click="setParam(Origin.TopCentre)"/>
        <button class="origin-select-button" :class="{selected: value === Origin.TopRight}"
                @click="setParam(Origin.TopRight)"/>
      </div>

      <div class="row">
        <button class="origin-select-button" :class="{selected: value === Origin.CentreLeft}"
                @click="setParam(Origin.CentreLeft)"/>
        <button class="origin-select-button" :class="{selected: value === Origin.Centre}"
                @click="setParam(Origin.Centre)"/>
        <button class="origin-select-button" :class="{selected: value === Origin.CentreRight}"
                @click="setParam(Origin.CentreRight)"/>
      </div>

      <div class="row">
        <button class="origin-select-button" :class="{selected: value === Origin.BottomLeft}"
                @click="setParam(Origin.BottomLeft)"/>
        <button class="origin-select-button" :class="{selected: value === Origin.BottomCentre}"
                @click="setParam(Origin.BottomCentre)"/>
        <button class="origin-select-button" :class="{selected: value === Origin.BottomRight}"
                @click="setParam(Origin.BottomRight)"/>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">

import {computed, defineProps, PropType} from "vue";
import {Node} from "@/editor/node";
import {NodeInterfaceItem} from "@/editor/node/interface";
import {OriginNodeParameter} from "@/editor/node/parameter";
import {Origin, Origin as SpriteOrigin} from "@/editor/objects/origin";
import {SetNodeParameterCommand} from "@/editor/ctx/command/parameter";
import {useContext} from "@/editor/ctx/use";

const ctx = useContext()

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
  interface: {
    type: Object as PropType<NodeInterfaceItem>,
    required: true,
  }
})

const Origin = SpriteOrigin

const param = computed(() => props.node.params.get(props.interface.id) as OriginNodeParameter)

const value = computed(() => param.value.get())

function setParam(value: Origin) {
  ctx.executeCommand(
      new SetNodeParameterCommand(ctx, props.node.path, props.interface.id, value)
  )
}

</script>

<style lang="scss">

$button-size: 10px;
$hover-size: 25px;

.origin-select-box {
  background-color: rgba(0, 0, 0, 0.2);

  border-radius: 5px;
  padding: 5px;

  .row {
    display: flex;

    &:not(:first-child) {
      //margin-top: $spacer-size;
    }

    .origin-select-button {
      width: $hover-size;
      height: $hover-size;
      padding: 0;
      border: none;
      cursor: pointer;
      position: relative;
      background: none;

      &:not(:first-child) {
        //margin-left: $spacer-size;
      }

      &::after {
        content: '';
        position: absolute;
        width: $button-size;
        height: $button-size;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: #414243;
      }

      &:hover::after {
        background-color: white;
      }


      &.selected::after {
        background-color: #42b983;
      }
    }
  }
}
</style>