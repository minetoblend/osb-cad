import {CookJobContext} from "@/editor/cook/context";
import {SBCollection} from "@/editor/objects/collection";

export interface WrangleModule {
    entry(ctx: CookJobContext, prefetched: SBCollection[]): Promise<any>
}

export interface ExpressionModule {

}