import {CompiledExpression, compileExpression, compileStatements} from "@/editor/compile";
import {Node} from "@/editor/node/index";


export abstract class NodeParameter {
    value?: any

    constructor(readonly node: Node, readonly id: string) {
    }

    abstract type: string

    get() {
        if (this.value instanceof CompiledExpression)
            return this.value.evaluate({})

        return this.value
    }

    set(value: any) {
        this.value = value
        this.node.markDirty()
    }

    setExpression(value: any) {
        this.value = compileExpression(value)
    }

    static float(node: Node, id: string, defaultValue: number) {
        return new FloatNodeParameter(node, id, defaultValue)
    }

    static code(node: Node, id: string) {
        return new CodeNodeParameter(node, id)
    }
}

export class FloatNodeParameter extends NodeParameter {

    constructor(node: Node, id: string, defaultValue: number) {
        super(node, id);
        this.value = defaultValue
    }

    type = 'float'
}


export class CodeNodeParameter extends NodeParameter {

    constructor(node: Node, id: string) {
        super(node, id);
        this.value = ''
    }

    type = 'code'

    compiledCode = ''

    set(value: any) {
        super.set(value);

        const compiledCode = compileStatements(value)
        console.log(compiledCode)
    }
}

