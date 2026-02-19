
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export async function applyFix(fixAction) {
    if (!fixAction || !fixAction.filePath || !fixAction.lineNumber || !fixAction.code) {
        throw new Error("Invalid fix action data.");
    }

    const filePath = path.resolve(fixAction.filePath);
    
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        
        // lines are 0-indexed, lineNumber is 1-indexed
        const targetIndex = fixAction.lineNumber - 1;

        if (targetIndex < 0 || targetIndex >= lines.length) {
            throw new Error(`Line number ${fixAction.lineNumber} is out of bounds for file ${filePath}`);
        }

        const originalLine = lines[targetIndex];
        
        // Preserve indentation
        const indentation = originalLine.match(/^\s*/)[0];
        const newLine = indentation + fixAction.code.trim();

        lines[targetIndex] = newLine;
        
        await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
        console.log(chalk.green(`\n✅ Applied fix to ${path.basename(filePath)}:${fixAction.lineNumber}`));
        return true;

    } catch (err) {
        console.error(chalk.red(`\n❌ Failed to apply fix: ${err.message}`));
        return false;
    }
}
