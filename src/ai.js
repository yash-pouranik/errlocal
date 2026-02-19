
import { Groq } from 'groq-sdk';

export async function analyzeError(errorOutput, command, codeContext = null) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY not found in environment variables.");
    }

    const groq = new Groq({ apiKey });

    let contextSection = "";
    if (codeContext) {
        contextSection = `
    Referenced Code (${codeContext.filePath}:${codeContext.lineNumber}):
    \`\`\`
    ${codeContext.codeSnippet}
    \`\`\`
        `;
    }

    const prompt = `
    You are an expert developer assistant.
    Analyze the following error output from the command "${command}".
    ${contextSection}
    
    Provide your response in strict JSON format with the following structure:
    {
        "errorType": "The type of error (e.g., TypeError, SyntaxError)",
        "likelyCause": "A brief explanation of why this happened",
        "confidence": "Low, Medium, or High",
        "fixAction": {
             "type": "replace_line",
             "filePath": "The absolute file path if known from context, otherwise relative",
             "lineNumber": 123,
             "code": "The exact new line of code to replace the error line with (no markdown)",
             "description": "Short description of what this fix does"
        },
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
