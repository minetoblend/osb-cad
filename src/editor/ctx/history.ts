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

        this.executeCommand(lastCommand)

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

        this.executeCommand(nextCommand)

        this.ctx.save()

        return true;
    }

    execute(command: EditorCommand) {
        let undo;
        if (command.createUndo)
            undo = command.createUndo()

        const hadEffect = this.executeCommand(command)
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

    private executeCommand(command: EditorCommand) {
        console.log(command)
        return command.execute()
    }

}