import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {CodeNodeParameter} from "@/editor/node/parameter";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('SpriteWrangle', ['fas', 'code'], 'general')
export class SpriteWrangleNode extends ElementNode {

    icon = ['fas', 'code']

    constructor(ctx: EditorContext) {
        super(ctx, 'SpriteWrangle');
    }

    define(schema: NodeBuilder) {
        schema
            .inputs(4)
            .output('output')
            .parameters(param => {
                param.code('code')
            })
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const codeParam = this.param('code') as CodeNodeParameter

        const geo = ctx.getInputs()

        if (codeParam.compiledCode) {
            codeParam.compiledCode.run({
                TIME: ctx.TIME,
                CENTRE: ctx.CENTRE,
                DELTA: ctx.DELTA,
            }, geo)
        }

        return CookResult.success(geo[0]);
    }
}