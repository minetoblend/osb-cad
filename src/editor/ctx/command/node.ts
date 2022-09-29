import {
    EditorCommand,
    EditorCommandCollection,
    MoveNodesCommand,
    ProducingEditorCommand
} from "@/editor/ctx/editorCommand";
import {EditorContext} from "@/editor/ctx/context";
import {EditorPath} from "@/editor/node/path";
import {NodeSystem} from "@/editor/node/system";
import {Deserializer, SerializedNode} from "@/editor/ctx/serialize";
import {NodeConnection} from "@/editor/node/connection";
import {Node} from "@/editor/node";
import {getNodeLayout} from "@/components/node/layout";
import {animateNodePosition} from "@/util/flags";
import {Vec2} from "@/util/math";


export class RenameNodeCommand extends EditorCommand {
    name: string = 'Rename Node';

    constructor(ctx: EditorContext, readonly node: EditorPath, readonly newName: string) {
        super(ctx);
    }

    execute(): boolean {
        const node = this.ctx.getObject(this.node)!
        node.parent!.rename(node, this.newName)
        return true;
    }

    createUndo(): EditorCommand {
        const node = this.ctx.getObject(this.node)!
        return new RenameNodeCommand(this.ctx, this.node.replace(this.newName), node.name.value);
    }
}

export class DeleteNodesCommand extends EditorCommand {
    name: string = 'Delete Node'

    constructor(ctx: EditorContext, readonly nodes: EditorPath[]) {
        super(ctx);
    }

    execute(): boolean {
        this.nodes.forEach(nodePath => {
            const node = this.ctx.getObject(nodePath)
            node?.parent?.remove(node)
        })
        return true
    }

    createUndo(): EditorCommand | undefined {
        const commands: EditorCommand[] = []
        const connections = new Set<NodeConnection>()

        this.nodes.forEach(it => {
            const node = this.ctx.getObject(it)!
            commands.push(new CreateNodeCommand(this.ctx, it.parent!, node.type, node.serialize()))
            node.inputs.forEach(input => input.connections.forEach(connection =>
                connections.add(connection)
            ))
            node.outputs.forEach(input => input.connections.forEach(connection =>
                connections.add(connection)
            ))
        });

        [...connections].forEach(it =>
            commands.push(new AddConnectionCommand(this.ctx,
                it.from.node.path,
                it.from.index,
                it.to.node.path,
                it.to.index,
            ))
        )

        return new EditorCommandCollection(this.ctx, 'Create Nodes', commands)
    }
}

export class CreateNodeCommand extends EditorCommand {
    name = 'Create Node'

    constructor(ctx: EditorContext,
                readonly parent: EditorPath,
                type: string,
                readonly data?: Partial<SerializedNode>) {
        super(ctx);
        this.data = {
            ...this.data ?? {},
            type
        }
    }

    execute() {
        const parent = this.ctx.getObject(this.parent)
        const {Deserializer} = require('../serialize')
        const deserializer = new Deserializer()

        if (parent instanceof NodeSystem) {
            const node = deserializer.deserializeNode(this.ctx, this.data!, parent.nodeType)

            if (node) {
                parent.add(node)
                parent.select([node])

                if (!parent.outputNode.value)
                    parent.outputNode.value = node.name

                return true
            }
        }
        return false
    }
}

export class SetOutputNodeCommand extends EditorCommand {
    name: string = 'Rename Node';

    constructor(ctx: EditorContext, readonly system: EditorPath, readonly node?: string) {
        super(ctx);
    }

    execute(): boolean {
        const node = this.ctx.getObject(this.system)
        if (node instanceof NodeSystem) {
            if (!this.node)
                node.outputNode.value = undefined
            else if (node.getNode(this.node))
                node.outputNode.value = this.node
            return true
        }
        return false
    }

    createUndo(): EditorCommand {
        const node = this.ctx.getObject(this.system)
        if (node instanceof NodeSystem) {
            return new SetOutputNodeCommand(this.ctx, this.system, node.outputNode.value)
        }
        throw Error()
    }

}

export class AddConnectionCommand extends EditorCommand {
    name: string = 'Add Connection';

    constructor(ctx: EditorContext,
                readonly fromNode: EditorPath,
                readonly output: number,
                readonly toNode: EditorPath,
                readonly input: number) {
        super(ctx);

    }

    execute(): boolean {
        const from = this.ctx.getObject(this.fromNode)!
        const to = this.ctx.getObject(this.toNode)!
        if (from.parent !== to.parent)
            throw new Error('Cannot create Connection between 2 Nodes with different Parents')
        from.parent!.addConnection(
            from.outputs[this.output],
            to.inputs[this.input]
        )
        return true;
    }

