import {Vec2} from "@/util/math";

interface DragOptions {
    el?: HTMLElement
    onDragStart?: (event: DragEvent) => void
    onDrag?: (event: DragEvent) => void
    onDragEnd?: (event: DragEvent) => void
}

class DragEvent {
    constructor(
        readonly button: number,
        readonly start: Vec2,
        readonly current: Vec2,
        readonly delta: Vec2,
    ) {
    }
}

function getPosition(evt: MouseEvent, el?: HTMLElement): Vec2 {
    if (el) {
        const rect = el.getBoundingClientRect()
        return new Vec2(evt.clientX - rect.x, evt.clientY - rect.y)
    }
    return new Vec2(evt.clientX, evt.clientY)
}

export function drag(evt: MouseEvent, opts: DragOptions): void {
    const startPosition = getPosition(evt, opts.el)
    let lastPosition = startPosition
    const button = evt.button
    let started = false

    function handleDrag(evt: MouseEvent) {
        let currentPosition = getPosition(evt, opts.el)


        if (!started && opts.onDragStart) {
            opts.onDragStart(new DragEvent(
                button,
                startPosition,
                currentPosition,
                Vec2.zero()
            ))
        }

        if (opts.onDrag) {
            const delta = currentPosition.sub(lastPosition)

            opts.onDrag(new DragEvent(
                button,
                startPosition,
                currentPosition,
                delta
            ))
        }

        lastPosition = currentPosition
        started = true
    }

    function dragEnd(evt: MouseEvent) {
        if (evt.button === button) {
            document.removeEventListener('mousemove', handleDrag)
            document.removeEventListener('mouseup', dragEnd)

            if (opts.onDragEnd && started) {
                const currentPosition = getPosition(evt, opts.el)
                const delta = currentPosition.sub(lastPosition)

                opts.onDragEnd(new DragEvent(
                    button,
                    startPosition,
                    currentPosition,
                    delta
                ))
            }
        }
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', dragEnd)
}