import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveState, loadState } from '../src/state.js';
import fs from 'fs/promises';
import path from 'path';

vi.mock('fs/promises');

describe('state management', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should save state correctly to .errlocal-state.json', async () => {
        const mockData = { command: 'test', error: 'boom' };
        
        // Mock successful write
        vi.mocked(fs.writeFile).mockResolvedValue(true);

        await saveState(mockData);

        expect(fs.writeFile).toHaveBeenCalledWith(
            path.join(process.cwd(), '.errlocal-state.json'),
            JSON.stringify(mockData, null, 2)
        );
    });

    it('should load state if file exists', async () => {
        const mockData = { command: 'test', error: 'boom' };
        
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockData));

        const result = await loadState();
        expect(result).toEqual(mockData);
    });

    it('should return null if state file does not exist', async () => {
        vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

        const result = await loadState();
        expect(result).toBeNull();
    });
});
