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

        if (lastCommand.createUndo) {
            const redo = lastCommand.createUndo()
            this.future.push(redo)
        } else {
            this.clearFuture()
        }

        lastCommand.execute()

        return true;
    }

    redo(): boolean {
        const nextCommand = this.future.pop()
        if (!nextCommand)
            return false;

        if (nextCommand.createUndo) {
            const undo = nextCommand.createUndo()
            this.past.push(undo)
        } else {
            this.clearPast()
        }

        nextCommand.execute()

        return true;
    }

    onCommandExecute(command: EditorCommand) {
        if (command.createUndo)
            this.push(command.createUndo())
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