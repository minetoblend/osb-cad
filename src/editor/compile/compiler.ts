import {Visitor, types, NodePath} from "@babel/core";
import {Identifier, Program, Statement, BlockStatement} from "@babel/types";
import {AnalyzeVisitor, AttributeMetadata, ContextAccess} from "@/editor/compile/analyze";
import template from '@babel/template';
import {transformDeleteSprite} from "@/editor/compile/transformDeleteSprite";
import {transformLoop} from "@/editor/compile/transform.loop";
import {transformAttributes} from "@/editor/compile/transform.attribute";
import {transformGlobals} from "@/editor/compile/transform.global";
import {transformFunctions} from "@/editor/compile/transform.functions";
import {transformAddSprite} from "@/editor/compile/transform.add";

export class Compiler {
    private attributes: Map<string, AttributeMetadata>;
    private contextAccessIdentifiers = new Map<string, Identifier>()
    private globalsIdentifiers = new Map<string, Identifier>()
    private staticContextAccess: Map<string, ContextAccess>;
    private accessedGlobals: Set<string>;

    constructor(readonly analyzer: AnalyzeVisitor) {
        this.attributes = analyzer.attributes
        this.staticContextAccess = analyzer.staticContextAccess
        this.accessedGlobals = analyzer.accessedGlobals
    }

    static entryTemplate = template.program('export async function entry (%%ctx%%, %%prefetched%%) { %%body%% }')
    static evaluateContextPathTemplate = template.expression('%%ctx%%.get(%%path%%)')

    private ctxIdentifier!: Identifier
    private idxIdentifier!: Identifier
    private prefetchedIdentifier!: Identifier

    buildSetup(path: NodePath<BlockStatement>) {
        const statements: Statement[] = []

        const contextAccess = [...this.staticContextAccess.entries()]
        if (contextAccess.length > 0)
            statements.push(
                types.variableDeclaration('const', contextAccess.map(([editorPath]) => {
                    const identifier = path.scope.generateUidIdentifier(editorPath.toString())
                    this.contextAccessIdentifiers.set(editorPath, identifier)
                    return types.variableDeclarator(identifier, Compiler.evaluateContextPathTemplate({
                        ctx: this.ctxIdentifier,
                        path: types.stringLiteral(editorPath)
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
        this.prefetchedIdentifier = path.scope.generateUidIdentifier('prefetched')

        const ast = Compiler.entryTemplate({
            ctx: this.ctxIdentifier,
            prefetched: this.prefetchedIdentifier,
            body
        })

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

                    const {
                        currentElementIdentifier,
                        defaultGeoIdentifier
                    } = transformLoop(path, this.idxIdentifier, this.prefetchedIdentifier)

                    transformAttributes(path, this.attributes, defaultGeoIdentifier, this.idxIdentifier, currentElementIdentifier)

                    transformGlobals(path, this.accessedGlobals, this.ctxIdentifier)

                    transformFunctions(path, this.ctxIdentifier)

                    //sprite operations
                    transformAddSprite(path, defaultGeoIdentifier)
                    transformDeleteSprite(path, this.ctxIdentifier, defaultGeoIdentifier)

                    path.pushContainer('body', [
                        types.returnStatement(defaultGeoIdentifier)
                    ])

                    path.skip()
                }
            },
        },
        Identifier: path => {
            if (path.getData('isIdx')) {
                path.setData('isIdx', false)
                path.replaceWith(this.idxIdentifier)
            } else if (path.getData('isGlobal')) {
                path.setData('isGlobal', false)
                path.replaceWith(
                    this.globalsIdentifiers.get(path.node.name.substring(1))!
                )
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

            }
        }
    }


}


function enableUseStrict(path: NodePath<Program>) {
    const node = path.node
    for (const directive of node.directives) {
        if (directive.value.value === "use strict") return;
    }
    path.unshiftContainer("directives", types.directive(types.directiveLiteral("use strict")));
}