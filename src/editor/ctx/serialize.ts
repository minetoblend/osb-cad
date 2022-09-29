import {Vec2, Vec2Like} from "@/util/math"
import {
    BackgroundNode,
    ColorNode,
    CopyNode,
    CopyToPointsNode,
    ElementNode,
    FadeInOutNode,
    FadeNode,
    GridNode,
    HitObjectsNode,
    MergeNode,
    OffsetNode,
    RotateNode,
    ScaleNode,
    SceneNode,
    SpriteNode,
    SpriteWrangleNode,
} from '@/editor/node/element'
import {EditorContext} from "@/editor/ctx/context";
import {NodeRegistry} from "@/editor/node/registry";
import {NodeSystem} from "@/editor/node/system";
import {NodeInput, NodeOutput} from "@/editor/node/input";

export interface SerializedProject {
    mapsetPath: string
    nodes: SerializedNodeSystem
    activePath: string
    activeBeatmap: string | null
    currentTime: number
    locations: Record<string, SerializedEditorLocation>
}

export interface SerializedEditorLocation {
    position: Vec2Like,
    scale: number
}

export interface SerializedNode {
    type: string
    name: string
    position: Vec2Like
    parameters: SerializedNodeParam[]
    icon: string[]
    inputs?: { name: string, multiple: boolean }[]
    outputs?: { name: string }[]
}

export interface SerializedNodeSystem extends SerializedNode {
    nodes: (SerializedNode | SerializedNodeSystem)[]
    connections: SerializedConnection[]
    output: string | null
}

export interface SerializedConnection {
    from: {
        node: string
        index: number
    }
    to: {
        node: string
        index: number
    }
}

export interface SerializedNodeParam {
    id: string,
    type: string,
    value: {
        type: string | 'expression',
        value: any
    }
    extra: Record<string, any>
}


export class Deserializer {

    readonly nodes = [
        CopyToPointsNode,
        CopyNode,
        GridNode,
        MergeNode,
        SceneNode,
        SpriteNode,
        SpriteWrangleNode,
        ColorNode,
        FadeNode,
        OffsetNode,
        RotateNode,
        ScaleNode,
        BackgroundNode,
        FadeInOutNode,
        HitObjectsNode,
    ]


    deserializeNode(ctx: EditorContext, serialized: Partial<SerializedNode>, type: string, parent?: NodeSystem<any>): ElementNode | null {
        if (!serialized.type)
            return null

        const metadata = NodeRegistry[type as keyof typeof NodeRegistry].getNodeType(serialized.type)

        if (metadata?.nodeConstructor) {
            try {
                const node = new (metadata.nodeConstructor)(ctx, serialized.name)
                node.name.value = serialized.name ?? metadata.label
                if (serialized.position)
                    node.position.value = new Vec2(serialized.position.x, serialized.position.y)

                if (parent) {
                    node.name.value = parent.getAvailableName(node.name.value)
                    node.parent = parent
                }

                if (serialized.icon)
                    node.icon = serialized.icon

                if (serialized.inputs) {
                    node.inputs = serialized.inputs.map(({name, multiple}, index) =>
                        new NodeInput(node, name, index, multiple))
                }

                if (serialized.outputs) {
                    node.outputs = serialized.outputs.map(({name}, index) => new NodeOutput(node, name, index))

                }

                node.initFromData(serialized, this)

                serialized.parameters?.forEach(serializedParam => {
                    const param = node.param(serializedParam.id)
                    if (param) {
                        param.initFrom(serializedParam)
                    }
                })

                return node
            } catch (e) {
                console.error(e)
            }
        }
        return null
    }

}