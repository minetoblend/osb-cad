import {NodeSystem} from "@/editor/node/system";
import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder, TimingInformation} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('Scene', ['fas', 'film'], 'objects')
export class SceneNode extends NodeSystem<ElementNode> {
    icon = ['fas', 'film']

    nodeType = 'element'

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

    get timingInformation(): TimingInformation | undefined {
        return {
            startTime: this.param('startTime')!.get(),
            endTime: this.param('endTime')!.get(),
            keyframes: [],
            type: 'clip'
        }
    }
}