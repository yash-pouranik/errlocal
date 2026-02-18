
import { LingoDotDevEngine  } from 'lingo.dev/sdk';

const Lingo = LingoDotDevEngine;

export async function localizeContent(analysis, targetLang) {
    const apiKey = process.env.LINGO_API_KEY;
    if (!apiKey) {
        // Fallback or throw? For now let's throw so CLI handles it
        throw new Error("LINGO_API_KEY not found.");
    }

    const lingo = new Lingo({ apiKey });
    
    // Use localizeObject to translate the entire structure
    return await lingo.localizeObject(analysis, {
        sourceLocale: 'en',
        targetLocale: targetLang
    });
}
