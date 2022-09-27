import {NodeDependencyType} from "@/editor/compile";

export class MarkDirtyReason {

    expressionDependency?: NodeDependencyType

    private constructor(expressionDependency?: NodeDependencyType) {
        this.expressionDependency = expressionDependency;
    }

    static expressionDependency(dependency: NodeDependencyType) {
        return new MarkDirtyReason(dependency)
    }
}