import {NodePath, types, Visitor} from "@babel/core";
import {AssignmentExpression, CallExpression, Identifier} from "@babel/types";
import {ExpressionDependency} from "@/editor/compile/index";


export function visitIdentifier(path: NodePath<Identifier>, allowWrite: boolean, withIndex: boolean, dependencies: Set<ExpressionDependency>, attribtues: Set<string>) {
    if (path.node.name === 'idx') {
        if (path.node.start !== 10) { //skip the index being passed into the method
            dependencies.add(ExpressionDependency.ElementIndex)
            if (!withIndex)
                throw Error('Cannot access individual sprites')
            return;
        }
    }

    if (path.node.name === 'el') {
        if (path.node.start !== 6) { //skip the index being passed into the method
            dependencies.add(ExpressionDependency.ElementIndex)
            if (!withIndex)
                throw Error('Cannot access individual sprites')
            return;
        }
    }

    if (path.node.name.startsWith('_')) {
        if (path.parent.type === 'AssignmentExpression' && path.key === 'left') {
            throw new Error('Cannot write to constants.')
        }

        if (path.node.name.substring(1) === 'TIME') {
            dependencies.add(ExpressionDependency.Time)
        }


        path.replaceWith(types.memberExpression(
            types.identifier('ctx'),
            types.identifier(path.node.name.substring(1))
        ))
        return;
    }

    if (path.node.name.startsWith('$')) {
        attribtues.add(path.node.name.substring(1))
        if (!withIndex)
            throw Error('Cannot access individual sprites')
        if (path.parent.type === 'AssignmentExpression' && path.key === 'left') {
            if (!allowWrite)
                throw new Error('Cannot write to attributes in Expression.')

            path.parentPath.replaceWith(types.callExpression(
                types.identifier('setAttrib'),
                [
                    types.numericLiteral(0),
                    types.identifier('idx'),
                    types.stringLiteral(path.node.name.substring(1)),
                    (path.parent as AssignmentExpression).right,
                ]
            ))
        }

        path.replaceWith(types.callExpression(
            types.identifier('getAttrib'),
            [
                types.numericLiteral(0),
                types.identifier('idx'),
                types.stringLiteral(path.node.name.substring(1))
            ]
        ))
        return;
    }

    if (path.node.name.charAt(1) === '$') {
        const typeLetter = path.node.name.charAt(0)
        let type = {
            i: 'numuber',
            v: 'vec2'
        }[typeLetter]
        if (!type)
            throw new Error('unknown parameter type')


        attribtues.add(path.node.name.substring(1))
        if (!withIndex)
            throw Error('Cannot access individual sprites')
        if (path.parent.type === 'AssignmentExpression' && path.key === 'left') {
            if (!allowWrite)
                throw new Error('Cannot write to attributes in Expression.')

            path.parentPath.replaceWith(types.callExpression(
                types.identifier('setAttrib'),
                [
                    types.numericLiteral(0),
                    types.identifier('idx'),
                    types.stringLiteral(path.node.name.substring(2)),
                    (path.parent as AssignmentExpression).right,
                    types.stringLiteral(type)
                ]
            ))
        }

        path.replaceWith(types.callExpression(
            types.identifier('getAttrib'),
            [
                types.numericLiteral(0),
                types.identifier('idx'),
                types.stringLiteral(path.node.name.substring(2)),
                types.stringLiteral(type)
            ]
        ))
        return;
    }

}

export function visitCallExpression(path: NodePath<CallExpression>, builtinMethods: Set<string>): void {
    if (path.get('callee').isIdentifier()) {
        const name = (path.node.callee as Identifier).name
        if (!builtinMethods.has(name)) {
            throw new Error('Unknown function ' + name)
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

export function createExpressionVisitor(withIndex: boolean, attributes: Set<string>, dependencies: Set<ExpressionDependency>, builtinMethods: Set<string>): Visitor {
    return {
        Identifier: path => visitIdentifier(path, false, withIndex, dependencies, attributes),
        CallExpression: path => visitCallExpression(path, builtinMethods)
    }
}

export function createCodeBlockVisitor(attributes: Set<string>, dependencies: Set<ExpressionDependency>, builtinMethods: Set<string>): Visitor {
    return {
        Identifier: path => visitIdentifier(path, true, true, dependencies, attributes),
        CallExpression: path => visitCallExpression(path, builtinMethods)
    }
}