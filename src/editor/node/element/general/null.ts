import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('Null', ['far', 'square'], 'general')
export class NullNode extends ElementNode {
    icon = ['far', 'square']

    constructor(ctx: EditorContext) {
        super(ctx, 'Null');
    }

    define(schema: NodeBuilder) {
        schema
            .inputs(1)
            .outputs(1)
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        return CookResult.success(
            ctx.getInput()
        );
    }
}