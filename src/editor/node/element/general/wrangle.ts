import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookError, CookResult} from "@/editor/node/cook.context";
import {CodeNodeParameter} from "@/editor/node/parameter";
import {RegisterNode} from "@/editor/node/registry";
import {SBCollection} from "@/editor/objects/collection";
import {CookJobContext} from "@/editor/cook/context";

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

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const codeParam = this.param('code') as CodeNodeParameter

        const {compiledCode} = codeParam


        if (!compiledCode) {
            try {
                codeParam.compile()
            } catch (e) {
                console.error(e)
                return CookResult.failure([
                    new CookError(this, (e as any).message ?? 'Could not run wrangle')
                ])
            }
        }

        if (compiledCode) {
            if (compiledCode.errors.length > 0) {
                console.log(compiledCode.errors)
                return CookResult.failure(compiledCode.errors.map(error =>
                    new CookError(this, error.message)
                ))
            }

            try {

                const prefetched = [await ctx.fetchInput()]

                const result = await compiledCode.run(ctx, prefetched)

                if (result instanceof SBCollection)
                    return CookResult.success(result)

            } catch (e) {
                console.error(e)
                return CookResult.failure([
                    new CookError(this, (e as any).message ?? 'Could not run wrangle')
                ])
            }
        }

        return CookResult.success(new SBCollection());
    }

}