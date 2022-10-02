import {NodePath} from "@babel/core";
import {BlockStatement, Identifier} from "@babel/types";
import template from "@babel/template";

const utilsTemplate = template.expression('%%ctx%%.utils.%%util%%')


export function transformUtils(path: NodePath<BlockStatement>, ctx: Identifier) {
    path.traverse({
        MemberExpression: path => {
            if (path.node.object.type === 'Identifier' && path.node.property.type === 'Identifier') {
                const object = path.node.object as Identifier

                if (['Easing', 'Vec2', 'Color'].includes(object.name)) {
                    path.get('object').replaceWith(utilsTemplate({
                        ctx,
                        util: object
                    }))
                }
            }
        },
    })
}