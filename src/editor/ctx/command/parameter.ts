import {EditorCommand} from "@/editor/ctx/editorCommand";
import {EditorContext} from "@/editor/ctx/context";
import {NodePath} from "@/editor/node/path";


export class SetNodeParameterCommand extends EditorCommand {

    name = 'Set node parameter';


    constructor(ctx: EditorContext, readonly path: NodePath, readonly param: string, readonly value: any, readonly originalValue?: any) {
        super(ctx);
    }

    execute(): boolean {
        const node = this.ctx.getObject(this.path)
        const param = node?.param(this.param)
        if (param) {
            param.setRaw(this.value)
        }
        return !!param
    }

    createUndo(): EditorCommand {
        const node = this.ctx.getObject(this.path)
        const param = node?.param(this.param)
        let value = undefined
        if (this.originalValue !== undefined) {
            value = this.originalValue
        } else if (param) {
            value = param.getRaw()
        }

        return new SetNodeParameterCommand(this.ctx, this.path, this.param, value);
    }

}