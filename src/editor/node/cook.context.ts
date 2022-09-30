import {Node} from "@/editor/node/index";
import {SBCollection} from "@/editor/objects/collection";

export class CookResult {

    readonly outputData: any[] = []
    readonly errors: CookError[] = []
    readonly upstreamErrors: CookError[] = []

    constructor(public readonly type: CookResultType) {
    }

    setOutput(index: number, output: any) {
        this.outputData[index] = output
    }

    static success(...output: SBCollection[]) {
        const result = new CookResult(CookResultType.Success)
        output.forEach((it, index) => result.setOutput(index, it))
        return result
    }

    static failure(errors: CookError[] = [], upstreamErrors: CookError[] = []) {
        const result = new CookResult(CookResultType.Failure)
        result.errors.push(...errors)
        result.upstreamErrors.push(...upstreamErrors)
        return result
    }

    duration = 0

    cached = false
}

export enum CookResultType {
    Success,
    Failure
}

export class CookError {
    constructor(readonly node: Node, readonly message: string) {
    }
}