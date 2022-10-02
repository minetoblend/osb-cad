import {NodePath, types} from "@babel/core";
import {BlockStatement, Identifier} from "@babel/types";

export function transformCommands(path: NodePath<BlockStatement>, currentElement: Identifier) {
    path.traverse({
        CallExpression: path => {
            if (path.node.callee.type === 'Identifier') {
                const nameNode = path.node.callee as Identifier

                if (['move', 'scale', 'rotate', 'fade', 'color', 'scaleVec'].includes(nameNode.name)) {
                    path.replaceWith(
                        types.callExpression(
                            types.memberExpression(currentElement, nameNode),
                            path.node.arguments
                        )
                    )
                }
            }
        }
    })
}