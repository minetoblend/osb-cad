import {CompiledExpression, compileExpression, compileStatements} from "@/editor/compile";


export abstract class NodeParameter {
    id: string
    value?: any

    constructor(id: string) {
        this.id = id;
    }

    abstract type: string

    get() {
        if (this.value instanceof CompiledExpression)
            return this.value.evaluate({})

        return this.value
    }

    set(value: any) {
        this.value = value
    }

    setExpression(value: any) {
        this.value = compileExpression(value)
    }

    static float(id: string, defaultValue: number) {
        return new FloatNodeParameter(id, defaultValue)
    }

    static code(id: string) {
        return new CodeNodeParameter(id)
    }
}

export class FloatNodeParameter extends NodeParameter {

    constructor(id: string, defaultValue: number) {
        super(id);
        this.value = defaultValue
    }

    type = 'float'
}


export class CodeNodeParameter extends NodeParameter {

    constructor(id: string) {
        super(id);
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

