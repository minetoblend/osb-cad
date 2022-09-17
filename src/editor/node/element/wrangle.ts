import {ElementNode} from "@/editor/node/element/index";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";


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


}