import {Vec2} from "@/util/math";

export interface DragOptions {
    el?: HTMLElement
    onDragStart?: (event: DragEvent) => void
    onDrag?: (event: DragEvent) => void
    onDragEnd?: (event: DragEvent) => void
    onClick?: (event: DragEvent) => void
    scale?: number
}

class DragEvent {
    constructor(
        readonly evt: MouseEvent,
        readonly button: number,
        readonly start: Vec2,
        readonly current: Vec2,
        readonly delta: Vec2,
    ) {
    }

    get total() {
        return this.current.sub(this.start)
    }
}

function getPosition(evt: MouseEvent, scale: number, el?: HTMLElement): Vec2 {
    if (el) {
        const rect = el.getBoundingClientRect()
        return new Vec2(evt.clientX - rect.x, evt.clientY - rect.y).mulF(scale)
    }
    return new Vec2(evt.clientX, evt.clientY)
}

export function drag(evt: MouseEvent, opts: DragOptions): void {
    const scale = opts.scale ?? 1
    const startPosition = getPosition(evt, scale, opts.el)
    let lastPosition = startPosition
    const button = evt.button
    let started = false


    function handleDrag(evt: MouseEvent) {
        let currentPosition = getPosition(evt, scale, opts.el)


        if (!started && opts.onDragStart) {
            opts.onDragStart(new DragEvent(
                evt,
                button,
                startPosition,
                currentPosition,
                Vec2.zero()
            ))
        }

        if (opts.onDrag) {
            const delta = currentPosition.sub(lastPosition)

            opts.onDrag(new DragEvent(
                evt,
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

            if (!started && opts.onClick) {
                opts.onClick(new DragEvent(
                    evt,
                    button,
                    startPosition,
                    startPosition,
                    Vec2.zero(),
                ))
            }

            document.removeEventListener('mousemove', handleDrag)
            document.removeEventListener('mouseup', dragEnd)

            if (opts.onDragEnd && started) {
                const currentPosition = getPosition(evt, scale, opts.el)
                const delta = currentPosition.sub(lastPosition)

                opts.onDragEnd(new DragEvent(
                    evt,
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