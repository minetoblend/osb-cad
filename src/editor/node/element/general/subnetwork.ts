import {NodeSystem} from "@/editor/node/system";
import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('Subnetwork', ['fas', 'gears'], 'objects')
export class SubnetworkNode extends NodeSystem<ElementNode> {
    icon = ['fas', 'gears']

    nodeType = 'element'

    define(builder: NodeBuilder) {
        builder.outputs(1)
    }

}