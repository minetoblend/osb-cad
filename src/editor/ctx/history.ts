import {EditorContext} from "@/editor/ctx/context";
import {EditorCommand} from "@/editor/ctx/editorCommand";


export class CommandHistory {

    constructor(readonly ctx: EditorContext) {
    }

    past: EditorCommand[] = []
    future: EditorCommand[] = []

    push(command: EditorCommand) {
        this.past.push(command)
        this.future = []
    }

    undo(): boolean {
        const lastCommand = this.past.pop()
        if (!lastCommand)
            return false;


        let redo;
        if (lastCommand.createUndo)
            redo = lastCommand.createUndo()

        if (redo)
            this.future.push(redo)
        else
            this.clearPast()

        lastCommand.execute()

        return true;
    }

    redo(): boolean {
        const nextCommand = this.future.pop()
        if (!nextCommand)
            return false;

        let undo;
        if (nextCommand.createUndo)
            undo = nextCommand.createUndo()

        if (undo)
            this.push(undo)
        else
            this.clearPast()

        nextCommand.execute()

        this.ctx.save()

        return true;
    }

    execute(command: EditorCommand) {
        let undo;
        if (command.createUndo)
            undo = command.createUndo()

        const hadEffect = command.execute()
        if (!hadEffect)
            return;

        if (undo)
            this.push(undo)
        else
            this.clearPast()
    }

    clearFuture() {
        this.future = []
    }

    clearPast() {
        this.past = []
    }
}