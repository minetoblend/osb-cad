import {GetWithElementContext, NodeParameter} from "@/editor/node/parameter";
import {Color, Vec2} from "@/util/math";
import {Ref, ref, shallowRef} from "vue";
import {NodePath} from "@/editor/node/path";
import {IHasPosition} from "@/types/position";
import type {NodeSystem} from "@/editor/node/system";
import {NodeInterfaceBuilder, NodeInterfaceItem} from "@/editor/node/interface";
import {EditorContext} from "@/editor/ctx/context";
import {CircularDependencyError, NodeError} from "@/editor/node/error";
import {NodeConnection} from "@/editor/node/connection";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {ExpressionDependency} from "@/editor/compile";
import {SerializedNode} from "@/editor/ctx/serialize";


export abstract class Node implements IHasPosition {
    constructor(readonly ctx: EditorContext, name: string) {
        this.name = ref(name)

        if (this.define) {
            const builder = new NodeBuilder(this, this.inputs, this.outputs)
            this.define(builder)
        }
    }

    abstract icon: string[]

    abstract cook(ctx: CookContext): Promise<CookResult>

    abstract type: string

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

    private readonly dependencies = new Set<ExpressionDependency>()

    private resultCache: any[] = []

    getOutput(index: number): any {
        return this.resultCache[index]
    }

    updateDependencies() {
        this.dependencies.clear()
        this.params.forEach(it => {
            it.getDependencies().forEach(dependency => this.dependencies.add(dependency))
        })
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

    findDirtyDependenciesDeep(visited = new Set<Node>()) {
        if (visited.has(this)) {
            const path = [...visited]
            const index = path.indexOf(this)
            throw new CircularDependencyError(this, path.slice(index))
        }
        visited.add(this)

        const dependencies: Node[] = []

        if (this.parent) {
            const connections = this.parent!.getConnectionsLeadingTo(this)

            for (let connection of connections) {
                if (connection.from.node.isDirty) {
                    dependencies.push(...connection.from.node.findDirtyDependenciesDeep(new Set(visited)))
                    dependencies.push(connection.from.node)
                }
            }
        }

        return dependencies
    }

    markDirty(visited: Set<Node> = new Set<Node>()) {
        if (visited.has(this))
            return;

        this.updateDependencies()

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

    findDependencies() {
        return this.parent?.getConnectionsLeadingTo(this).map(it => it.from.node) ?? []
    }

    setResultCache(resultCache: any[]) {
        this.resultCache = resultCache
    }

    hasDependency(dependency: ExpressionDependency) {
        return this.dependencies.has(dependency)
    }

    chv2(name: string, ctx?: GetWithElementContext): Vec2 {
        if (ctx) {

        }
        return new Vec2(
            this.param(`${name}.x`)!.get(),
            this.param(`${name}.y`)!.get(),
        )
    }

    chc(name: string, ctx?: GetWithElementContext): Color {
        return new Color(
            ctx ? this.param(`${name}.x`)!.getWithElement(ctx) : this.param(`${name}.x`)!.get(),
            ctx ? this.param(`${name}.y`)!.getWithElement(ctx) : this.param(`${name}.y`)!.get(),
            ctx ? this.param(`${name}.z`)!.getWithElement(ctx) : this.param(`${name}.z`)!.get(),
        )
    }

    handleDoubleClick() {
    }

    serialize(): SerializedNode {
        return {
            type: this.type,
            name: this.name.value,
            position: this.position.value
        }
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

    getValue(): any {
        if (this.multiple)
            return this.connections.map(it => it.from.node.getOutput(this.connections[0].from.index))
        if (this.connections.length)
            return this.connections[0].from.node.getOutput(this.connections[0].from.index)

        return undefined
    }
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

    output(name: string = `Input${this.nodeOutputs.length + 1}`): NodeBuilder {
        this.nodeOutputs.push(new NodeOutput(this.node, name, this.nodeOutputs.length))
        return this
    }

    outputs(inputs: number | string[]): NodeBuilder {
        if (Array.isArray(inputs))
            inputs.forEach(input => this.output(input))
        else {
            for (let i = 0; i < inputs; i++) {
                this.output(`Input${i + this.nodeOutputs.length + 1}`)
            }
        }
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

