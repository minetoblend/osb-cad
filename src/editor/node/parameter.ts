import {
    CompiledCodeBlock,
    CompiledExpression,
    compileExpression,
    compileStatements,
    ExpressionDependency,
    globalFunctions
} from "@/editor/compile";
import {Node} from "@/editor/node/index";
import {Color, Vec2} from "@/util/math";
import {shallowRef} from "vue";
import {SBCollection} from "@/editor/objects/collection";
import {SBElement} from "@/editor/objects";
import {Origin} from "@/editor/objects/origin";
import {SerializedNodeParam} from "@/editor/ctx/serialize";


export abstract class NodeParameter {
    readonly value = shallowRef<any>()

    constructor(readonly node: Node, readonly id: string) {
    }

    abstract type: string

    get(ctx?: GetContext) {
        if (this.value.value instanceof CompiledExpression) {
            const evalCtx = {
                ...globalFunctions,
                ...ctx ?? {}
            };
            return this.value.value.evaluate(evalCtx)
        }
        return this.value.value
    }

    set(value: any) {
        this.value.value = value

        this.node.markDirty()
    }

    static int(node: Node, id: string, opts: IntParamOptions) {
        return new IntNodeParameter(node, id, opts)
    }

    static code(node: Node, id: string) {
        return new CodeNodeParameter(node, id)
    }

    getWithElement(ctx: GetWithElementContext) {
        const evalCtx = {
            ...globalFunctions,
            getAttrib: (geo: number, index: number, name: string) => {
                return ctx.geo[geo]?.getAttribute(name, index)
            },
            setAttrib: (geo: number, index: number, name: string, value: any) => {
                return ctx.geo[geo]?.setAttribute(name, index, value)
            },
            ...ctx
        };

        if (this.value.value instanceof CompiledExpression) {
            return this.value.value.evaluate(evalCtx, ctx.el, ctx.idx)
        }
        return this.value.value
    }

    getDependencies(): ExpressionDependency[] {
        if (this.value.value instanceof CompiledExpression)
            return [...this.value.value.dependencies]
        return []
    }

    serialize(): SerializedNodeParam {
        return {
            id: this.id,
            type: this.type,
            value: {
                type: (this.value.value instanceof CompiledExpression) ? 'expression' : typeof this.value.value,
                value: (this.value.value instanceof CompiledExpression) ? this.value.value.source : this.value.value,
            },
            extra: this.serializeExtra()
        }
    }

    serializeExtra(): Record<string, any> {
        return {}
    }

    initFrom(serializedParam: SerializedNodeParam) {
        if (serializedParam.value.type === 'expression') {
            this.value.value = compileExpression(serializedParam.value.value, (this as any).withIndex)
        } else {
            this.value.value = serializedParam.value.value
        }
    }

    setRaw(value: any) {
        this.value.value = value
        this.node.markDirty()
    }

    getRaw() {
        return this.value.value
    }
}

export interface GetContext {
    TIME: number
}

export interface GetWithElementContext {
    el?: SBElement,
    idx: number,
    geo: SBCollection[],
    TIME?: number
}

export interface IntParamOptions {
    defaultValue: number
    withIndex: boolean
}

export interface StringParamOptions {
    defaultValue: string
    withIndex: boolean
}

export interface FloatParamOptions {
    defaultValue: number
    withIndex: boolean
}

export interface Vec2ParamOptions {
    defaultValue: Vec2
    withIndex: boolean
}

export interface ColorParamOptions {
    defaultValue: Color
    withIndex: boolean
}

export interface OriginParamOptions {
    defaultValue: Origin
}


export class OriginNodeParameter extends NodeParameter {

    type = 'origin'


    constructor(node: Node, id: string, opts: OriginParamOptions) {
        super(node, id);
        this.value.value = opts.defaultValue
    }
}

export class IntNodeParameter extends NodeParameter {

    type = 'int'

    readonly withIndex: boolean

    constructor(node: Node, id: string, opts: IntParamOptions) {
        super(node, id);
        this.value.value = opts.defaultValue
        this.withIndex = opts.withIndex
    }

    get(ctx?: GetContext): any {
        return Math.floor(super.get(ctx))
    }

    set(value: any) {
        super.set(value);
    }

    getText() {
        if (this.value.value instanceof CompiledExpression) {
            return this.value.value.source
        }
        return this.get().toString()
    }

    setText(value: string) {
        const expr = compileExpression(value, this.withIndex)

        if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
            this.value.value = Math.floor(expr.cachedValue)
        } else {
            this.value.value = expr
        }
        this.node.markDirty()
    }

}

export class StringNodeParameter extends NodeParameter {

    type = 'string'

    readonly withIndex: boolean

    constructor(node: Node, id: string, opts: StringParamOptions) {
        super(node, id);
        this.value.value = opts.defaultValue
        this.withIndex = opts.withIndex
    }
}

export class FloatNodeParameter extends NodeParameter {

    type = 'float'

    readonly withIndex: boolean

    readonly expression = shallowRef<CompiledExpression>()

    constructor(node: Node, id: string, opts: IntParamOptions) {
        super(node, id);
        this.value.value = opts.defaultValue
        this.withIndex = opts.withIndex
    }

    getText() {
        if (this.value.value instanceof CompiledExpression) {
            return this.value.value.source
        }
        return this.get().toString()
    }
}


export class CodeNodeParameter extends NodeParameter {

    constructor(node: Node, id: string) {
        super(node, id);
        this.value.value = ''
    }

    type = 'code'

    compiledCode?: CompiledCodeBlock

    set(value: any) {
        this.compiledCode = compileStatements(value)

        super.set(value);
    }

    getDependencies(): ExpressionDependency[] {
        return [...this.compiledCode?.dependencies ?? []]
    }

    initFrom(serializedParam: SerializedNodeParam) {
        this.value.value = serializedParam.value.value
        this.compiledCode = compileStatements(serializedParam.value.value)
    }
}

