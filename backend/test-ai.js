import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function testAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imagePath = './uploads/pages-1764470247507-705188521.jpg';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Analyze this image of a question paper page and extract all multiple choice questions.

For each question:
1. Identify the question number exactly as shown
2. Extract the full question text. If the question involves a diagram or image, include a brief description
3. Extract all 4 options
4. Solve the question and determine the correct answer (1, 2, 3, or 4)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionNumber": 1,
    "question": "Question text here",
    "options": [
      { "optionNumber": 1, "text": "Option 1 text" },
      { "optionNumber": 2, "text": "Option 2 text" },
      { "optionNumber": 3, "text": "Option 3 text" },
      { "optionNumber": 4, "text": "Option 4 text" }
    ],
    "correctAnswer": 1
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/jpeg'
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log('\n=== RAW RESPONSE ===');
        console.log(text);
        console.log('\n=== END RESPONSE ===\n');

        // Try to parse
        let cleanText = text.trim();

        if (cleanText.includes('```json')) {
            const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                cleanText = jsonMatch[1];
            }
        } else if (cleanText.includes('```')) {
            const codeMatch = cleanText.match(/```\s*([\s\S]*?)\s*```/);
            if (codeMatch) {
                cleanText = codeMatch[1];
            }
        }

        const arrayMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
            cleanText = arrayMatch[0];
        }

        const questions = JSON.parse(cleanText);
        console.log('\n=== PARSED QUESTIONS ===');
        console.log(JSON.stringify(questions, null, 2));
        console.log(`\nTotal questions: ${questions.length}`);

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    }
}

testAI();
