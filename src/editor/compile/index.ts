import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from "@babel/generator";
import {createCodeBlockVisitor, createExpressionVisitor} from "@/editor/compile/visit";
import {lerp, Vec2, Vec2Like} from "@/util/math";
import {SBElement} from "@/editor/objects";
import {SBCollection} from "@/editor/objects/collection";
import {createStatementBaseContext, createStatementContext} from "@/editor/compile/ctx";
import Prando from "prando";


export const globalFunctions: GlobalFunctions = {
    cos: Math.cos,
    sin: Math.sin,
    tan: Math.atan,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    lerp,
    lerpv: (a: Vec2, b: Vec2, f: number) => new Vec2(
        a.x + (b.x - a.x) * f,
        a.y + (b.y - a.y) * f,
    ),
    vec2(x: number, y: number): Vec2Like {
        return new Vec2(x, y)
    },
    rand(seed: number, min = 0, max = 1) {
        const rand = new Prando((seed * 100).toString())
        //rand.skip(seed * 10)
        return rand.next(min, max)
    }
}

export interface GlobalFunctions {
    cos(x: number): number

    sin(x: number): number

    tan(x: number): number

    acos(x: number): number

    asin(x: number): number

    atan(x: number): number

    atan2(y: number, x: number): number

    floor(x: number): number

    ceil(x: number): number

    round(x: number): number

    lerp(a: number, b: number, f: number): number

    lerpv(a: Vec2, b: Vec2, f: number): Vec2

    vec2(x: number, y: number): Vec2Like;

    rand(seed: number): number
}

export interface GlobalValues {
    TIME: number,
    CENTRE: Vec2
    DELTA: number
}

export const builtinExpressionMethods = new Set<string>([
    ...Object.keys(globalFunctions),
    'getAttrib',
])

export const builtinStatementMethods = new Set<string>([
    ...builtinExpressionMethods,
    'setAttrib',
])

export function compileStatements(code: string) {
    const attributes = new Set<string>()
    const dependencies = new Set<ExpressionDependency>()

    code = '(ctx, el, idx) => {\n' + code.trim() + '\n}'

    const ast = parser.parse(code, {
        sourceFilename: 'code.js'
    })

    traverse(ast, {
        ...createCodeBlockVisitor(attributes, dependencies, builtinStatementMethods),
    })

    const transformedCode = generate(ast, {
        sourceMaps: true
    }, {
        'code.js': code
    })
    console.log(transformedCode.map)
    console.log(transformedCode.code)
    const compiledFunction = eval(transformedCode.code)
    return new CompiledCodeBlock(compiledFunction, attributes, dependencies)
}


export function compileExpression(expression: string, withIndex: boolean): CompiledExpression {
    const attributes = new Set<string>()
    const dependencies = new Set<ExpressionDependency>()

    const ast = parser.parse('(ctx, el, idx) => ' + expression.trim())

    traverse(ast, {
        ...createExpressionVisitor(withIndex, attributes, dependencies, builtinExpressionMethods)
    })

    const transformedCode = generate(ast)
    const compiledFunction = eval(transformedCode.code)

    console.log(transformedCode)

    return new CompiledExpression(compiledFunction, expression, attributes, dependencies)
}

export enum ExpressionDependency {
    ElementIndex,
    Time,
    Texture,
    Beatmap,

}

export const Globals = new Set<string>(
    'TIME'
);

export class CompiledCodeBlock {
    constructor(readonly expression: (ctx: any, el: SBElement, idx: number) => any, readonly attributes: Set<string>, readonly dependencies: Set<ExpressionDependency>) {
        console.log(expression)
    }

    run(globals: GlobalValues, inputs: SBCollection[]) {
        const baseCtx = createStatementBaseContext(globals)
        inputs[0]?.forEach((idx, el) => {
            const ctx = createStatementContext(baseCtx, inputs)
            this.expression(ctx, el, idx)
        })
    }

}

export class CompiledExpression {
    readonly isConstant: boolean;

    constructor(readonly expression: (ctx: any, el?: SBElement, idx?: number) => any,
                readonly source: string,
                readonly attribtues: Set<string>,
                readonly dependencies: Set<ExpressionDependency>,
    ) {
        this.isConstant = attribtues.size === 0 && dependencies.size === 0

        if (this.isConstant)
            this.cachedValue = expression({
                ...builtinExpressionMethods
            })
    }

    cachedValue?: any

    get perElement() {
        return this.dependencies.has(ExpressionDependency.ElementIndex)
    }

    evaluate(ctx: ExpressionContext, el?: SBElement, idx?: number) {
        if (this.isConstant)
            return this.cachedValue

        const combinedCtx: ExpressionContext & GlobalFunctions = {
            ...ctx,
            ...globalFunctions
        }

        //console.log(combinedCtx)

        if (idx === undefined) {
            return this.expression(combinedCtx, el, -1)
        } else {
            return this.expression(combinedCtx, el, idx)
        }
    }
}


export interface ExpressionContext {


}