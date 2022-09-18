import {
    CompiledCodeBlock,
    CompiledExpression,
    compileExpression,
    compileStatements, ExpressionDependency,
    globalFunctions
} from "@/editor/compile";
import {Node} from "@/editor/node/index";
import {Color, Vec2, Vec2Like} from "@/util/math";
import {shallowRef} from "vue";
import {SBCollection} from "@/editor/objects/collection";
import {SBElement} from "@/editor/objects";
import {Origin} from "@/editor/objects/origin";


export abstract class NodeParameter {
    readonly value = shallowRef<any>()

    constructor(readonly node: Node, readonly id: string) {
    }

    abstract type: string

    get() {
        if (this.value.value instanceof CompiledExpression)
            return this.value.value.evaluate({})
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

    static vec2(node: Node, id: any, withIndex: boolean = false, defaultValue: Vec2 = Vec2.playfieldCentre()) {
        return new Vec2NodeParameter(node, id, defaultValue);
    }

    getWithElement(ctx: GetWithElementContext) {
        const evalCtx = {
            ...globalFunctions,
            getAttrib(geo: number, idx: number, name: keyof SBElement) {
                return ctx.geo[0].getSprite(idx)[name]
            },
            setAttrib(geo: number, idx: number, name: WritableKeys<SBElement>, value: any) {
                ctx.geo[0].getSprite(idx)[name] = value
            },
        };

        if (this.value.value instanceof CompiledExpression) {
            return this.value.value.evaluate(evalCtx, ctx.el, ctx.idx)
        }
        return this.value.value
    }

    getDependencies(): ExpressionDependency[] {
        return []
    }
}

export interface GetWithElementContext {
    el?: SBElement,
    idx: number,
    geo: SBCollection[]
}

export interface IntParamOptions {
    defaultValue: number
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

    get(): any {
        return Math.floor(super.get())
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

export class Vec2NodeParameter extends NodeParameter {

    type = 'vec2'

    constructor(node: Node, id: string, defaultValue: Vec2 = Vec2.zero(), readonly withIndex: boolean = false) {
        super(node, id);
        this.value.value = defaultValue
    }

    readonly xExpression = shallowRef<CompiledExpression>()

    readonly yExpression = shallowRef<CompiledExpression>()

    get(): any {
        const v = (this.value.value as Vec2).clone()
        if (this.xExpression)
            v.x = this.xExpression.value?.evaluate({})
        if (this.yExpression)
            v.y = this.yExpression.value?.evaluate({})
        return super.get();
    }

    getWithElement(ctx: GetWithElementContext) {
        const v = (this.value.value as Vec2).clone()

        const evalCtx = {
            ...globalFunctions,
            getAttrib(geo: number, idx: number, name: keyof SBElement) {
                return ctx.geo[0].getSprite(idx)[name]
            },
            setAttrib(geo: number, idx: number, name: WritableKeys<SBElement>, value: any) {
                ctx.geo[0].getSprite(idx)[name] = value
            },
        };

        if (this.xExpression)
            v.x = this.xExpression.value?.evaluate(evalCtx, ctx.el, ctx.idx)
        if (this.yExpression)
            v.y = this.yExpression.value?.evaluate(evalCtx, ctx.el, ctx.idx)

        return v;
    }

    set(value: any) {
        super.set(value);
    }

    getXText() {
        if (this.xExpression.value) {
            return this.xExpression.value.source
        }
        return (this.value.value as Vec2Like).x.toString()
    }

    getYText() {
        if (this.yExpression.value) {
            return this.yExpression.value.source
        }
        return (this.value.value as Vec2Like).y.toString()
    }

    setXText(value: string) {
        const expr = compileExpression(value, this.withIndex)
        if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
            this.value.value.x = expr.cachedValue
            this.xExpression.value = undefined
        } else {
            this.xExpression.value = expr
        }
        this.node.markDirty()
    }

    setYText(value: string) {
        const expr = compileExpression(value, this.withIndex)
        if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
            this.value.value.y = expr.cachedValue
            this.yExpression.value = undefined
        } else {
            this.yExpression.value = expr
        }
        this.node.markDirty()
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
        if (this.expression.value) {
            return this.expression.value.source
        }
        return this.get().toString()
    }

    setText(value: string) {
        const expr = compileExpression(value, this.withIndex)
        if (expr.isConstant && expr.source.trim() === expr.cachedValue.toString()) {
            this.value.value = expr.cachedValue
            this.expression.value = undefined
        } else {
            this.expression.value = expr
        }
        this.node.markDirty()
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
}

