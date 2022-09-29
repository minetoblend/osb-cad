import {EditorPath} from "@/editor/node/path";
import {EditorContext} from "@/editor/ctx/context";
import {Vec2} from "@/util/math";
import {animateNodePosition} from "@/util/flags";

export abstract class EditorCommand {

    constructor(readonly ctx: EditorContext) {
    }

    abstract execute(): boolean

    createUndo?(): EditorCommand | undefined

    abstract name: string

    withName(name: string) {
        this.name = name
        return this
    }

}

export abstract class ProducingEditorCommand extends EditorCommand {

    constructor(readonly ctx: EditorContext) {
        super(ctx)
    }

    abstract createCommand(): EditorCommand | undefined

    execute() {
        const command = this.createCommand()
        return command?.execute() ?? false
    }

    createUndo(): EditorCommand | undefined {
        return this.createCommand()?.createUndo?.()
    }

    abstract name: string
}

export class MoveNodesCommand extends EditorCommand {

    name = 'Move Node'

    isAnimated = false

    constructor(
        ctx: EditorContext,
        readonly nodes: EditorPath[],
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

    execute(): boolean {
        if (this.isAnimated) {
            animateNodePosition(() =>
                this.nodes.forEach((nodePath, index) => {
                    const node = this.ctx.getObject(nodePath)!
                    node.position.value = this.to[index]
                })
            )
        } else {
            this.nodes.forEach((nodePath, index) => {
                const node = this.ctx.getObject(nodePath)!
                node.position.value = this.to[index]
            })
        }
        return true
    }

    createUndo() {
        return new MoveNodesCommand(
            this.ctx,
            this.nodes,
            this.from,
            this.to,
        ).animated(this.isAnimated)
    }

    animated(animated: boolean = true) {
        this.isAnimated = animated
        return this
    }
}

export class EditorCommandCollection extends EditorCommand {
    name: string;


    constructor(ctx: EditorContext, name: string, readonly commands: EditorCommand[]) {
        super(ctx);
        this.name = name;
    }

    execute(): boolean {
        this.commands.forEach(it => it.execute())
        return true
    }

    createUndo(): EditorCommand | undefined {
        const commands: EditorCommand[] = [];
        let hasUndo = true;
        [...this.commands].reverse().forEach(it => {
            let undo;
            if (it.createUndo)
                undo = it.createUndo()
            if (undo)
                commands.push(undo)
            else hasUndo = false
        })
        if (!hasUndo)
            return undefined
        return new EditorCommandCollection(this.ctx, this.name, commands);
    }

}

