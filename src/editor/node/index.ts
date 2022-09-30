import {GetWithElementContext, NodeParameter} from "@/editor/node/parameter";
import {Color, Vec2} from "@/util/math";
import {Ref, ref, shallowRef} from "vue";
import {EditorPath} from "@/editor/node/path";
import {IHasPosition} from "@/types/position";
import type {NodeSystem} from "@/editor/node/system";
import {NodeInterfaceBuilder, NodeInterfaceItem} from "@/editor/node/interface";
import {EditorContext} from "@/editor/ctx/context";
import {CircularDependencyError, NodeError} from "@/editor/node/error";
import {CookResult} from "@/editor/node/cook.context";
import {NodeDependencyType} from "@/editor/compile";
import type {SerializedNode} from "@/editor/ctx/serialize";
import {Deserializer} from "@/editor/ctx/serialize";
import {NodeInput, NodeOutput} from "@/editor/node/input";
import {DragOptions} from "@/util/event";
import {NodeDependency} from "@/editor/node/dependency";
import {MarkDirtyReason} from "@/editor/node/markDirty";
import {EditorObject} from "@/editor/ctx/editorObject";
import {CookJobContext} from "@/editor/cook/context";
import {NodeCache} from "@/editor/cook/cache";

export abstract class Node implements IHasPosition, EditorObject {
    abstract icon: string[]
    readonly name: Ref<string>
    readonly position = ref(Vec2.zero())
    readonly size = ref(new Vec2(120, 30))
    readonly status = ref(NodeStatus.Dirty)
    readonly isCooking = ref(false)

    errors = shallowRef<NodeError[]>([])
    parent?: NodeSystem<any>
    inputs: NodeInput[] = []
    outputs: NodeOutput[] = []
    interface: NodeInterfaceItem[] = []
    dependencies = new Set<NodeDependencyType>()

    cache = new NodeCache()

    constructor(readonly ctx: EditorContext, name: string) {
        this.name = ref(name)

        if (this.define) {
            const builder = new NodeBuilder(this, this.inputs, this.outputs)
            this.define(builder)
        }

        this.updateDependencies()
    }

    protected _params = new Map<string, NodeParameter>()

    get params(): ReadonlyMap<string, NodeParameter> {
        return this._params
    }

    get path(): EditorPath {
        if (this.parent)
            return this.parent.path.child(this.name.value)
        return new EditorPath([])
    }

    get isSelected() {
        return this.parent?.isNodeSelected(this)
    }

    get isOutput() {
        return this.parent?.outputNode.value === this.name.value
    }

    get isDirty() {
        return this.status.value !== NodeStatus.Cooked
    }

    get timingInformation(): TimingInformation | undefined {
        return undefined
    }

    cookDuration: number = 0
    ownCookDuration: number = 0

    // region cook

    abstract cook(ctx: CookJobContext): CookResult | Promise<CookResult>

    passThrough?(path: EditorPath): EditorPath | undefined

    //endregion

    define?(builder: NodeBuilder): void

    updateDependencies() {
        this.dependencies.clear()
        this.params.forEach(it => {
            it.getDependencies().forEach(dependency => this.dependencies.add(dependency))
        })
    }

    param(name: string): NodeParameter | undefined {
        return this._params.get(name)
    }

