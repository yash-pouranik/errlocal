
import { Groq } from 'groq-sdk';

export async function analyzeError(errorOutput, command) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY not found in environment variables.");
    }

    const groq = new Groq({ apiKey });

    const prompt = `
    You are an expert developer assistant.
    Analyze the following error output from the command "${command}".
    
    Provide your response in strict JSON format with the following structure:
    {
        "errorType": "The type of error (e.g., TypeError, SyntaxError)",
        "likelyCause": "A brief explanation of why this happened",
        "suggestedFix": "A specific code fix suggestion",
        "confidence": "Low, Medium, or High",
        "hints": [
            "Hint 1: A brief, high-level pointer (e.g., check assumptions).",
            "Hint 2: A more specific pointer (e.g., check async/await).",
            "Hint 3: A very specific clue about the code logic."
        ],
        "finalExplanation": "A detailed explanation of the error and how to fix it."
    }

    Error Output:
    ${errorOutput}
    `;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that outputs JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
}
