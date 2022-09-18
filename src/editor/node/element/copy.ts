import {ElementNode} from "@/editor/node/element/index";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {Vec2} from "@/util/math";


export class CopyNode extends ElementNode {
    type = 'copy'
    icon = ['far', 'clone']

    constructor(ctx: EditorContext) {
        super(ctx, 'Copy');
    }

    define(schema: NodeBuilder) {
        schema
            .inputs(4)
            .output('output')
            .parameters(param => param
                .int('copies', 'Copies', {defaultValue: 1})
                .vec2('move', 'Move')
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = (ctx.input[0] as SBCollection).clone()

        const numCopies = this.param('copies')!.get();
        const moveParam = this.param('move')!
        for (let i = 0; i < numCopies; i++) {
            const copy = (ctx.input[0] as SBCollection).clone()

            copy.forEach((index, el) => {
                el.moveWithCommands(
                    (moveParam.getWithElement({
                        idx: index,
                        el,
                        geo: ctx.input
                    }) as Vec2).mulF(i + 1)
                )
            })

            geo.append(copy)
        }

        return CookResult.success(
            geo
        );
    }
}