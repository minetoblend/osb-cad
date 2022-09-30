import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from "@babel/generator";
import * as babel from '@babel/core'
import {createExpressionVisitor} from "@/editor/compile/visit";
import {lerp, Vec2, Vec2Like} from "@/util/math";
import {SBElement} from "@/editor/objects";
import Prando from "prando";
import {AnalyzeVisitor} from "@/editor/compile/analyze";
import {Compiler} from "@/editor/compile/compiler";
import {EditorPath} from "@/editor/node/path";
import {EditorContext} from "@/editor/ctx/context";

//@ts-ignore
import presetEnv from '@babel/preset-env'
//@ts-ignore
import transformModulesUmd from '@babel/plugin-transform-modules-umd'
import {WrangleModule} from "@/editor/compile/module";
import {CompilerError} from "@/editor/compile/error";
import {CookJobContext} from "@/editor/cook/context";
//@ts-ignore
const fileClass = babel.File as Constructor<any>

declare var globalThis: any;

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

export function compileStatements(code: string, path: EditorPath, ctx: EditorContext) {
    const attributes = new Set<string>()
    const dependencies = new Set<NodeDependencyType>()

    const ast = parser.parse(code, {
        sourceFilename: 'code.js',
        sourceType: 'module',
    })


    const file = new fileClass({filename: 'osbcad://runner.js'}, {code, ast})

    const analyzer = new AnalyzeVisitor(ctx, path)
    traverse(ast, analyzer.visitor, file.scope)

    const compiler = new Compiler(analyzer)
    traverse(ast, compiler.visitor, file.scope)

    const compiledCode = generate(ast, {
        sourceMaps: true,
    }, {
        'code.js': code
    })

    console.log(compiledCode.code)

    const moduleName = path.toString().replace(/\//g, '_')

    const compiledModule = babel.transformSync(compiledCode.code, {
        presets: [
            /*[presetEnv, {
                exclude: ["transform-regenerator"],
                modules: "umd",
            }]*/
        ],
        sourceType: 'module',
        filename: moduleName,
        plugins: [transformModulesUmd],
        sourceFileName: moduleName,
    })!

    console.log(presetEnv)
    console.log(compiledModule.code)

    eval(compiledModule.code!)

    const module = globalThis[moduleName]

    if (module) {
        return new CompiledCodeBlock(module, code, attributes, dependencies, analyzer.errors)
    }

    throw new Error('Could not build module')
}


export function compileExpression(expression: string, withIndex: boolean): CompiledExpression {
    const attributes = new Set<string>()
    const dependencies = new Set<NodeDependencyType>()

    const ast = parser.parse('(ctx, el, idx) => ' + expression.trim())

    traverse(ast, {
        ...createExpressionVisitor(withIndex, attributes, dependencies, builtinExpressionMethods)
    })

    const transformedCode = generate(ast)
    const compiledFunction = eval(transformedCode.code)

    console.log(transformedCode)

    return new CompiledExpression(compiledFunction, expression, attributes, dependencies)
}

export enum NodeDependencyType {
    ElementIndex,
    Time,
    Texture,
    Beatmap,
    Audio,
}

export const Globals = new Set<string>(
    'TIME'
);

export class CompiledCodeBlock {
    constructor(
        readonly module: WrangleModule,
        readonly source: string,
        readonly attributes: Set<string>,
        readonly dependencies: Set<NodeDependencyType>,
        readonly errors: CompilerError[]
    ) {
    }

    run(ctx: CookJobContext) {
        return this.module.entry(ctx)
    }
}

export class CompiledExpression {
    readonly isConstant: boolean;

    constructor(readonly expression: (ctx: any, el?: SBElement, idx?: number) => any,
                readonly source: string,
                readonly attribtues: Set<string>,
                readonly dependencies: Set<NodeDependencyType>,
    ) {
        this.isConstant = attribtues.size === 0 && dependencies.size === 0

        if (this.isConstant)
            this.cachedValue = expression({
                ...builtinExpressionMethods
            })
    }

    cachedValue?: any

    get perElement() {
        return this.dependencies.has(NodeDependencyType.ElementIndex)
    }

    evaluate(ctx: ExpressionContext, el?: SBElement, idx?: number) {
        if (this.isConstant)
            return this.cachedValue

        const combinedCtx: ExpressionContext & GlobalFunctions = {
            ...ctx,
            ...globalFunctions
        }


        if (idx === undefined) {
            return this.expression(combinedCtx, el, -1)
        } else {
            return this.expression(combinedCtx, el, idx)
        }
    }
}


export interface ExpressionContext {


}