import {CookJobContext} from "@/editor/cook/context";

export interface WrangleModule {
    entry(ctx: CookJobContext): Promise<any>
}

export interface ExpressionModule {

}