
import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), '.errlocal-state.json');

export async function saveState(data) {
    await fs.writeFile(STATE_FILE, JSON.stringify(data, null, 2));
}

export async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null; // No state exists
    }
}
