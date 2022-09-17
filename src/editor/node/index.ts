import {NodeParameter} from "@/editor/node/parameter";
import {Vec2} from "@/util/math";
import {Ref, ref, shallowRef} from "vue";
import {NodePath} from "@/editor/node/path";
import {IHasPosition} from "@/types/position";
import {NodeSystem} from "@/editor/node/system";
import {NodeInterfaceBuilder, NodeInterfaceItem} from "@/editor/node/interface";
import {EditorContext} from "@/editor/ctx/context";
import {CircularDependencyError, NodeError} from "@/editor/node/error";
import {NodeConnection} from "@/editor/node/connection";


export enum NodeDependency {

}

export abstract class Node implements IHasPosition {
    constructor(readonly ctx: EditorContext, name: string) {
        this.name = ref(name)

        if (this.define) {
            const builder = new NodeBuilder(this, this.inputs, this.outputs)
            this.define(builder)
        }
    }

    abstract icon: string[]

    define?(builder: NodeBuilder): void

    readonly name: Ref<string>
    readonly position = ref(Vec2.zero())
    readonly size = ref(new Vec2(120, 30))
    readonly status = ref(NodeStatus.Dirty)
    errors = shallowRef<NodeError[]>([])

    parent?: NodeSystem<any>

    inputs: NodeInput[] = []
    outputs: NodeOutput[] = []
    protected _params = new Map<string, NodeParameter>()

    readonly interface: NodeInterfaceItem[] = []

    private readonly dependencies = new Set<NodeDependency>()

    updateDependencies() {

    }

    get params(): ReadonlyMap<string, NodeParameter> {
        return this._params
    }

    param(name: string): NodeParameter | undefined {
        return this._params.get(name)
    }

    find(path: NodePath): Node | null {
        if (path.length === 0)
            return this
        return null
    }

    get path(): NodePath {
        if (this.parent)
            return this.parent.path.child(this.name.value)
        return new NodePath([])
    }

    get isSelected() {
        return this.parent?.isNodeSelected(this)
    }

    get isOutput() {
        return this.parent?.outputNode.value === this.name.value
    }

    isInRect(min: Vec2, max: Vec2) {
        return (
            this.position.value.x > min.x &&
            this.position.value.y > min.y &&
            this.position.value.x + this.size.value.x < max.x &&
            this.position.value.y + this.size.value.y < max.y
        )
    }

    findDirtyDependencies() {
        const dependencies: Node[] = []
        for (let input of this.inputs) {
            const connections = this.parent!.getConnectionsLeadingTo(input)
            for (let connection of connections) {
                if (connection.from.node.isDirty) {
                    dependencies.push(connection.from.node)
                }
            }
        }
        return dependencies
    }

    findDirtyDependenciesDeep(path: Node[] = [], visited = new Set<Node>()) {
        if (visited.has(this)) {
            const index = path.indexOf(this)
            throw new CircularDependencyError(this, path.slice(index))
        }
        visited.add(this)

        const dependencies: Node[] = []

        if (this.parent) {
            const connections = this.parent!.getConnectionsLeadingTo(this)

            for (let connection of connections) {
                if (connection.from.node.isDirty) {
                    dependencies.push(...connection.from.node.findDirtyDependenciesDeep([...path, this], visited))
                    dependencies.push(connection.from.node)
                }
            }
        }

        return dependencies
    }

    markDirty(visited: Set<Node> = new Set<Node>()) {
        if (visited.has(this))
            return;
        visited.add(this)

        this.status.value = NodeStatus.Dirty

        const dependants = this.findDependants()

        dependants.forEach(it => it.markDirty(visited))

        if (this.isOutput)
            this.parent?.markDirty(visited)
    }

    private findDependants(deep: boolean = false) {
        const dependants: Node[] = []
        for (let output of this.outputs) {
            const connections = this.parent!.getConnectionsComingFrom(output)
            for (let connection of connections) {
                if (deep)
                    dependants.push(...connection.to.node.findDependants())
                dependants.push(connection.to.node)

            }
        }
        return dependants
    }

    addParameter(parameter: NodeParameter) {
        this._params.set(parameter.id, parameter)
    }

    get isDirty() {
        return this.status.value !== NodeStatus.Cooked
    }

    destroy() {

    }
}

export class NodeInput<N extends Node = Node> {
    constructor(
        public readonly node: N,
        public name: string,
        public index: number,
        public multiple: boolean,
    ) {
    }

    connections: NodeConnection<N>[] = []
}

export class NodeOutput<N extends Node = Node> {
    constructor(
        public readonly node: N,
        public name: string,
        public index: number,
    ) {
    }

    connections: NodeConnection<N>[] = []
}

export class NodeBuilder {
    constructor(
        public node: Node,
        public nodeInputs: NodeInput[],
        public nodeOutputs: NodeOutput[],
    ) {
    }

    input(name: string = `Input${this.nodeInputs.length + 1}`, multiple: boolean = false): NodeBuilder {
        this.nodeInputs.push(new NodeInput(this.node, name, this.nodeInputs.length, multiple))
        return this
    }

    inputs(inputs: number | string[], multiple: boolean = false): NodeBuilder {
        if (Array.isArray(inputs))
            inputs.forEach(input => this.input(input), multiple)
        else {
            for (let i = 0; i < inputs; i++) {
                this.input(`Input${i + this.nodeInputs.length + 1}`, multiple)
            }
        }
        return this
    }

    output(name: string = `Input${this.nodeInputs.length + 1}`): NodeBuilder {
        this.nodeOutputs.push(new NodeOutput(this.node, name, this.nodeOutputs.length))
        return this
    }

    parameters(buildparams: (param: NodeInterfaceBuilder) => void) {
        buildparams(new NodeInterfaceBuilder(this.node));
        return this
    }
}

export enum NodeStatus {
    Dirty,
    Cooking,
    Cooked,
    Error,
}

