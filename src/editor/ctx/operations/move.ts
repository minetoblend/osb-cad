import {IHasPosition} from "@/types/position";
import {EditorContext} from "@/editor/ctx/context";
import {Operation} from "@/editor/ctx/operation";
import {Vec2} from "@/util/math";
import {MoveNodesCommand} from "@/editor/ctx/editorCommand";
import {Node} from "@/editor/node";


export abstract class MoveOperation<T extends IHasPosition> extends Operation {

    constructor(readonly ctx: EditorContext, readonly items: T[]) {
        super(ctx)
        this.startPositions = items.map(item => this.getPosition(item).clone())
        this.currentPositions = items.map(item => this.getPosition(item).clone())
    }

    readonly startPositions: Vec2[]
    readonly currentPositions: Vec2[]

    getPosition(item: T) {
        if (item.position instanceof Vec2)
            return item.position
        return item.position.value
    }

    setPosition(item: T, value: Vec2) {
        if (item.position instanceof Vec2)
            return item.position = value
        else
            return item.position.value = value
    }

    private totalMoved = Vec2.zero()

    move(by: Vec2) {
        this.totalMoved.move(by)
        this.items.forEach((item, index) => {
            this.currentPositions[index].move(by)
            this.setPosition(item, this.currentPositions[index].clone())
        })
    }

    cancel() {
        this.items.forEach((item, index) =>
            this.setPosition(item, this.startPositions[index].clone())
        )
    }
}

export class MoveNodesOperation extends MoveOperation<Node> {
    commit() {
        this.ctx.executeCommand(
            new MoveNodesCommand(
                this.ctx,
                this.items.map(it => it.path),
                this.currentPositions,
                this.startPositions,
            )
        )
    }
}
