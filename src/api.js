const URBACKEND_SCHEMA_URL = 'https://api.urbackend.bitbros.in/api/schemas/error_logs';
const URBACKEND_API_URL = 'https://api.urbackend.bitbros.in/api/data/error_logs';

async function ensureSchema(apiKey) {
    try {
        const checkResponse = await fetch(URBACKEND_SCHEMA_URL, {
            headers: { 'x-api-key': apiKey }
        });

        if (checkResponse.ok) {
            // Schema exists, do nothing
            return;
        }

        // Schema doesn't exist, create it
        if (checkResponse.status === 404 || !checkResponse.ok) {
            const createResponse = await fetch('https://api.urbackend.bitbros.in/api/schemas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    name: "error_logs",
                    fields: [
                        { name: "command", type: "string", required: true },
                        { name: "error", type: "string", required: true },
                        { name: "hints", type: "string" },
                        { name: "finalExplanation", type: "string" },
                        { name: "timestamp", type: "date", required: true },
                        { name: "status", type: "string" },
                        { name: "solution", type: "string" }
                    ]
                })
            });

            if (!createResponse.ok) {
                console.warn(`[AutoSchema] Failed to create schema: ${await createResponse.text()}`);
            } else {
                console.log(`\n[AutoSchema] Created 'error_logs' collection in UrBackend successfully!`);
            }
        }
    } catch (err) {
        // Just log warning, don't crash the sync process
        console.warn(`[AutoSchema] Check/Create failed: ${err.message}`);
    }
}

export async function syncLog(state) {
    const apiKey = process.env.URBACKEND_API_KEY;
    if (!apiKey) {
        throw new Error("Missing URBACKEND_API_KEY");
    }

    // Ensure schema exists before pushing data
    await ensureSchema(apiKey);

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
            timestamp: state.timestamp,
            status: "OPEN" // Default status
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

    // fetch error logs
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

    // update log status
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
