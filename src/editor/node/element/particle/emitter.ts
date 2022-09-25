import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {NodeBuilder, TimingInformation} from "@/editor/node";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {Vec2} from "@/util/math";

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
            )
    }


    async cook(ctx: CookContext): Promise<CookResult> {

        const startTime = this.param('startTime')!.get()
        const endTime = this.param('endTime')!.get()

        const simGeo = ctx.getInput(0)

        const timeAttribute = 'time'

        const velocityXAttribute = this.param('velocity.x')!
        const velocityYAttribute = this.param('velocity.y')!

        if (ctx.TIME >= startTime && ctx.TIME <= endTime) {
            const emitGeo = ctx.getInput(1)
            const hasTime = emitGeo.hasAttribute(timeAttribute)

            if (!emitGeo.hasAttribute('vel'))
                emitGeo.addAttribute('vel', 'vec2')

            if (hasTime) {
                emitGeo.filter((index) => {
                    const time = emitGeo.getAttribute(timeAttribute, index)
                    return time > ctx.TIME && time <= (ctx.TIME + ctx.DELTA);
                })
            }

            emitGeo.forEach((index, el) => {
                if (hasTime) {

                }

                emitGeo.setAttribute('vel', index,
                    new Vec2(
                        velocityXAttribute.getWithElement({
                            idx: index, el, geo: [emitGeo], ...ctx
                        }),
                        velocityYAttribute.getWithElement({
                            idx: index, el, geo: [emitGeo], ...ctx
                        })
                    ))
                el.offsetAnimation(ctx.TIME)
            })

            simGeo.append(emitGeo)
        }

        return CookResult.success(simGeo)
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