import {Node} from "@/editor/node/index";
import {
    ColorParamOptions,
    FloatNodeParameter,
    FloatParamOptions,
    IntParamOptions,
    NodeParameter,
    OriginNodeParameter,
    OriginParamOptions, Vec2ParamOptions
} from "@/editor/node/parameter";
import ParamCodeEditor from '@/components/node/parameters/ParamCodeEditor.vue'
import NodeParamVec2 from '@/components/node/parameters/NodeParamVec2.vue'
import NodeParamInt from '@/components/node/parameters/NodeParamInt.vue'
import NodeParamFloat from '@/components/node/parameters/NodeParamFloat.vue'
import NodeParamOrigin from '@/components/node/parameters/NodeParamOrigin.vue'
import NodeParamColor from '@/components/node/parameters/NodeParamColor.vue'
import NodeParamSprite from '@/components/node/parameters/NodeParamSprite.vue'

import {Color, Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";

export abstract class NodeInterfaceItem {
    constructor(public id: string, public label?: string) {
    }

    abstract component: any
}

export class IntInterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return NodeParamInt
    }
}

export class SpriteInterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return NodeParamSprite
    }
}

export class OriginInterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return NodeParamOrigin
    }
}

export class FloatInterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return NodeParamFloat
    }
}

export class Vec2InterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return NodeParamVec2
    }
}

export class ColorInterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return NodeParamColor
    }
}

export class CodeEditorInterfaceItem extends NodeInterfaceItem {
    constructor(id: string) {
        super(id)
    }

    get component() {
        return ParamCodeEditor
    }
}


export class NodeInterfaceBuilder {
    constructor(private readonly node: Node) {
    }

    int(id: string, label: string, opts?: Partial<IntParamOptions>) {
        opts = {
            withIndex: false,
            defaultValue: 0,
            ...opts ?? {},
        }
        this.node.addParameter(NodeParameter.int(this.node, id, opts as IntParamOptions))
        this.node.interface.push(new IntInterfaceItem(id, label))
        return this
    }

    sprite(id: string, label: string, opts?: Partial<IntParamOptions>) {
        opts = {
            withIndex: false,
            defaultValue: 0,
            ...opts ?? {},
        }
        this.node.addParameter(NodeParameter.int(this.node, id, opts as IntParamOptions))
        this.node.interface.push(new SpriteInterfaceItem(id, label))
        return this
    }


    origin(id: string, label: string, opts?: Partial<OriginParamOptions>) {
        opts = {
            defaultValue: Origin.TopLeft,
            ...opts ?? {},
        }
        this.node.addParameter(new OriginNodeParameter(this.node, id, opts as IntParamOptions))
        this.node.interface.push(new OriginInterfaceItem(id, label))
        return this
    }

    float(id: string, label: string, opts?: Partial<FloatParamOptions>) {
        opts = {
            withIndex: false,
            defaultValue: 0,
            ...opts ?? {},
        }
        this.node.addParameter(new FloatNodeParameter(this.node, id, opts! as FloatParamOptions))
        this.node.interface.push(new FloatInterfaceItem(id, label))
        return this
    }

    code(id: string) {
        this.node.addParameter(NodeParameter.code(this.node, id))
        this.node.interface.push(new CodeEditorInterfaceItem(id))
        return this
    }

    vec2(id: string, label: string, opts?: Partial<Vec2ParamOptions>) {
        opts = {
            withIndex: false,
            defaultValue: Vec2.zero(),
            ...opts ?? {},
        }
        this.node.addParameter(new FloatNodeParameter(this.node, id + '.x', {
            defaultValue: opts.defaultValue!.x,
            withIndex: opts.withIndex!
        }))
        this.node.addParameter(new FloatNodeParameter(this.node, id + '.y', {
            defaultValue: opts.defaultValue!.x,
            withIndex: opts.withIndex!
        }))

        this.node.interface.push(new Vec2InterfaceItem(id, label))
        return this
    }

    color(id: string, label: string, opts?: Partial<ColorParamOptions>) {
        opts = {
            withIndex: false,
            defaultValue: Color.white,
            ...opts ?? {},
        }
        this.node.addParameter(new FloatNodeParameter(this.node, id + '.x', {
            defaultValue: opts.defaultValue!.r,
            withIndex: opts.withIndex!
        }))
        this.node.addParameter(new FloatNodeParameter(this.node, id + '.y', {
            defaultValue: opts.defaultValue!.g,
            withIndex: opts.withIndex!
        }))
        this.node.addParameter(new FloatNodeParameter(this.node, id + '.z', {
            defaultValue: opts.defaultValue!.b,
            withIndex: opts.withIndex!
        }))

        this.node.interface.push(new ColorInterfaceItem(id, label))
        return this
    }
}

