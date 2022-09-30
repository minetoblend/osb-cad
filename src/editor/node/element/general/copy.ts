import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookResult} from "@/editor/node/cook.context";
import {Vec2} from "@/util/math";
import {FloatNodeParameter} from "@/editor/node/parameter";
import {RegisterNode} from "@/editor/node/registry";
import {CookJobContext} from "@/editor/cook/context";

@RegisterNode('Copy', ['fas', 'clone'], 'general')
export class CopyNode extends ElementNode {
    icon = ['far', 'clone']

    constructor(ctx: EditorContext) {
        super(ctx, 'Copy');
    }

    define(schema: NodeBuilder) {
        schema
            .inputs(1)
            .output('output')
            .parameters(param => param
                .int('copies', 'Copies', {defaultValue: 1})
                .vec2('move', 'Move', {withIndex: true})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {

        const original = await ctx.fetchInput(this.inputs[0])

        const numCopies = this.param('copies')!.get();
        const moveXParam = this.param('move.x')! as FloatNodeParameter
        const moveYParam = this.param('move.y')! as FloatNodeParameter

        let geo = original.clone();

        for (let i = 0; i < numCopies; i++) {
            const copy = original.clone()

            copy.forEach((idx, el) => {
                el.moveWithCommands(
                    new Vec2(
                        moveXParam.getWithElement({idx, el, geo: [copy]}),
                        moveYParam.getWithElement({idx, el, geo: [copy]})
                    ).mulF(i + 1)
                )
            })

            geo.append(copy)
        }

        return CookResult.success(
            geo
        );
    }

}