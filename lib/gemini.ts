
import { GoogleGenAI } from "@google/genai";

// القائمة الكاملة لمفاتيح API الخاصة بك
const API_KEYS = [
  "AIzaSyDeEllhsrlLdNY0ZriMkhRMhhsr1hWcoys",
  "AIzaSyBEzqFomTAYWSR6sACdOQJGKVZAc1wgYNA",
  "AIzaSyBmzyNQ5e6e_iAx1dsX9uDl48Iee9HOawE",
  "AIzaSyCFrCw4IXUChQaT8BpJBl3VMbuVjo4wD-k",
  "AIzaSyAaQuBL4MvCvScABDy2WQNK7Tn4gP_qb_g",
  "AIzaSyD94HH8GV98mkLvXWgs7fOj2Nd1-ho7cbo",
  "AIzaSyBsGnW9F5CpB5ASN-BeoxukpvsTANyKI3s",
  "AIzaSyDhPmwZdfAhxX7vdpBAHdct86xxIE0PKos",
  "AIzaSyCVJfMtDtwMf3ME8Z8J1gt84Ix7VY3Bos4",
  "AIzaSyCDhqm3RqPfWr6YUaWmg8KCtCGJ6IziGw4",
  "AIzaSyBOrzurI4PXHqHigZ7ye_o72heQbfm-bVM"
];

export const getGeminiClient = () => {
    // 1. Try to get keys from LocalStorage (if set via Settings)
    const localKeysString = localStorage.getItem('gemini_api_keys');
    let keyPool: string[] = [...API_KEYS]; // Start with hardcoded keys

    if (localKeysString) {
        try {
            const keys = JSON.parse(localKeysString);
            if (Array.isArray(keys) && keys.length > 0) {
                // Combine or prefer local keys
                keyPool = [...keys, ...API_KEYS];
            }
        } catch (e) {
            console.error("Error parsing API keys from storage", e);
        }
    }

    // 2. Select a Random Key from the Pool (Rotation Logic)
    let apiKey = '';
    if (keyPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * keyPool.length);
        apiKey = keyPool[randomIndex];
    }

    // 3. Fallback to process.env if available (for development)
    if (!apiKey && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
    }
    
    // IMPORTANT: Return client without checking for 'DUMMY_KEY'. 
    // If apiKey is empty, GoogleGenAI constructor will throw or requests will fail, 
    // which is better than silently failing with a bad request later.
    // The calling code should handle the error.
    
    if (!apiKey) {
        console.warn("No API Key found. AI features may fail.");
    }

    return new GoogleGenAI({ apiKey });
};
