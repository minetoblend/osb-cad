import {NodeSystem} from "@/editor/node/system";
import {ElementNode} from "@/editor/node/element/index";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder} from "@/editor/node";

export class SceneNode extends NodeSystem<ElementNode> {
    type = 'scene'
    icon = ['fas', 'film']


    constructor(ctx: EditorContext, name: string = 'Scene') {
        super(ctx, name);
    }

    define(builder: NodeBuilder) {
        builder.outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time')
                .int('endTime', 'End Time')
            )
    }
}