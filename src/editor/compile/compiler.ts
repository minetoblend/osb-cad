import {Visitor, types, NodePath} from "@babel/core";
import {Identifier, Program, Statement, BlockStatement, AssignmentExpression} from "@babel/types";
import {AnalyzeVisitor, AttributeMetadata, ContextAccess} from "@/editor/compile/analyze";
import template from '@babel/template';
import {globalFunctions} from "@/editor/compile/index";

export class Compiler {
    private attributes: Map<string, AttributeMetadata>;
    private attributeIdentifiers = new Map<string, Identifier>()
    private contextAccessIdentifiers = new Map<string, Identifier>()
    private staticContextAccess: Map<string, ContextAccess>;

    constructor(analyzer: AnalyzeVisitor) {
        this.attributes = analyzer.attributes
        this.staticContextAccess = analyzer.staticContextAccess
        console.log(this.attributes)
    }

    static entryTemplate = template.program('export function entry (%%ctx%%) { %%body%% }')
    static getAttributeContainerTemplate = template.expression('%%geo%%.getOrCreateAttributeContainer(%%attributeName%%, %%attributeType%%)')
    static fetchInputTemplate = template.expression('%%ctx%%.fetchInput()')
    static loopTemplate = template.statements('for (var %%idx%% = 0; %%idx%% < %%geo%%.length; %%idx%%++) { %%body%% }')
    static getElementTemplate = template.expression('%%geo%%.el(%%idx%%)')
    static evaluateContextPathTemplate = template.expression('%%ctx%%.get(%%path%%)')

    private ctxIdentifier!: Identifier
    private defaultGeoIdentifier!: Identifier
    private idxIdentifier!: Identifier
    private currentElementIdentifier!: Identifier

    get globalFunctions() {
        return globalFunctions
    }

    buildAttributeDeclarator(path: NodePath, attribute: AttributeMetadata) {
        const identifier = path.scope.generateUidIdentifier(attribute.name)

        this.attributeIdentifiers.set(attribute.name, identifier)

        return types.variableDeclarator(identifier, Compiler.getAttributeContainerTemplate({
            geo: this.defaultGeoIdentifier,
            attributeName: types.stringLiteral(attribute.name),
            attributeType: attribute.type ? types.stringLiteral(attribute.type) : undefined
        }))
    }

    buildSetup(path: NodePath<BlockStatement>) {
        const statements: Statement[] = []

        this.defaultGeoIdentifier = path.scope.generateUidIdentifier('geo')

        statements.push(
            types.variableDeclaration('const', [
                types.variableDeclarator(this.defaultGeoIdentifier!, Compiler.fetchInputTemplate({ctx: this.ctxIdentifier}))
            ])
        )

        const attributes = [...this.attributes.values()].filter(it => !it.builtin)
        if (attributes.length > 0) {
            statements.push(
                types.variableDeclaration('const',
                    attributes.map(attribute => this.buildAttributeDeclarator(path, attribute))
                )
            )
        }

        const contextAccess = [...this.staticContextAccess.entries()]
        if (contextAccess.length > 0)
            statements.push(
                types.variableDeclaration('const', contextAccess.map(([nodePath]) => {
                    const identifier = path.scope.generateUidIdentifier(nodePath.toString())
                    this.contextAccessIdentifiers.set(nodePath, identifier)
                    return types.variableDeclarator(identifier, Compiler.evaluateContextPathTemplate({
                        ctx: this.ctxIdentifier,
                        path: types.stringLiteral(nodePath)
                    }))
                }))
            )

        return statements
    }


    buildRunner(path: NodePath<Program>) {
        if (path.getData('transformed'))
            return;
        const {body} = path.node

        this.ctxIdentifier = path.scope.generateUidIdentifier('ctx')

        const ast = Compiler.entryTemplate({ctx: this.ctxIdentifier, body})

        const [newPath] = path.replaceWith(ast)
        newPath.setData('transformed', true)
        const runnerBody = path.get('body.0.declaration.body') as NodePath<BlockStatement>

        runnerBody.setData('isRunner', true)
    }

