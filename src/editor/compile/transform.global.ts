import {NodePath, types} from "@babel/core";
import {BlockStatement, Identifier, VariableDeclarator} from "@babel/types";
import template from "@babel/template";

const getQueryTemplate = template.expression('%%ctx%%.getQueryValue(%%name%%)')

export function transformGlobals(path: NodePath<BlockStatement>, globals: Set<string>, ctxIdentifier: Identifier) {
    if (globals.size === 0)
        return;

    const globalsIdentifiers = new Map<string, Identifier>()

    const declarators: VariableDeclarator[] = []
    globals.forEach(name => {
        const identifier = path.scope.generateUidIdentifier(name)
        globalsIdentifiers.set(name, identifier);
        declarators.push(types.variableDeclarator(identifier, getQueryTemplate({
            ctx: ctxIdentifier,
            name: types.stringLiteral(name),
        })))
    })
    path.unshiftContainer('body', [
        types.variableDeclaration('const', declarators)
    ])

    path.traverse({
        Identifier: path => {
            if (path.getData('isGlobal')) {
                path.setData('isGlobal', false)
                console.log(path.node.name.substring(1))
                path.replaceWith(
                    globalsIdentifiers.get(path.node.name.substring(1))!
                )
            }
        }
    })

}