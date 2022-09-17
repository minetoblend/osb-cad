import {EditorContext} from "@/editor/ctx/context";

export abstract class Operation {

    constructor(readonly ctx: EditorContext) {
    }

    abstract cancel(): void

    abstract commit(): void

}