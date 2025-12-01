import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Process question paper images to extract questions and find correct answers
 * Uses Gemini Pro Vision for multimodal analysis (text + diagrams)
 */
export async function processQuestionPaper(imagePaths) {
  const allQuestions = [];

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash - latest and best multimodal model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    // Process each page
    for (let pageIndex = 0; pageIndex < imagePaths.length; pageIndex++) {
      const imagePath = imagePaths[pageIndex];
      console.log(`Processing page ${pageIndex + 1}/${imagePaths.length}: ${imagePath}`);

      try {
        // Read file
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = getMimeType(imagePath);

        const prompt = `Analyze this image of a question paper page and extract all multiple choice questions.

For each question:
1. Identify the question number exactly as shown
2. Extract the full question text. If the question involves a diagram or image, include a brief description (e.g., "[Diagram: Pattern sequence with shapes]")
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

IMPORTANT: Return ONLY the JSON array, no other text or explanation.`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log(`Raw AI response for page ${pageIndex + 1} (first 500 chars):`, text.substring(0, 500));

        // Parse JSON
        let pageQuestions = [];
        try {
          // Clean potential markdown code blocks
          let cleanText = text.trim();

          // Remove markdown code blocks if present
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

          // Try to find JSON array if response has extra text
          const arrayMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            cleanText = arrayMatch[0];
          }

          pageQuestions = JSON.parse(cleanText);
          console.log(`✅ Successfully parsed ${pageQuestions.length} questions from page ${pageIndex + 1}`);
        } catch (parseError) {
          console.error(`Failed to parse JSON for page ${pageIndex + 1}:`, parseError.message);
          console.log('Raw response:', text);
          // Continue to next page
          continue;
        }

        if (Array.isArray(pageQuestions)) {
          // Validate and sanitize questions
          const validQuestions = pageQuestions.map(q => ({
            questionNumber: parseInt(q.questionNumber) || 0,
            question: q.question || 'Unknown Question',
            options: Array.isArray(q.options) ? q.options.map(o => ({
              optionNumber: parseInt(o.optionNumber) || 0,
              text: o.text || ''
            })) : [],
            correctAnswer: parseInt(q.correctAnswer) || 1
          }));
          allQuestions.push(...validQuestions);
        }

      } catch (pageError) {
        console.error(`Error processing page ${pageIndex + 1}:`, pageError);
        // Don't fail the whole batch, try to continue
      }
    }

    // Sort questions by number
    allQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

    // If we have no questions, something went wrong
    if (allQuestions.length === 0) {
      throw new Error('No questions could be extracted from the uploaded files. Please ensure images are clear and readable.');
    }

    console.log(`✅ Total questions extracted: ${allQuestions.length}`);
    return { questions: allQuestions };

  } catch (error) {
    console.error('Error processing question paper:', error);
    throw new Error('Failed to process question paper: ' + error.message);
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.heic':
      return 'image/heic';
    case '.heif':
      return 'image/heif';
    default:
      return 'image/jpeg'; // Default fallback
  }
}