    createUndo(): EditorCommand {
        return new RemoveConnectionCommand(this.ctx, this.fromNode, this.output, this.toNode, this.input);
    }
}

export class RemoveConnectionCommand extends EditorCommand {
    name: string = 'Add Connection';

    constructor(ctx: EditorContext,
                readonly fromNode: EditorPath,
                readonly output: number,
                readonly toNode: EditorPath,
                readonly input: number) {
        super(ctx);
    }

    execute(): boolean {
        const from = this.ctx.getObject(this.fromNode)!
        const to = this.ctx.getObject(this.toNode)!

        const connection = from.parent!.getConnection(from.outputs[this.output], to.inputs[this.input])
        if (connection)
            from.parent!.removeConnection(connection)

        return !!connection
    }

    createUndo(): EditorCommand {
        return new AddConnectionCommand(this.ctx, this.fromNode, this.output, this.toNode, this.input);
    }
}


export class LayoutNodesCommand extends ProducingEditorCommand {
    name = 'Layout Nodes';

    constructor(ctx: EditorContext, readonly parent: EditorPath, readonly names: string[]) {
        super(ctx);
    }


    static readonly spacingX = 100

    /**
     * Calculates the width needed to layout a node and all the ndoes it depends on
     * Takes the maximum of either it's own width, or the combined width of the nodes before it
     * @param node
     * @param nodes
     */
    getTreeWidth(node: Node, nodes: Node[]) {
        const layout = getNodeLayout(node)
        let childWidth = 0
        let childCount = 0

        node.inputs.forEach(input => {
            input.connections.forEach(connection => {
                if (connection.circular.value)
                    return; // prevent stack overflow from circular dependency
                if (connection.from.connections[0] !== connection)
                    return;
                if (nodes.includes(connection.from.node)) {
                    childWidth += this.getTreeWidth(connection.from.node, nodes).width
                    childCount++
                }
            })
        })

        childWidth += Math.max(childCount - 1, 0) * LayoutNodesCommand.spacingX

        return {
            width: Math.max(childWidth, layout.size.x),
            layout,
            childCount
        }
    }

    isRootInSelection(parent: NodeSystem<any>, node: Node, nodes: Node[]) {
        return !node.outputs.some(output =>
            output.connections.some(connection =>
                nodes.includes(connection.to.node)
            )
        );
    }

    layoutNode(node: Node, x: number, y: number, nodes: Node[], commands: [EditorPath, Vec2][]) {
        let {width, layout, childCount} = this.getTreeWidth(node, nodes)

        const children = new Set<Node>()

        node.inputs.forEach(it => it.connections.forEach(connection => {
            if (connection.circular.value)
                return;
            if (connection.from.connections[0] !== connection)
                return;
            if (nodes.includes(connection.from.node))
                children.add(connection.from.node)
        }))

        let curX = x
        const deltaY = childCount > 1 ? 125 : 100

        children.forEach((child) => {
            curX += this.layoutNode(child, curX, y - deltaY, nodes, commands) + LayoutNodesCommand.spacingX
        })

        const newPos = new Vec2(x + width / 2 - layout.size.x / 2, y)

        if (!node.position.value.equals(newPos))
            commands.push([
                node.path,
                newPos
            ])

        return width
    }

    createCommand(): EditorCommand | undefined {
        const parent = this.ctx.getObject(this.parent)
        if (!(parent instanceof NodeSystem)) return;
        const nodes = this.names.map(name => parent.getNode(name)).filter(Boolean)

        const rootNodes = nodes.filter(node => this.isRootInSelection(parent, node, nodes))
            .sort((a, b) => a.position.value.x - b.position.value.x)

        let curX = Math.min(...rootNodes.map(it => it.position.value.x))
        let curY = Math.max(...rootNodes.map(it => it.position.value.y))

        const positions: [EditorPath, Vec2][] = []

        animateNodePosition(() => rootNodes.forEach((node, index) => {
            const {width, layout} = this.getTreeWidth(node, nodes)
            if (index === 0)
                curX += -width / 2 + layout.size.x / 2
            curX += this.layoutNode(node, curX, curY, nodes, positions) + LayoutNodesCommand.spacingX
        }))

        if (positions.length === 0)
            return;

        return new MoveNodesCommand(this.ctx,
            positions.map(it => it[0]),
            positions.map(it => it[1])
        ).withName('Layout Nodes').animated()
    }
}