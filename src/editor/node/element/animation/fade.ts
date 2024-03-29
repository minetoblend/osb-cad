import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookResult} from "@/editor/node/cook.context";
import {NodeBuilder, TimingInformation} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";
import {NodeDependencyType} from "@/editor/compile";
import {DragOptions} from "@/util/event";
import {SetNodeParameterOperation} from "@/editor/ctx/operations/parameter";
import {RegisterNode} from "@/editor/node/registry";
import {CookJobContext} from "@/editor/cook/context";

@RegisterNode('Fade', ['fas', 'circle-half-stroke'], 'commands')
export class FadeNode extends ElementNode {
    icon = ['fas', 'circle-half-stroke']

    constructor(ctx: EditorContext) {
        super(ctx, 'Fade');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time', {defaultValue: 0, withIndex: true})
                .int('endTime', 'End Time', {defaultValue: 0, withIndex: true})
                .float('startAlpha', 'Start Alpha', {defaultValue: 1, withIndex: true})
                .float('endAlpha', 'End Alpha', {defaultValue: 1, withIndex: true})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput()

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!
        const startAlpha = this.param('startAlpha')!
        const endAlpha = this.param('endAlpha')!

        geo.forEach((idx, el) => {
            el.fade(
                Easing.QuadOut,
                startTime.getWithElement({idx, el, geo: [geo]}),
                endTime.getWithElement({idx, el, geo: [geo]}),
                startAlpha.getWithElement({idx, el, geo: [geo]}),
                endAlpha.getWithElement({idx, el, geo: [geo]}),
            )
        })

        return CookResult.success(geo);
    }

    get timingInformation(): TimingInformation | undefined {
        if (this.hasDependency(NodeDependencyType.ElementIndex))
            return undefined
        const start = this.param('startTime')!.get()
        const end = this.param('endTime')!.get()
        return {
            type: "animation",
            startTime: start,
            endTime: end,
            keyframes: [
                {time: start},
                {time: end},
            ]
        }
    }
}

@RegisterNode('FadeInOut', ['fas', 'circle-half-stroke'], 'commands')
export class FadeInOutNode extends ElementNode {
    icon = ['fas', 'circle-half-stroke']

    constructor(ctx: EditorContext) {
        super(ctx, 'Fade');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time', {defaultValue: 0, withIndex: true})
                .int('endTime', 'End Time', {defaultValue: 0, withIndex: true})
                .int('fadeDuration', 'Fade Duration')
                .float('alpha', 'Alpha', {defaultValue: 1, withIndex: true})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput()

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!
        const fadeDuration = this.param('fadeDuration')!
        const alpha = this.param('alpha')!

        geo.forEach((idx, el) => {

            const duration = fadeDuration.getWithElement({idx, el, geo: [geo]})
            const start = startTime.getWithElement({idx, el, geo: [geo]})
            const end = endTime.getWithElement({idx, el, geo: [geo]})
            const peakAlpha = alpha.getWithElement({idx, el, geo: [geo]})

            el.fade(
                Easing.Linear,
                start,
                start + duration,
                0,
                peakAlpha,
            )

            el.fade(
                Easing.Linear,
                end - duration,
                end,
                peakAlpha,
                0,
            )
        })

        return CookResult.success(geo);
    }

    get timingInformation(): TimingInformation | undefined {
        if (this.hasDependency(NodeDependencyType.ElementIndex)) return undefined;
        const startTime = this.param('startTime')!.get()
        const endTime = this.param('endTime')!.get()
        const duration = this.param('fadeDuration')!.get()

        return {
            type: 'animation',
            startTime,
            endTime,
            keyframes: [
                {time: startTime, drag: this.dragHandlers.startTime},
                {time: startTime + duration, drag: this.dragHandlers.startDuration},
                {time: endTime - duration, drag: this.dragHandlers.endDuration},
                {time: endTime, drag: this.dragHandlers.endTime},
            ],
            drag: this.getDragHandler()
        }
    }

    getDragHandler(): DragOptions {
        let operation: SetNodeParameterOperation<number>;
        return {
            onDragStart: () => {
                operation = new SetNodeParameterOperation(this.ctx, this, this.param('startTime')!, this.param('endTime')!)
            },
            onDrag: ({delta}) => {
                operation.setValue(...operation.params.map(it => it.getRaw() + delta.x))
            },
            onDragEnd: () => operation.commit(),
        }
    }

    getKeyframeDragHandler(type: 'startTime' | 'startDuration' | 'endDuration' | 'endTime'): DragOptions {
        let operation: SetNodeParameterOperation<number>;
        const param = this.param(type === "startTime" ? 'startTime' : type === 'endTime' ? 'endTime' : 'fadeDuration')!
        return {
            onDragStart: () => {
                operation = new SetNodeParameterOperation(this.ctx, this, param)
            },
            onDrag: ({delta}) => {
                if (type === 'endDuration')
                    operation.setValue(operation.getValue()[0] - delta.x)
                else
                    operation.setValue(operation.getValue()[0] + delta.x)

            },
            onDragEnd: () => operation.commit()
        }
    }

    dragHandlers = {
        startTime: this.getKeyframeDragHandler("startTime"),
        startDuration: this.getKeyframeDragHandler("startDuration"),
        endDuration: this.getKeyframeDragHandler("endDuration"),
        endTime: this.getKeyframeDragHandler("endTime"),
    }


}