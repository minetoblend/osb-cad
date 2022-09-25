import {ExpressionDependency} from "@/editor/compile";

export class MarkDirtyReason {

    expressionDependency?: ExpressionDependency

    private constructor(expressionDependency?: ExpressionDependency) {
        this.expressionDependency = expressionDependency;
    }

    static expressionDependency(dependency: ExpressionDependency) {
        return new MarkDirtyReason(dependency)
    }
}