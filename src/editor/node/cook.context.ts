import {Node} from "@/editor/node/index";
import {SBCollection} from "@/editor/objects/collection";

export class CookContext {

    readonly input: any[] = []

    constructor(node: Node) {


        node.inputs.forEach(input => {
            const value = input.getValue() ?? new SBCollection()
            if (Array.isArray(value))
                this.input.push(value.map(it => it.clone()))
            else
                this.input.push(value.clone())
        })
    }


}

export class CookResult {

    readonly outputData: any[] = []

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
}

export enum CookResultType {
    Success
}