import {Node} from "@/editor/node/index";
import {SBCollection} from "@/editor/objects/collection";
import {globalFunctions, GlobalValues} from "@/editor/compile";
import {NodeDependency} from "@/editor/node/dependency";
import {EditorContext} from "@/editor/ctx/context";
import {Vec2} from "@/util/math";
import {EditorPath} from "@/editor/node/path";

export class CookContext implements GlobalValues {

    readonly fetchedGeometry: Record<string, any[]>
    readonly inputGeometry: any[] = []

    constructor(readonly ctx: EditorContext, readonly node: Node, dependencies: NodeDependency[], dependency: NodeDependency) {
        const input: Record<string, any[]> = {}

        dependencies.forEach(dependency => {
            const key = dependency.key ?? 'default'


            const result = dependency.result!.outputData[dependency.output]?.clone()

            if (!result)
                console.log(dependency)

            const inputs = input[key] ?? []
            inputs.push(result)
            input[key] = inputs

            if (dependency.input !== undefined) {
                this.inputGeometry[dependency.input] = result
            }
        })

        this.fetchedGeometry = input

        this.TIME = dependency?.time ?? ctx.time.value
        this.DELTA = dependency.delta ?? 0
    }

    TIME: number
    DELTA: number

    getInput<T = SBCollection>(index: number = 0): T {
        const value = this.inputGeometry[index]
        if (value && value.clone) {
            return value.clone() as T
        }
        return value as T
    }

    getInputs<T = SBCollection>(key: string = 'default'): T[] {
        return this.fetchedGeometry[key].map(it => {
            const value = it
            if (value && value.clone) {
                return value.clone() as T
            }
            return value as T
        })
    }

    getInputMultiple<T = SBCollection>(index: number = 0): T[] {
        return this.getInputs(this.node.inputs[index].name)
    }

    CENTRE = Vec2.playfieldCentre()

    get(path: string | EditorPath) {
        if (typeof path === "string")
            path = this.node.path.resolve(path)
        return path.find(this.ctx)
    }

    fetch(key: string = 'default') {
        return this.fetchedGeometry[key]
    }

    fetchInput(index = 0) {
        return this.inputGeometry[index]
    }

    readonly functions = globalFunctions
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

    duration = 0
}

export enum CookResultType {
    Success,
    Failure
}

export class CookError {
    constructor(readonly node: Node, readonly message: string) {
    }
}