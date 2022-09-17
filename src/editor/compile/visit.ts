import {NodePath, types, Visitor} from "@babel/core";
import {AssignmentExpression, Identifier, CallExpression} from "@babel/types";
import {ExpressionDependency} from "@/editor/compile/index";



export function visitIdentifier(path: NodePath<Identifier>, allowWrite: boolean, dependencies: Set<ExpressionDependency>, attribtues: Set<string>) {
    if (path.node.name === 'idx') {
        dependencies.add(ExpressionDependency.ElementIndex)
        return;
    }

    if (path.node.name.startsWith('_')) {
        if (path.parent.type === 'AssignmentExpression' && path.key === 'left') {
            throw new Error('Cannot write to constants.')
        }

        path.replaceWith(types.memberExpression(
            types.identifier('ctx'),
            types.identifier(path.node.name.substring(1))
        ))
        return;
    }

    if (path.node.name.startsWith('$')) {
        attribtues.add(path.node.name.substring(1))

        if (path.parent.type === 'AssignmentExpression' && path.key === 'left') {
            if (!allowWrite)
                throw new Error('Cannot write to attributes in Expression.')

            path.parentPath.replaceWith(types.callExpression(
                types.identifier('setAttrib'),
                [
                    types.identifier('idx'),
                    types.stringLiteral(path.node.name.substring(1)),
                    (path.parent as AssignmentExpression).right,
                ]
            ))
        }

        path.replaceWith(types.callExpression(
            types.identifier('getAttrib'),
            [
                types.identifier('idx'),
                types.stringLiteral(path.node.name.substring(1))
            ]
        ))
    }

}

export function visitCallExpression(path: NodePath<CallExpression>, builtinMethods: Set<string>): void {
    if (path.get('callee').isIdentifier()) {
        const name = (path.node.callee as Identifier).name
        if (!builtinMethods.has(name)) {
            throw new Error ('Unknown function ' + name)
        }
        path.replaceWith(
            types.callExpression(
                types.memberExpression(
                    types.identifier('ctx'),
                    path.node.callee as Identifier,
                ),

                path.node.arguments
            )
        );
    } else {

    }
}

export function createExpressionVisitor(attributes: Set<string>, dependencies: Set<ExpressionDependency>, builtinMethods: Set<string>): Visitor {
    return {
        Identifier: path => visitIdentifier(path, false, dependencies, attributes),
        CallExpression: path => visitCallExpression(path, builtinMethods)
    }
}

export function createCodeBlockVisitor(attributes: Set<string>, dependencies: Set<ExpressionDependency>, builtinMethods: Set<string>): Visitor {
    return {
        Identifier: path => visitIdentifier(path, true, dependencies, attributes),
        CallExpression: path => visitCallExpression(path, builtinMethods)
    }
}