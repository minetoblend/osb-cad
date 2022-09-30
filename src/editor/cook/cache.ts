import {SBCollection} from "@/editor/objects/collection";
import {CookResult} from "@/editor/node/cook.context";

export class NodeCache {

    cachedValue?: SBCollection[]

    addResult(result: CookResult) {
        //console.log(result)
    }

    erase() {
        this.cachedValue = undefined
    }
}