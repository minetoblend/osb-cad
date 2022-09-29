import {SBCollection} from "@/editor/objects/collection";
import {GlobalFunctions, globalFunctions, GlobalValues} from "@/editor/compile/index";
import {AttributeType} from "@/editor/objects/attribute";


export function createStatementBaseContext(globals: GlobalValues): StatementBaseContext {
    return {
        ...globalFunctions,
        ...globals,
    }
}

export function createStatementContext(baseCtx: StatementBaseContext, inputs: SBCollection[]): StatementContext {
    const ctx = baseCtx as StatementContext

    ctx.getAttrib = (geo: number, index: number, name: string, type?: AttributeType) => {
        return inputs[geo]?.getAttribute(name, index, type)
    }

    ctx.setAttrib = (geo: number, index: number, name: string, value: any, type?: AttributeType) => {
        return inputs[geo]?.setAttribute(name, index, value, type)
    }

    return ctx
}

export interface StatementContext extends StatementBaseContext {
    getAttrib(geo: number, index: number, name: string): any

    setAttrib(geo: number, index: number, name: string, value: any): void

}

export interface StatementBaseContext extends GlobalFunctions, GlobalValues {

}