    readonly visitor: Visitor = {
        Program: {
            enter:
                path => {
                    this.buildRunner(path)
                    enableUseStrict(path)
                }
        },
        BlockStatement: {
            enter: path => {
                if (path.getData('isRunner')) {
                    path.setData('isRunner', false)

                    this.idxIdentifier = path.scope.generateUidIdentifier('i')

                    const {body} = path.node

                    const setup = this.buildSetup(path)

                    if ([...this.attributes.values()].some(it => it.builtin)) {
                        this.currentElementIdentifier = path.scope.generateUidIdentifier('el')
                        body.unshift(types.variableDeclaration('const', [
                            types.variableDeclarator(this.currentElementIdentifier,
                                Compiler.getElementTemplate({
                                    geo: this.defaultGeoIdentifier,
                                    idx: this.idxIdentifier,
                                }))
                        ]))
                    }

                    path.replaceWith(types.blockStatement([
                        ...setup,
                        ...Compiler.loopTemplate({
                            idx: this.idxIdentifier,
                            geo: this.defaultGeoIdentifier,
                            body,
                        }),
                        types.returnStatement(this.defaultGeoIdentifier)
                    ]))
                }
            }
        },
        Identifier: path => {
            const type = path.getData('type')
            if (type === 'attribute') {
                const attribute = path.getData('attribute') as AttributeMetadata
                const operation = path.getData('operation') as 'read' | 'write'

                if (attribute.builtin) {
                    this.buildBuiltinAttributeAccess(path, attribute)
                } else if (operation === "write") {
                    this.buildAttributeWrite(path, attribute)
                } else {
                    this.buildAttributeRead(path, attribute)
                }
            }
            if (path.getData('isIdx')) {
                path.setData('isIdx', false)
                path.replaceWith(this.idxIdentifier)
            }
        },
        CallExpression: path => {
            if (path.getData('type') === 'contextAccess') {
                path.setData('type', undefined)

                /*

            const metadata = path.getData('metadata') as ContextAccess
            if (metadata.path) {
                const identifier = this.contextAccessIdentifiers.get(metadata.path.toString())!
                path.replaceWith(identifier)
            } else {
                path.replaceWith(types.callExpression(
                    types.memberExpression(this.ctxIdentifier,
                        types.identifier('get')),
                    path.node.arguments.slice(0, 2)
                ))
            }


                 */
            } else {
                if (path.node.callee.type === 'Identifier') {
                    path.get('callee').replaceWith(types.memberExpression(types.memberExpression(this.ctxIdentifier, types.identifier('functions')), path.node.callee))
                }
            }
        }
    }

    buildBuiltinAttributeAccess(path: NodePath<Identifier>, metadata: AttributeMetadata) {
        path.replaceWith(types.memberExpression(this.currentElementIdentifier, types.identifier('_' + metadata.name)))
    }

    buildAttributeWrite(path: NodePath<Identifier>, metadata: AttributeMetadata) {
        path.parentPath.assertAssignmentExpression()

        path.parentPath.replaceWith(types.callExpression(
            types.memberExpression(
                this.attributeIdentifiers.get(metadata.name)!,
                types.identifier('setValue')
            ),
            [
                this.idxIdentifier,
                (path.parent as AssignmentExpression).right,
            ]
        ))
    }

    buildAttributeRead(path: NodePath<Identifier>, metadata: AttributeMetadata) {
        path.replaceWith(types.callExpression(
            types.memberExpression(
                this.attributeIdentifiers.get(metadata.name)!,
                types.identifier('getValue')
            ),
            [this.idxIdentifier]
        ))
    }
}


function enableUseStrict(path: NodePath<Program>) {
    const node = path.node
    for (const directive of node.directives) {
        if (directive.value.value === "use strict") return;
    }
    path.unshiftContainer("directives", types.directive(types.directiveLiteral("use strict")));
}