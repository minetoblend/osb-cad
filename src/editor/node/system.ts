import {Node} from "@/editor/node/index";
import {NodeConnection} from "@/editor/node/connection";
import {NodePath} from "@/editor/node/path";
import {ref, shallowReactive, watch, WatchStopHandle} from "vue";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeDependencyType} from "@/editor/compile";
import {endsWithNumber, getNumberAtEnd} from "@/util/string";
import type {Deserializer, SerializedNodeSystem} from "@/editor/ctx/serialize";
import {NodeInput, NodeOutput} from "@/editor/node/input";
import {NodeDependency} from "@/editor/node/dependency";
import {MarkDirtyReason} from "@/editor/node/markDirty";

export abstract class NodeSystem<N extends Node> extends Node {

    abstract nodeType: string

    icon = ['fas', 'diagram-project']
    readonly outputNode = ref<string>()
    private readonly nodes = shallowReactive(new Map<string, N>())
    private readonly connections: NodeConnection<N>[] = shallowReactive([])
    readonly selection = shallowReactive(new Set<Node>())
    private readonly connectionSelection = shallowReactive(new Set<NodeConnection>())
    private outputWatcher: WatchStopHandle;

    constructor(ctx: EditorContext, name: string) {
        super(ctx, name);

        this.outputWatcher = watch(this.outputNode, () => {
            this.markDirty()
        })
    }

    get nodeList() {
        return this.nodes.values()
    }

    get connectionList(): ReadonlyArray<NodeConnection<N>> {
        return [...this.connections]
    }

    get selectedNodes() {
        return [...this.selection.values()]
    }

    get selectedConnections() {
        return [...this.connectionSelection.values()]
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        if (this.outputNode.value) {
            const node = this.getNode(this.outputNode.value)
            const output = node?.getOutput(0)
            if (output) {
                return CookResult.success(output)
            }
        }
        return CookResult.success(new SBCollection());
    }

    find(path: NodePath): Node | null {
        if (path.length === 0)
            return this

        const node = this.nodes.get(path.current)
        if (node) {
            return node.find(path.shift())
        }

        return null
    }

    add(node: N) {
        node.name.value = this.getAvailableName(node.name.value)
        this.nodes.set(node.name.value, node)
        node.parent = this

        if (!this.outputNode.value)
            this.outputNode.value = node.name.value
    }

    remove(node: N) {
        const connections = this.getConnectionsFor(node)
        connections.forEach(connection => {
            this.removeConnection(connection)
        })

        this.nodes.delete(node.name.value)
        node.parent = undefined

        if (node.name.value === this.outputNode.value) {
            this.outputNode.value = undefined
            this.markDirty()
        }
        this.ctx.onNodeRemoved(this, node)

        node.destroy()
    }

    addConnection(from: NodeOutput<N>, to: NodeInput<N>) {
        const existingConnections = this.getConnectionsLeadingTo(to)
        if (!to.multiple) {
            existingConnections.forEach(connection => this.removeConnection(connection))
        } else {
            existingConnections.filter(it =>
                it.from === from && it.to === to
            ).forEach(connection => this.removeConnection(connection))
        }
        const connection = new NodeConnection<N>(from, to)
        from.connections.push(connection)
        to.connections.push(connection)
        this.connections.push(connection)
        to.node.markDirty()
    }

    removeConnection(connection: NodeConnection<N>) {
        const index = this.connections.indexOf(connection)
        if (index >= 0)
            this.connections.splice(index, 1)
        const fromIndex = connection.from.connections.indexOf(connection)
        if (fromIndex >= 0)
            connection.from.connections.splice(fromIndex, 1)
        const toIndex = connection.to.connections.indexOf(connection)
        if (toIndex >= 0)
            connection.to.connections.splice(toIndex, 1)

        connection.to.node.markDirty();
    }

    getConnection(from: NodeOutput, to: NodeInput) {
        return this.connections.find(it => it.from === from && it.to === to)
    }

    select(nodes: N[], additive: boolean = false) {
        this.connectionSelection.clear()
        if (!additive) {
            this.selection.clear()
            if (nodes.length > 0)
                this.ctx.activeNode.value = nodes[0]
        }
        for (let node of nodes)
            this.selection.add(node)
    }

    selectConnections(connections: NodeConnection<N>[], additive: boolean = false) {
        this.selection.clear()
        if (!additive) {
            this.connectionSelection.clear()
        }
        for (let connection of connections)
            this.connectionSelection.add(connection)
    }

