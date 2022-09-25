import {Operation} from "@/editor/ctx/operation";
import {EditorContext} from "@/editor/ctx/context";
import {Node} from "@/editor/node";
import {NodeParameter} from "@/editor/node/parameter";
import {SetNodeParameterCommand} from "@/editor/ctx/command/parameter";
import {EditorCommandCollection} from "@/editor/ctx/editorCommand";


export class SetNodeParameterOperation<T = any> extends Operation {

    private originalValues: T[]
    private currentValue: T[]
    params: NodeParameter[]

    constructor(ctx: EditorContext, readonly node: Node, ...params: NodeParameter[]) {
        super(ctx);
        this.params = params
        this.originalValues = params.map(it => it.getRaw())
        this.currentValue = this.originalValues.map(it => {
            if ((it as any).clone) {
                return (it as any).clone()
            }
            return it
        })
    }

    setValue(...value: T[]) {
        this.currentValue = value
        this.params.forEach((param, index) => param.setRaw(this.currentValue[index]))
    }

    getValue(): T[] {
        return this.currentValue
    }

    cancel(): void {
        this.params.forEach((param, index) => param.setRaw(this.originalValues[index]))
    }

    commit(): void {
        this.ctx.executeCommand(new EditorCommandCollection(this.ctx, 'Set Node Parameters', this.params.map((param, index) =>
                new SetNodeParameterCommand(this.ctx, this.node.path, param.id, this.currentValue[index], this.originalValues[index])
            )
        ))
    }

}