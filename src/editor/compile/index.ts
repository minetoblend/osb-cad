import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from "@babel/generator";
import {createCodeBlockVisitor, createExpressionVisitor} from "@/editor/compile/visit";
import {lerp, Vec2} from "@/util/math";


const globalFunctions: GlobalFunctions = {
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
    )
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

    const ast = parser.parse('(ctx, idx) => {' + code.trim() + ' }')

    traverse(ast, {
        ...createCodeBlockVisitor(attributes, dependencies, builtinExpressionMethods)
    })

    const transformedCode = generate(ast)
    const compiledFunction = eval(transformedCode.code)
    console.log(transformedCode)
    return new CompiledCodeBlock(compiledFunction, attributes, dependencies)
}



export function compileExpression(expression: string): CompiledExpression {
    const attributes = new Set<string>()
    const dependencies = new Set<ExpressionDependency>()

    const ast = parser.parse('(ctx, idx) => ' + expression.trim())

    traverse(ast, {
        ...createExpressionVisitor(attributes, dependencies, builtinExpressionMethods)
    })

    const transformedCode = generate(ast)
    const compiledFunction = eval(transformedCode.code)

    return new CompiledExpression(compiledFunction, attributes, dependencies)
}

export enum ExpressionDependency {
    ElementIndex,
}

export const Globals = new Set<string>(
    'TIME'
);

export class CompiledCodeBlock {
    constructor(readonly expression: (ctx: any, idx: number) => any, readonly attribtues: Set<string>, readonly dependencies: Set<ExpressionDependency>) {
    }
}

export class CompiledExpression {
    readonly isConstant: boolean;

    constructor(readonly expression: (ctx: any, idx: number) => any, readonly attribtues: Set<string>, readonly dependencies: Set<ExpressionDependency>) {
        this.isConstant = attribtues.size === 0 && dependencies.size === 0

        if (this.isConstant)
            this.cachedValue = expression({
                ...builtinExpressionMethods
            }, -1)
    }

    cachedValue?: any

    get perElement() {
        return this.dependencies.has(ExpressionDependency.ElementIndex)
    }

    evaluate(ctx: ExpressionContext, idx?: number) {
        if (this.isConstant)
            return this.cachedValue

        const combinedCtx: ExpressionContext & GlobalFunctions = {
            ...ctx,
            ...globalFunctions
        }

        if (idx === undefined) {
            return this.expression(combinedCtx, -1)
        } else {
            return this.expression(combinedCtx, idx)
        }
    }
}



export interface ExpressionContext {


}