    find(path: EditorPath): Node | null {
        if (path.length === 0)
            return this
        return null
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

    findDependenciesForCooking(visited = new Set<Node>()) {
        if (visited.has(this)) {
            const path = [...visited]
            const index = path.indexOf(this)
            throw new CircularDependencyError(this, path.slice(index))
        }
        visited.add(this)

        const dependencies: NodeDependency[] = []

        if (this.parent) {
            this.inputs.forEach((input, inputIndex) => {
                const connections = input.connections

                connections.forEach((connection) => {
                    dependencies
                        .push(new NodeDependency(connection.from.node, inputIndex, connection.from.index, false, input.name))
                })

                if (connections.length === 0) {
                    dependencies.push(NodeDependency.empty(inputIndex, input.name))
                }
            })
        }

        return dependencies
    }

    markDirty(reason?: MarkDirtyReason, visited: Set<Node> = new Set<Node>()) {
        if (visited.has(this))
            return;

        this.updateDependencies()

        visited.add(this)

        this.status.value = NodeStatus.Dirty

        const dependants = this.findDependants()

        dependants.forEach(it => it.markDirty(reason, visited))

        if (this.isOutput)
            this.parent?.markDirty(reason, visited)
    }

    addParameter(parameter: NodeParameter) {
        this._params.set(parameter.id, parameter)
    }

    destroy() {
    }

    findDependencies() {
        return this.parent?.getConnectionsLeadingTo(this).map(it => it.from.node) ?? []
    }

    hasDependency(dependency: NodeDependencyType, downstream: boolean = false) {
        if (downstream) {
            this.findDependenciesForCooking()
        }

        return this.dependencies.has(dependency)
    }

    chv2(name: string, ctx?: GetWithElementContext): Vec2 {
        if (ctx) {
            return new Vec2(
                this.param(`${name}.x`)!.getWithElement(ctx),
                this.param(`${name}.y`)!.getWithElement(ctx)
            )

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
        const params = [...this.params.keys()].map(key =>
            this.params.get(key)!.serialize()
        )

        return {
            type: this.type,
            name: this.name.value,
            position: this.position.value,
            parameters: params,
            icon: this.icon,
            inputs: this.inputs.map(it => ({
                name: it.name,
                multiple: it.multiple
            })),
            outputs: this.outputs.map(it => ({
                name: it.name,
            }))
        }
    }

    initFromData(data: Partial<SerializedNode>, deserializer: Deserializer) {

    }

    private findDependants(deep: boolean = false) {
        const dependants: Node[] = []
        for (let output of this.outputs) {
            const connections = this.parent?.getConnectionsComingFrom(output) ?? []
            for (let connection of connections) {
                if (deep)
                    dependants.push(...connection.to.node.findDependants())
                dependants.push(connection.to.node)

            }
        }
        return dependants
    }

    getDependenciesInParent() {
        const dependencies = new Set<Node>()

        this.inputs.forEach(input => input.connections.forEach(connection => {
            if (connection.circular.value)
                return;

            dependencies.add(connection.from.node)
            connection.from.node.getDependenciesInParent().forEach(dependency =>
                dependencies.add(dependency)
            )
        }))

        return dependencies
    }

    get type(): string {
        return this.constructor.name
    }

    getChild(name: string) {
        if (name.startsWith(':input')) {
            const index = parseInt(name.substring(':input'.length))
            return this.inputs[index]
        }
        return this.params.get(name)
    }

    getParent() {
        return this.parent
    }

    canEvaluate(): boolean {
        return false
    }

    getDependenciesDeep(): Set<NodeDependencyType> {
        const dependencies = new Set(this.dependencies);

        const d = this.findDependenciesForCooking()

        d.forEach(it => {
            it.dependencies.forEach(dependency => dependencies.add(dependency))
        })

        return dependencies
    }

    getName(): string {
        return this.name.value
    }
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

    output(name: string = `Output${this.nodeOutputs.length + 1}`): NodeBuilder {
        this.nodeOutputs.push(new NodeOutput(this.node, name, this.nodeOutputs.length))
        return this
    }

    outputs(outputs: number | string[]): NodeBuilder {
        if (Array.isArray(outputs))
            outputs.forEach(input => this.output(input))
        else {
            for (let i = 0; i < outputs; i++) {
                this.output(`Output${i + this.nodeOutputs.length + 1}`)
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
    Cooked,
    Error,
}

export interface TimingInformation {
    startTime: number
    endTime: number
    keyframes: KeyframeInformation []
    type: 'animation' | 'clip' | 'beatmap',
    drag?: Partial<Pick<DragOptions, 'onDrag' | 'onDragStart' | 'onDragEnd'>>
}

export interface KeyframeInformation {
    time: number
    label?: string
    drag?: Partial<Pick<DragOptions, 'onDrag' | 'onDragStart' | 'onDragEnd'>>
    type?: string
    duration?: number
}