import {NodePath} from "@babel/core";

export class CompilerError {
    constructor(
        readonly path: NodePath,
        readonly message: string,
        readonly hints?: Record<string, string | string[]>
    ) {
    }

    pretty(code: string): string[] {
        const lines: string[] = []
        const styles: string[] = []

        const sourceLines = code.split(/\r?\n/);

        const location = this.path.node.loc!

        const startLine = location.start.line - 1
        const endLine = location.end.line - 1
        const startCol = location.start.column
        const endCol = location.end.column

        sourceLines.slice(startLine, endLine + 1).forEach((line, index) => {
            const curLine = startLine + index
            const lineStart = curLine === startLine ? startCol : 0
            const lineEnd = curLine === endLine ? endCol : line.length


            let formattedLine = ''
            if (lineStart > 0) {
                formattedLine += '%c' + line.substring(0, lineStart)
                styles.push('color: unset')
            }

            formattedLine += '%c' + line.substring(lineStart, lineEnd)
            styles.push('color: tomato')

            if (lineEnd < line.length) {
                formattedLine += '%c' + line.substring(lineEnd, line.length)
                styles.push('color: unset')
            }
            lines.push(formattedLine)

            styles.push('color: tomato')
            lines.push('%c' + ' '.repeat(lineStart) + '^'.repeat(lineEnd - lineStart) + ' '.repeat(line.length - lineStart))
        })
        styles.push('color: tomato')
        lines.push('%c' + this.message)

        if (this.hints) {
            Object.entries(this.hints).forEach(([title, hints]) => {
                lines.push(title + ':')
                if (Array.isArray(hints)) {
                    lines.push(
                        ...hints.map(hint => '  ' + hint)
                    )
                } else {
                    lines.push('  ' + hints)
                }
            })
        }

        return [
            lines.join('\n'),
            ...styles
        ]
    }
}