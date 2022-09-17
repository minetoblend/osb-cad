<template>
  <div @mouseenter="onEnter" @mouseleave="onLeave">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import {defineEmits, onBeforeUnmount} from "vue";

let active = false

const emit = defineEmits(['shortcut'])

function onEnter() {
  active = true
}

function onLeave() {
  active = false
}

function onKeyDown(evt: KeyboardEvent) {
  if (active) {
    if (evt.key.length === 1 || ['Delete'].includes(evt.key)) {

      let shortcut = []
      if (evt.ctrlKey)
        shortcut.push('ctrl');
      if (evt.shiftKey)
        shortcut.push('shift');
      if (evt.altKey)
        shortcut.push('alt');
      shortcut.push(evt.key.toLowerCase())

      emit('shortcut', shortcut.join(' '))
    }
  }
}


document.addEventListener('keydown', onKeyDown)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown);
})


</script>