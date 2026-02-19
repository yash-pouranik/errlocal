
import { LingoDotDevEngine  } from 'lingo.dev/sdk';

const Lingo = LingoDotDevEngine;

export async function localizeContent(analysis, targetLang) {
    const apiKey = process.env.LINGO_API_KEY;
    if (!apiKey) {
        throw new Error("LINGO_API_KEY not found.");
    }

    const lingo = new Lingo({ apiKey });
    
    // Extract fixAction to prevent translation of code
    const { fixAction, ...rest } = analysis;

    // Use localizeObject to translate the rest
    const localizedRest = await lingo.localizeObject(rest, {
        sourceLocale: 'en',
        targetLocale: targetLang
    });

    return { ...localizedRest, fixAction };
}
