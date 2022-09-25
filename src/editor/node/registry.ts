import {Node} from "@/editor/node/index";
import {EditorContext} from "@/editor/ctx/context";
import {shallowReactive} from "vue";
import {ShallowReactive} from "@vue/reactivity";

export class NodeRegistry {

    private constructor(categories: string[] = [], private readonly parent?: NodeRegistry) {
        this.categories = shallowReactive(new Set<string>(categories))
    }

    private readonly categories: ShallowReactive<Set<string>>
    private readonly nodes = shallowReactive(new Map<string, NodeMetadata>())

    static readonly element = new NodeRegistry([
        'general',
        'objects',
        'commands',
        'animation',
    ])

    static readonly simulation = new NodeRegistry([
        'simulation'
    ], NodeRegistry.element)

    register(name: string, node: NodeMetadata) {
        this.nodes.set(name, node)
        if (!this.categories.has(node.category)) {
            this.categories.add(node.category)
        }
    }

    getNodeType(type: string): NodeMetadata | null {
        return this.nodes.get(type) ?? this.parent?.getNodeType(type) ?? null
    }

    createNode(ctx: EditorContext, type: string): Node | null {
        const metadata = this.getNodeType(type)
        if (metadata) {
            return new metadata.nodeConstructor(ctx)
        }
        return null
    }

    getNodeTypes(): NodeMetadata[] {
        if (this.parent)
            return [...this.nodes.values(), ...this.parent.getNodeTypes()]
        return [...this.nodes.values()]
    }

    getNodeCategories(): string[] {
        if (this.parent) {
            const categories = new Set<string>(this.categories)
            this.parent.getNodeCategories().forEach(category => categories.add(category))
            return [...categories]
        }
        return [...this.categories.values()];
    }

    getNodesInCategory(category: string) {
        return [...this.getNodeTypes()].filter(it => it.category === category)
    }
}

export function RegisterNode(label: string, icon: [string, string], category?: string, type: keyof typeof NodeRegistry = 'element'): ClassDecorator {
    return (target) => {
        console.log(target.name)
        NodeRegistry[type].register(target.name, new NodeMetadata(
            target.name,
            target as unknown as Constructor<Node>,
            label,
            icon,
            category
        ))
    }
}

export class NodeMetadata {
    constructor(
        readonly type: string,
        readonly nodeConstructor: Constructor<Node>,
        readonly label: string,
        readonly icon: [string, string],
        readonly category: string = 'general'
    ) {
    }
}   