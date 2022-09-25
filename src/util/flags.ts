import {nextTick} from "vue";

export let animateNodePositionFlag = false

let stackHeight = 0

export function animateNodePosition<T = void>(moveNodes: () => T): T {
    stackHeight++
    animateNodePositionFlag = true
    try {
        const value = moveNodes()
        nextTick(() => {
            stackHeight--
            animateNodePositionFlag = stackHeight > 0
        })
        return value
    } catch (e) {
        stackHeight--
        nextTick(() => animateNodePositionFlag = stackHeight > 0)
        throw e
    }
}