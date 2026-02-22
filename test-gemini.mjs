import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: './portfolio/.env' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = "You are a helpful assistant.";

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: 'Hello' }] }
            ],
            config: {
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                temperature: 0.7,
            }
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
