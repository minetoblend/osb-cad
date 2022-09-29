import {NodePath, Visitor} from "@babel/core";
import {AssignmentExpression, Identifier} from "@babel/types";
import {AttributeType} from "@/editor/objects/attribute";
import {CompilerError} from "@/editor/compile/error";
import {EditorContext} from "@/editor/ctx/context";
import {EditorPath as EditorNodePath} from '@/editor/node/path'

export class AnalyzeVisitor {

    constructor(readonly ctx: EditorContext, readonly nodePath: EditorNodePath) {
    }

    readonly attributes = new Map<string, AttributeMetadata>()
    readonly errors: CompilerError[] = []

    readonly staticContextAccess = new Map<string, ContextAccess>()

    addAttribute(path: NodePath, name: string, type?: AttributeType) {
        const attr = this.attributes.get(name)
        if (attr) {
            attr.markType(path, this.errors, type)
            return attr
        } else {
            const newAttr = new AttributeMetadata(name)
            newAttr.markType(path, this.errors, type)
            this.attributes.set(name, newAttr)
            return newAttr
        }
    }

    addContextAccess(type: ValueType, path?: EditorNodePath): ContextAccess {
        if (path) {
            const existing = this.staticContextAccess.get(path.toString())
            if (existing) {
                if (existing.type !== type && (existing.type !== ValueType.Unknown && type !== ValueType.Unknown)) {
                    throw new Error()
                }
                return existing
            } else {
                const access = new ContextAccess(type, path)
                this.staticContextAccess.set(path.toString(), access)
                return access
            }
        } else {
            return new ContextAccess(type)
        }

    }

    readonly visitor: Visitor = {
        Identifier: (path: NodePath<Identifier>) => {
            const node = path.node

            const isTypedAttribute = node.name.charAt(1) === '$'
            const isUntypedAttribute = node.name.charAt(0) === '$'

            if (isTypedAttribute || isUntypedAttribute) {
                let type: AttributeType | undefined = undefined
                const attributeName = isTypedAttribute ? node.name.substring(2) : node.name.substring(1)

                if (isTypedAttribute) {
                    type = node.name.charAt(0) as AttributeType

                    if (!Object.values(AttributeType).some(it => it === type))
                        type = undefined

                    if (!type) {
                        const err = new CompilerError(path, `Unknown attribute type in ${node.name.charAt(0)}$${node.name.substring(2)}.`, {
                                'Available node types': Object.entries(AttributeType).map(it => `${it[1]} (${it[0]})`)
                            }
                        )
                        this.errors.push(err)
                    }
                }

                const isWriting = path.parent.type === 'AssignmentExpression' && path.key === 'left'

                const attribute = this.addAttribute(path, attributeName, type)

                if (isWriting)
                    attribute.hasWriteAccess = true
                else
                    attribute.hasReadAccess = true

                if (isWriting) {

                    const valueNode = (path.parentPath as NodePath<AssignmentExpression>).get('right')
                    const value = valueNode.evaluate()
                    if (value.confident) {
                        if (typeof value.value === 'number') {
                            if (attribute.type !== AttributeType.Int && attribute.type !== AttributeType.Float) {
                                attribute.markType(path, this.errors, AttributeType.Float)
                            }
                        }
                    }
                }


                path.setData('type', 'attribute')
                path.setData('attribute', attribute)
                path.setData('operation', isWriting ? 'write' : 'read')
                return;
            }

            if (node.name === 'idx') {
                path.setData('isIdx', true)
            }
        },
        CallExpression: path => {
            if (path.node.callee.type === 'Identifier') {
                const name = (path.node.callee as Identifier).name

                if (['chf', 'chv', 'chi'].includes(name)) {
                    let type: ValueType
                    const args = path.get('arguments')
                    if (args.length === 0) {
                        this.errors.push(new CompilerError(path, `${name}() must be given a path`))
                        return;
                    }

                    switch (name) {
                        case 'chf':
                            type = ValueType.Float;
                            break;
                        case 'chi':
                            type = ValueType.Int;
                            break;
                        case 'chv':
                            type = ValueType.Vec2;
                            break;
                        default:
                            throw new CompilerError(path, 'Unknown type')
                    }

                    const pathArgument = args[0]
                    const evaluatedPath = pathArgument.evaluate()

                    let metadata: ContextAccess
                    if (evaluatedPath.confident && typeof evaluatedPath.value === 'string') {
                        metadata = this.addContextAccess(type, this.nodePath.resolve(evaluatedPath.value))
                    } else {
                        metadata = this.addContextAccess(type)
                    }
                    path.setData('type', 'contextAccess')
                    path.setData('metadata', metadata)
                }
            }
        },
        Program: {
            exit: () => {
                this.attributes.forEach(attribute => {
                    if (!attribute.type) {
                        attribute.paths.forEach(p => {
                            this.errors.push(new CompilerError(p, `Tried using attribute $${attribute.name} with unknown type. Please specify a type.`))
                        })
                    }
                })
            }
        }
    }
}


export class AttributeMetadata {
    constructor(readonly name: string, public type?: AttributeType) {
        if (builtinAttributes[name]) {
            this.builtin = true
            this.type = builtinAttributes[name]
        } else {
            this.builtin = false
        }
    }

    builtin: boolean

    markType(path: NodePath, errors: CompilerError[], type?: AttributeType) {
        this.paths.push(path)

        if (!type)
            return
        if (this.type && this.type !== type) {
            console.log(type, AttributeType)
            errors.push(new CompilerError(path, `Tried using attribute  $${this.name} as ${
                Object.entries(AttributeType).find(it => it[1] === type)![0]
            }. It has been previously declared as ${
                Object.entries(AttributeType).find(it => it[1] === this.type)![0]
            }.`))
        } else {
            this.type = type
        }
    }

    hasWriteAccess = false
    hasReadAccess = false

    paths: NodePath[] = []
}

const builtinAttributes: Record<string, AttributeType> = {
    pos: AttributeType.Vec2,
    scale: AttributeType.Vec2,
    rotation: AttributeType.Float,
    origin: AttributeType.Int,
    sprite: AttributeType.Int,
}

export class ContextAccess {
    constructor(
        readonly type: ValueType,
        readonly path?: EditorNodePath,
    ) {
    }

}

export enum ValueType {
    Unknown,
    Int,
    Float,
    String,
    Vec2,
    Sprite,
    Origin,
}