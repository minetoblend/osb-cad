import {Vec2Like} from "@/util/math"

export interface SerializedProject {

    nodes: SerializedNodeSystem
}

export interface SerializedNode {
    type: string
    name: string
    position: Vec2Like
}

export interface SerializedNodeSystem extends SerializedNode {
    nodes: SerializedNode[]
    connections: SerializedConnection[]
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