import {Node, NodeInput, NodeOutput} from "@/editor/node/index";
import {NodeConnection} from "@/editor/node/connection";
import {NodePath} from "@/editor/node/path";
import {ref, shallowReactive, watch, WatchStopHandle} from "vue";
import {EditorContext} from "@/editor/ctx/context";

export class NodeSystem<N extends Node> extends Node {

    icon = ['fas', 'diagram-project']

    private readonly nodes = shallowReactive(new Map<string, N>())
    private readonly connections: NodeConnection<N>[] = shallowReactive([])
    private readonly selection = shallowReactive(new Set<Node>())

    readonly outputNode = ref<string>()
    private outputWatcher: WatchStopHandle;


    constructor(ctx: EditorContext, name: string) {
        super(ctx, name);

        this.outputWatcher = watch(this.outputNode, () => {
            this.markDirty()
        })
    }

    find(path: NodePath): Node | null {
        if (path.length === 0)
            return this


        const node = this.nodes.get(path.current)
        if (node) {
            return node
        }

        return null
    }

    add(node: N) {
        this.nodes.set(node.name.value, node)
        node.parent = this
    }

    remove(node: N) {
        const connections = this.getConnectionsFor(node)
        connections.forEach(connection => {
            this.removeConnection(connection)
        })

        this.nodes.delete(node.name.value)
        node.parent = undefined
        this.ctx.onNodeRemoved(this, node)

        node.destroy()
    }

    addConnection(from: NodeOutput<N>, to: NodeInput<N>) {
        const existingConnections = this.getConnectionsLeadingTo(to)
        if (!to.multiple) {
            existingConnections.forEach(connection => {
                this.removeConnection(connection);
            })
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
            connection.from.connections.splice(index, 1)
        const toIndex = connection.to.connections.indexOf(connection)
        if (toIndex >= 0)
            connection.to.connections.splice(index, 1)

        connection.to.node.markDirty();
    }

    getConnection(from: NodeOutput, to: NodeInput) {
        return this.connections.find(it => it.from === from && it.to === to)
    }

    get nodeList() {
        return this.nodes.values()
    }

    get connectionList(): ReadonlyArray<NodeConnection<N>> {
        return this.connections
    }

    select(nodes: N[], additive: boolean = false) {
        if (!additive) {
            this.selection.clear()
            if (nodes.length > 0)
                this.ctx.activeNode.value = nodes[0]
        }
        for (let node of nodes)
            this.selection.add(node)
    }

    isNodeSelected(node: N): boolean {
        return this.selection.has(node)
    }

    rename(node: N, newName: string) {
        this.nodes.delete(node.name.value)
        this.nodes.set(newName, node)
        node.name.value = newName
    }

    get selectedNodes() {
        return [...this.selection.values()]
    }

    getConnectionsLeadingTo(input: NodeInput<N> | N) {
        if (input instanceof Node) {
            const connections: NodeConnection<N>[] = [];
            input.inputs.forEach((it: NodeInput) => connections.push(...it.connections as NodeConnection<N>[]))
            return connections
        } //this.connections.filter(it => it.to.node === input)
        return input.connections
    }

    getConnectionsComingFrom(output: NodeOutput) {
        return output.connections
        //return this.connections.filter(it => it.from === output)
    }

    getConnectionsFor(node: N) {
        return this.connections.filter(it => it.from.node === node || it.to.node === node)
    }

    getNode(name: string) {
        return this.nodes.get(name);
    }

    markDirty(visited: Set<Node> = new Set<Node>()) {
        super.markDirty();
        if (!this.parent && this.name.value === 'root')
            this.ctx.cookNode(this)
    }

    findDirtyDependenciesDeep(path: Node[] = [], visited: Set<Node> = new Set<Node>()): Node[] {
        const dependencies = super.findDirtyDependenciesDeep([...path, this], visited);

        if (this.outputNode.value) {
            const outputNode = this.getNode(this.outputNode.value) as Node
            if (outputNode?.isDirty) {
                dependencies.push(
                    ...outputNode.findDirtyDependenciesDeep([...path, this], visited)
                )
                dependencies.push(outputNode)
            }
        }

        return dependencies;
    }

    getConnectionsBetween(from: Node, to: Node) {
        return this.connections.filter(it => it.from.node === from && it.to.node === to)
    }

    destroy() {
        this.outputWatcher()
    }
}