    isNodeSelected(node: N): boolean {
        return this.selection.has(node)
    }

    isConnectionSelected(connection: NodeConnection<N>): boolean {
        return this.connectionSelection.has(connection)
    }

    rename(node: N, newName: string) {
        this.nodes.delete(node.name.value)
        this.nodes.set(newName, node)
        if (this.outputNode.value === node.name.value)
            this.outputNode.value = newName
        node.name.value = newName
    }

    getConnectionsLeadingTo(input: NodeInput<N> | N) {
        if (input instanceof Node) {
            const connections: NodeConnection<N>[] = [];
            input.inputs.forEach((it: NodeInput) => connections.push(...it.connections as NodeConnection<N>[]))
            return connections
        }
        return input.connections
    }

    getConnectionsComingFrom(output: NodeOutput) {
        return output.connections
    }

    getConnectionsFor(node: N) {
        return this.connections.filter(it => it.from.node === node || it.to.node === node)
    }

    getNode(name: string) {
        return this.nodes.get(name);
    }

    markDirty(reason?: MarkDirtyReason, visited: Set<Node> = new Set<Node>()) {
        super.markDirty(reason, visited);

        if (!this.parent && this.name.value === 'root') {
            return this.ctx.cookNode(this)
        }
    }

    findDependenciesForCooking(visited: Set<Node> = new Set<Node>()): NodeDependency[] {
        const dependencies = super.findDependenciesForCooking(visited);

        if (this.outputNode.value) {
            const outputNode = this.getNode(this.outputNode.value) as Node
            dependencies.push(new NodeDependency(outputNode, 0, 0))
        }

        return dependencies;
    }

    findDirtyDependencies(): Node[] {
        const dependencies = super.findDirtyDependencies();

        if (this.outputNode.value) {
            const node = this.getNode(this.outputNode.value)
            if (node?.isDirty) {
                dependencies.push(node)
            }
        }

        return dependencies
    }

    getConnectionsBetween(from: Node, to: Node) {
        return this.connections.filter(it => it.from.node === from && it.to.node === to)
    }

    destroy() {
        this.outputWatcher()
        this.nodes.forEach(it => it.destroy())
        super.destroy()
    }

    markDependencyChanged(...dependencies: NodeDependencyType[]) {
        this.nodes.forEach(it => {
            dependencies.forEach(dependency => {
                if (it.hasDependency(dependency))
                    it.markDirty(MarkDirtyReason.expressionDependency(dependency))
            })
            if (it instanceof NodeSystem)
                it.markDependencyChanged(...dependencies)
        })
    }

    getAvailableName(name: string) {
        if (!this.nodes.has(name))
            return name

        let discriminator = 0
        if (endsWithNumber(name)) {
            discriminator = getNumberAtEnd(name) ?? 0
            name = name.substring(0, name.length - (discriminator.toString().length))
        }
        while (this.nodes.has(name + discriminator)) {
            discriminator++
        }
        return name + discriminator;
    }

    handleDoubleClick() {
        this.ctx.activePath.value = this.path
    }

    serialize(): SerializedNodeSystem {
        const node = super.serialize()
        return {
            ...node,
            nodes: [...this.nodeList].map(it => it.serialize()),
            connections: this.connectionList.map(it => it.serialize()),
            output: this.outputNode.value ?? null,
        }
    }

    initFromData(data: Partial<SerializedNodeSystem>, deserializer: Deserializer) {
        super.initFromData(data, deserializer);

        data.nodes?.forEach(serializedNode => {
            const node = deserializer.deserializeNode(this.ctx, serializedNode, this.nodeType) as N
            if (node) {
                this.add(node)
            }
        })

        data.connections?.forEach(serializedConnection => {
            const fromNode = this.getNode(serializedConnection.from.node)
            const toNode = this.getNode(serializedConnection.to.node)
            const from = fromNode?.outputs[serializedConnection.from.index]
            const to = toNode?.inputs[serializedConnection.to.index]
            if (from && to)
                this.addConnection(from as NodeOutput<N>, to as NodeInput<N>)
        })

        this.outputNode.value = data.output ?? undefined
    }

    isChildOf(system: NodeSystem<any>): boolean {
        if (this.parent === system)
            return true;
        if (this.parent)
            return this.parent.isChildOf(system)
        return false;
    }

    get nodeNames(): IterableIterator<string> {
        return this.nodes.keys()
    }
}