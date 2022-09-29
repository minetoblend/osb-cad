import {CookContext} from "@/editor/node/cook.context";

export interface WrangleModule {
    entry(ctx: CookContext): any
}

export interface ExpressionModule {

}