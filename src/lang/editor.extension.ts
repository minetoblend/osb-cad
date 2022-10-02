import * as monaco from 'monaco-editor';

const legend = {
    tokenTypes: [
        'attribute',
        'global',
    ],
    tokenModifiers: []
};

const attributePattern = new RegExp('([fivg])?\\$([a-zA-Z0-9_]+)', 'g');
const globalPattern = new RegExp('_([a-zA-Z0-9_]+)', 'g');

//@ts-ignore
import commonTypes from '!raw-loader!./common.types.d.ts.txt';
import {EditorContext} from "@/editor/ctx/context";

let editorContext: EditorContext | undefined = undefined;

export function setEditorExtensionContext(context: EditorContext) {
    editorContext = context
}

export function initEditorExtension() {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(commonTypes, 'ts:filename/common.d.ts')

    monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: (model, position, context, token) => {
            if (!editorContext)
                return {suggestions: []}
            const word = model.getWordUntilPosition(position);
            const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)

            return {
                suggestions: [
                    {
                        label: 'Current Time',
                        description: 'Inserts the editor\'s current timestamp',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: `${Math.floor(editorContext.time.value)}`,
                        range,
                    }
                ]
            }
        }
    })

    monaco.languages.registerDocumentSemanticTokensProvider('javascript', {
        getLegend() {
            return legend
        },
        provideDocumentSemanticTokens: (model, lastResultId, token) => {
            const lines = model.getLinesContent();

            /** @type {number[]} */
            const data = [];

            let prevLine = 0;
            let prevChar = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                for (let match = null; (match = attributePattern.exec(line));) {

                    let type = 0;
                    let modifier = 0;

                    data.push(
                        // translate line to deltaLine
                        i - prevLine,
                        // for the same line, translate start to deltaStart
                        prevLine === i ? match.index - prevChar : match.index,
                        match[0].length,
                        type,
                        modifier
                    );

                    prevLine = i;
                    prevChar = match.index;
                }

                for (let match = null; (match = globalPattern.exec(line));) {

                    let type = 1;
                    let modifier = 0;

                    data.push(
                        // translate line to deltaLine
                        i - prevLine,
                        // for the same line, translate start to deltaStart
                        prevLine === i ? match.index - prevChar : match.index,
                        match[0].length,
                        type,
                        modifier
                    );

                    prevLine = i;
                    prevChar = match.index;
                }
            }

            return {
                data: new Uint32Array(data),
            };
        },
        releaseDocumentSemanticTokens: function (resultId) {
        }
    })

    monaco.editor.defineTheme('myCustomTheme', {
        base: 'vs-dark',
        inherit: true,
        colors: {},
        rules: [
            {token: 'attribute', foreground: 'ffc74f'},
            {token: 'global', foreground: 'ee594d'},
        ]
    });


}
