import {NodePath} from "@/editor/node/path";
import {EditorContext} from "@/editor/ctx/context";
import {Vec2} from "@/util/math";

export abstract class EditorCommand {

    constructor(readonly ctx: EditorContext) {
    }

    abstract execute(): void

    createUndo?(): EditorCommand

    abstract name: string
}

export class MoveNodesCommand extends EditorCommand {

    name = 'Move Node'

    constructor(
        ctx: EditorContext,
        readonly nodes: NodePath[],
        readonly to: Vec2[],
        from?: Vec2[]) {
        super(ctx);
        if (!from) {
            this.from = nodes.map(node => ctx.getObject(node)!.position.value.clone())
        } else {
            this.from = from
        }
    }

    readonly from: Vec2[]

    execute(): void {
        this.nodes.forEach((nodePath, index) => {
            const node = this.ctx.getObject(nodePath)!
            node.position.value = this.to[index]
        })
    }

    createUndo() {
        return new MoveNodesCommand(
            this.ctx,
            this.nodes,
            this.from,
            this.to
        )
    }

}