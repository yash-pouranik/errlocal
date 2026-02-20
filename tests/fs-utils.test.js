import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyFix } from '../src/fs-utils.js';
import fs from 'fs/promises';

vi.mock('fs/promises');
vi.mock('chalk', () => ({
    default: {
        green: vi.fn(),
        red: vi.fn()
    }
}));

describe('fs-utils applyFix', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Stop console logs from cluttering test output
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should throw error if fixAction is missing properties', async () => {
        await expect(applyFix({ filePath: 'file.js' })).rejects.toThrow("Invalid fix action data.");
    });

    it('should replace code correctly preserving indentation', async () => {
        const fakeFile = `function test() {
    let x = 1;
    console.log(x;
}`;
        // Target line is `    console.log(x;` (Line 3, Index 2)
        // Indentation is 4 spaces
        
        vi.mocked(fs.readFile).mockResolvedValue(fakeFile);
        vi.mocked(fs.writeFile).mockResolvedValue();

        const success = await applyFix({
            filePath: 'file.js',
            lineNumber: 3,
            code: 'console.log(x);' // We expect 4 spaces to be prefixed automatically
        });

        expect(success).toBe(true);
        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('file.js'),
            `function test() {
    let x = 1;
    console.log(x);
}`, // Should contain the fixed line with original 4 space indentation
            'utf-8'
        );
    });

    it('should return false if target line is out of bounds', async () => {
         vi.mocked(fs.readFile).mockResolvedValue(`let x = 1;`);
         
         const success = await applyFix({
             filePath: 'file.js',
             lineNumber: 10,
             code: 'let x = 2;'
         });

         expect(success).toBe(false);
    });
});
