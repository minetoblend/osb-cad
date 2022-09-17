import {EditorCommand} from "@/editor/ctx/editorCommand";
import {EditorContext} from "@/editor/ctx/context";
import {NodePath} from "@/editor/node/path";
import {NodeSystem} from "@/editor/node/system";
import {serializeNode} from "@/editor/node/serialize";


export class RenameNodeCommand extends EditorCommand {
    name: string = 'Rename Node';

    constructor(ctx: EditorContext, readonly node: NodePath, readonly newName: string) {
        super(ctx);
    }

    execute(): void {
        const node = this.ctx.getObject(this.node)!
        node.parent!.rename(node, this.newName)
    }

    createUndo(): EditorCommand {
        const node = this.ctx.getObject(this.node)!
        return new RenameNodeCommand(this.ctx, this.node.replace(this.newName), node.name.value);
    }
}

export class DeleteNodesCommand extends EditorCommand {
    name: string = 'Delete Node'

    constructor(ctx: EditorContext, readonly nodes: NodePath[]) {
        super(ctx);
    }

    execute() {
        this.nodes.forEach(nodePath => {
            const node = this.ctx.getObject(nodePath)

            console.log(serializeNode(node!))

            node?.parent?.remove(node)
        })

    }
}

export class SetOutputNodeCommand extends EditorCommand {
    name: string = 'Rename Node';

    constructor(ctx: EditorContext, readonly system: NodePath, readonly node?: string) {
        super(ctx);
    }

    execute(): void {
        const node = this.ctx.getObject(this.system)
        if (node instanceof NodeSystem) {
            if (!this.node)
                node.outputNode.value = undefined
            else if (node.getNode(this.node))
                node.outputNode.value = this.node
        }

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
                readonly fromNode: NodePath,
                readonly output: number,
                readonly toNode: NodePath,
                readonly input: number) {
        super(ctx);

    }

    execute(): void {
        const from = this.ctx.getObject(this.fromNode)!
        const to = this.ctx.getObject(this.toNode)!
        if (from.parent !== to.parent)
            throw new Error('Cannot create Connection between 2 Nodes with different Parents')
        from.parent!.addConnection(
            from.outputs[this.output],
            to.inputs[this.input]
        )
    }

    createUndo(): EditorCommand {
        return new RemoveConnectionCommand(this.ctx, this.fromNode, this.output, this.toNode, this.input);
    }
}

export class RemoveConnectionCommand extends EditorCommand {
    name: string = 'Add Connection';

    constructor(ctx: EditorContext,
                readonly fromNode: NodePath,
                readonly output: number,
                readonly toNode: NodePath,
                readonly input: number) {
        super(ctx);
    }

    execute(): void {
        const from = this.ctx.getObject(this.fromNode)!
        const to = this.ctx.getObject(this.toNode)!

        const connection = from.parent!.getConnection(from.outputs[this.output], to.inputs[this.input])
        if (connection)
            from.parent!.removeConnection(connection)
    }

    createUndo(): EditorCommand {
        return new AddConnectionCommand(this.ctx, this.fromNode, this.output, this.toNode, this.input);
    }
}
