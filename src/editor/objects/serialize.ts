import {SBCollection} from "@/editor/objects/collection";
import {SBElement, SBElementType} from "@/editor/objects/index";
import {Origin} from "@/editor/objects/origin";
import {
    ColorCommand,
    FadeCommand,
    MoveCommand,
    RotateCommand,
    ScaleCommand,
    ScaleVecCommand,
    SpriteCommand
} from "@/editor/objects/command";
import {clamp} from "@/util/math";
import {EditorContext} from "@/editor/ctx/context";


const layers = [
    'Background',
    'Fail',
    'Pass',
    'Foreground',
    'Overlay',
]

interface SerializeOptions {
    precision: number
}

export function* serializeSBCollection(collection: SBCollection, ctx: EditorContext, opts?: Partial<SerializeOptions>): Generator<string> {
    yield '[Events]'

    const options: SerializeOptions = {
        ...(opts ?? {}),
        precision: 3
    }

    for (let [layerIndex, layerName] of layers.entries()) {
        yield `//Storyboard Layer ${layerIndex} (${layerName})`;
        const elements = collection.elements.filter(it => it.layer === layerIndex)

        for (const element of elements) {
            yield* serializeSBElement(element, options, ctx);
        }
    }
}

function* serializeSBElement(element: SBElement, opts: SerializeOptions, ctx: EditorContext) {
    switch (element.type) {
        case SBElementType.Sprite:
            const layer = layers[element.layer]
            const origin = Origin[element._origin]
            const filepath = ctx.fileStore.textures[element._sprite].name
            const x = Math.round(element._pos.x)
            const y = Math.round(element._pos.y)

            yield `Sprite,${layer},${origin},${filepath},${x},${y}`;
            break;
        case SBElementType.Animation:
            break;
        case SBElementType.Point:
            return;
    }

    const commands = element.getAllCommands()
    commands.sort((a, b) => a.startTime - b.startTime)
    for (const command of commands) {
        yield ' ' + serializeCommand(command, opts)
    }
}

function serializeCommand(command: SpriteCommand<any>, opts: SerializeOptions): string {
    let startTime = Math.round(command.startTime).toString()
    let endTime = Math.round(command.endTime).toString()

    if (startTime === endTime)
        endTime = ''

    if (command instanceof MoveCommand) {
        const easing = command.easing
        const startX = Math.round(command.startPos.x)
        const startY = Math.round(command.startPos.y)
        const endX = Math.round(command.endPos.x)
        const endY = Math.round(command.endPos.y)
        if (startX === endX && startY === endY)
            return `M,${easing},${startTime},${endTime},${startX},${startY}`
        return `M,${easing},${startTime},${endTime},${startX},${startY},${endX},${endY}`
    }

    if (command instanceof ScaleCommand) {
        const easing = command.easing
        const startScale = command.startScale.value.toPrecision(opts.precision)
        const endScale = command.endScale.value.toPrecision(opts.precision)
        if (startScale === endScale)
            return `S,${easing},${startTime},${endTime},${startScale}`
        return `S,${easing},${startTime},${endTime},${startScale},${endScale}`
    }

    if (command instanceof ScaleVecCommand) {
        const easing = command.easing
        const startX = command.startScale.x.toPrecision(opts.precision)
        const startY = command.startScale.y.toPrecision(opts.precision)
        const endX = command.endScale.x.toPrecision(opts.precision)
        const endY = command.endScale.y.toPrecision(opts.precision)

        if (startX === endX && startY === endY)
            return `V,${easing},${startTime},${endTime},${startX},${startY}`
        return `V,${easing},${startTime},${endTime},${startX},${startY},${endX},${endY}`
    }

    if (command instanceof RotateCommand) {
        const easing = command.easing
        const startAngle = command.startAngle.value.toPrecision(opts.precision)
        const endAngle = command.endAngle.value.toPrecision(opts.precision)
        return `R,${easing},${startTime},${endTime},${startAngle},${endAngle}`
    }

    if (command instanceof FadeCommand) {
        const easing = command.easing
        const startAlpha = command.startAlpha.value.toPrecision(opts.precision)
        const endAlpha = command.endAlpha.value.toPrecision(opts.precision)
        if (startAlpha === endAlpha)
            return `F,${easing},${startTime},${endTime},${startAlpha}`
        return `F,${easing},${startTime},${endTime},${startAlpha},${endAlpha}`
    }

    if (command instanceof ColorCommand) {
        const easing = command.easing
        const startR = Math.floor(clamp(command.startColor.r, 0, 1) * 255)
        const startG = Math.floor(clamp(command.startColor.g, 0, 1) * 255)
        const startB = Math.floor(clamp(command.startColor.b, 0, 1) * 255)

        const endR = Math.floor(clamp(command.endColor.r, 0, 1) * 255)
        const endG = Math.floor(clamp(command.endColor.g, 0, 1) * 255)
        const endB = Math.floor(clamp(command.endColor.b, 0, 1) * 255)

        return `C,${easing},${startTime},${endTime},${startR},${startG},${startB},${endR},${endG},${endB}`
    }

    return ''
}