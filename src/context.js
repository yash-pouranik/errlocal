
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

// parse stderr for file path
export async function getErrorContext(stderr) {
    try {
        const lines = stderr.split('\n');
        let match = null;

        // nodejs trace
        const nodeRegex = /\(\s*(?:file:\/\/\/?|)(.*):(\d+):(\d+)\)/;
        
        // python trace
        const pythonRegex = /File "(.*)", line (\d+)/;

        // scan lines
        for (const line of lines) {
            // try node
            let m = line.match(nodeRegex);
            if (m) {
                match = { file: m[1], line: parseInt(m[2]) };
                break;
            }

            // try python
            m = line.match(pythonRegex);
            if (m) {
                match = { file: m[1], line: parseInt(m[2]) };
                break;
            }
        }

        if (!match) return null;

        // resolve path
        const absolutePath = path.resolve(process.cwd(), match.file);

        // check existence
        try {
            await fs.access(absolutePath);
        } catch {
            return null; // file not found
        }

        // read file
        const content = await fs.readFile(absolutePath, 'utf-8');
        const fileLines = content.split('\n');
        
        // extract context
        const startLine = Math.max(0, match.line - 6);
        const endLine = Math.min(fileLines.length, match.line + 5);
        
        const snippet = fileLines.slice(startLine, endLine).map((ln, idx) => {
            const currentLineNum = startLine + idx + 1;
            const isErrorLine = currentLineNum === match.line;
            const prefix = isErrorLine ? '>' : ' ';
            return `${prefix} ${currentLineNum}: ${ln}`;
        }).join('\n');

        return {
            filePath: match.file,
            lineNumber: match.line,
            codeSnippet: snippet
        };

    } catch (error) {
        // debug log
        console.error(chalk.gray(`debug: Failed to extract context: ${error.message}`));
        return null;
    }
}
