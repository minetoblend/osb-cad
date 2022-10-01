import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {NodeBuilder, TimingInformation} from "@/editor/node";
import {CookResult} from "@/editor/node/cook.context";
import {Vec2} from "@/util/math";
import {AttributeType} from "@/editor/objects/attribute";
import {CookJobContext} from "@/editor/cook/context";

@RegisterNode('Emitter', ['fas', 'spray-can-sparkles'], 'simulation', 'simulation')
export class EmitterNode extends SimulationNode {
    icon: string[] = ['fas', 'spray-can-sparkles'];

    define(builder: NodeBuilder) {
        builder
            .inputs(2)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time')
                .int('endTime', 'End Time')
                .vec2('velocity', 'Start Velocity', {withIndex: true})
                .int('lifetime', 'Lifetime', {withIndex: true, defaultValue: 1000})
            )
    }


    async cook(ctx: CookJobContext): Promise<CookResult> {
        const startTime = this.param('startTime')!.get()
        const endTime = this.param('endTime')!.get()


        const timeAttributeName = 'time'

        const velocityXParam = this.param('velocity.x')!
        const velocityYParam = this.param('velocity.y')!
        const lifetimeParam = this.param('lifetime')!

        const delta = ctx.delta
        const currentTime = ctx.time

        if (currentTime >= startTime && currentTime <= endTime) {
            const [simGeo, emitGeo] = await Promise.all([
                ctx.fetchInput(0),
                ctx.fetchInput(1)
            ])

            if (!emitGeo.hasAttribute('vel'))
                emitGeo.addAttribute('vel', AttributeType.Vec2)
            if (!emitGeo.hasAttribute('age'))
                emitGeo.addAttribute('age', AttributeType.Float)
            if (!emitGeo.hasAttribute('lifetime'))
                emitGeo.addAttribute('lifetime', AttributeType.Float)

            const timeAttribute = emitGeo.getAttributeContainer<number>(timeAttributeName)

            if (timeAttribute) {
                emitGeo.filter((index) => {
                    const time = timeAttribute.getValue(index)

                    return time > currentTime && time <= (currentTime + delta);
                })
            }

            emitGeo.forEach((index, el) => {
                emitGeo.setAttribute('vel', index,
                    new Vec2(
                        velocityXParam.getWithElement({
                            idx: index, el, geo: [emitGeo], ...ctx
                        }),
                        velocityYParam.getWithElement({
                            idx: index, el, geo: [emitGeo], ...ctx
                        })
                    ))
                emitGeo.setAttribute('age', index, 0)
                emitGeo.setAttribute('lifetime', index, lifetimeParam.getWithElement({
                    idx: index, el, geo: [emitGeo], ...ctx
                }))
                el.offsetAnimation(currentTime)
            })

            simGeo.append(emitGeo)
            return CookResult.success(simGeo)

        } else {
            const simGeo = await ctx.fetchInput(0)
            return CookResult.success(simGeo)
        }

    }

    get timingInformation(): TimingInformation | undefined {
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