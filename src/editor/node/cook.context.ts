import {Node} from "@/editor/node/index";
import {SBCollection} from "@/editor/objects/collection";
import {GlobalValues} from "@/editor/compile";
import {NodeDependency} from "@/editor/node/dependency";
import {EditorContext} from "@/editor/ctx/context";
import {Vec2} from "@/util/math";

export class CookContext implements GlobalValues {

    readonly input: any[][] = []

    constructor(ctx: EditorContext, dependencies: NodeDependency[], dependency: NodeDependency, defaultValue: () => any) {
        const input: any = []

        dependencies.forEach((d) => {
            if (!input[d.input]) {
                input[d.input] = []
            }
            if (dependency.node && dependency.node.inputs[d.input]?.multiple) {

                input[d.input]!.push(d.result!.outputData[d.output])
            } else {
                input[d.input][d.key] = d.result!.outputData[d.output]
            }
        })

        if (dependency.node)
            dependency.node.inputs.forEach(it => {
                if (input[it.index] === undefined)
                    input[it.index] = [defaultValue()]
            })

        this.input = input

        this.TIME = dependency?.time ?? ctx.time.value
        this.DELTA = dependency.delta ?? 0
    }

    TIME: number
    DELTA: number

    getInput<T = SBCollection>(index: number = 0, key: number = 0): T {
        const value = this.input[index][key]
        if (value && value.clone) {
            return value.clone() as T
        }
        return value as T
    }

    getInputs<T = SBCollection>(key: number = 0): T[] {
        return this.input.map(it => {
            const value = it[key]
            if (value && value.clone) {
                return value.clone() as T
            }
            return value as T
        })
    }

    getInputMultiple<T = SBCollection>(index: number = 0): T[] {
        return this.input[index].map((it, key) => this.getInput<T>(index, key))
    }

    CENTRE = Vec2.playfieldCentre()
}

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
}

export enum CookResultType {
    Success,
    Failure
}

export class CookError {
    constructor(readonly node: Node, readonly message: string) {
    }
}