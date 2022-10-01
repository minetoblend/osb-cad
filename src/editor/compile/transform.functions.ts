import {globalFunctions} from "@/editor/compile/index";
import {NodePath, types} from "@babel/core";
import {BlockStatement, Identifier} from "@babel/types";

export function transformFunctions(path: NodePath<BlockStatement>, ctxIdentifier: Identifier) {
    path.traverse({
        CallExpression: path => {
            if (path.node.callee.type === 'Identifier') {
                const callee = path.node.callee as Identifier

                if (Object.keys(globalFunctions).includes(callee.name)) {
                    path.get('callee').replaceWith(types.memberExpression(types.memberExpression(ctxIdentifier, types.identifier('functions')), callee))
                }
            }
        }
    })
}