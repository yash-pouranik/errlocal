
const URBACKEND_API_URL = 'https://api.urbackend.bitbros.in/api/data/error_logs';

export async function syncLog(state) {
    const apiKey = process.env.URBACKEND_API_KEY;
    if (!apiKey) {
        throw new Error("Missing URBACKEND_API_KEY");
    }

    const response = await fetch(URBACKEND_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({
            command: state.command,
            error: state.error,
            hints: JSON.stringify(state.hints), 
            finalExplanation: state.finalExplanation,
            timestamp: state.timestamp
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data._id;
}

export async function fetchHistory() {
    const apiKey = process.env.URBACKEND_API_KEY;
    if (!apiKey) {
        throw new Error("Missing URBACKEND_API_KEY");
    }

    // Fetch all items from 'error_logs' collection
    const response = await fetch(URBACKEND_API_URL, {
        headers: { 'x-api-key': apiKey }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error("Unexpected API response format");
    }

    return data;
}

export async function markSolved(logId, note) {
    const apiKey = process.env.URBACKEND_API_KEY;
    if (!apiKey) {
        throw new Error("Missing URBACKEND_API_KEY");
    }

    // Urbackend PUT /api/data/:collection/:id
    const response = await fetch(`${URBACKEND_API_URL}/${logId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({
            status: "SOLVED",
            solution: note
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
}
