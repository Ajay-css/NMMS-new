import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key (first 10 chars):', apiKey?.substring(0, 10));

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Try to list models
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
        const data = await response.json();

        console.log('\n=== AVAILABLE MODELS ===');
        if (data.models) {
            data.models.forEach(model => {
                console.log(`- ${model.name}`);
                console.log(`  Display Name: ${model.displayName}`);
                console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
                console.log('');
            });
        } else {
            console.log('Error:', data);
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
