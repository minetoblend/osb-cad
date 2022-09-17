import {Node} from "@/editor/node/index";
import {NodeParameter} from "@/editor/node/parameter";
import ParamCodeEditor from '@/components/node/parameters/ParamCodeEditor.vue'

export abstract class NodeInterfaceItem {
    constructor(public id: string, public label?: string) {
    }

    abstract component: any
}

export class FloatInterfaceItem extends NodeInterfaceItem {
    constructor(
        id: string,
        label: string) {
        super(id, label)
    }

    get component() {
        return null
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

    float(id: string, label: string, defaultValue: number = 0) {
        this.node.addParameter(NodeParameter.float(id, defaultValue))
        this.node.interface.push(new FloatInterfaceItem(id, label))
    }

    code(id: string) {
        this.node.addParameter(NodeParameter.code(id))
        this.node.interface.push(new CodeEditorInterfaceItem(id))
    }
}

