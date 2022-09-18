import {ElementNode} from "@/editor/node/element/index";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {CodeNodeParameter} from "@/editor/node/parameter";
import {SBCollection} from "@/editor/objects/collection";
import {globalFunctions} from "@/editor/compile";


export class SpriteWrangleNode extends ElementNode {

    icon = ['fas', 'code']

    type = 'spriteWrangle'

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

        if (codeParam.compiledCode) {
            const runner = codeParam.compiledCode.expression;
            const evalCtx = {
                ...globalFunctions,
                TIME: this.ctx.time.value,
                getAttrib(idx: number, name: string) {
                    return ctx.input[0].getSprite(idx)[name]
                },
                setAttrib(idx: number, name: string, value: any) {
                    ctx.input[0].getSprite(idx)[name] = value
                },
            };
            (ctx.input[0] as SBCollection).forEach((index) => {
                runner(evalCtx, index)
            })
        }

        return CookResult.success(
            ctx.input[0]
        );
    }
}