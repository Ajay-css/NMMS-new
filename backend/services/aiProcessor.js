import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Process question paper images to extract questions and find correct answers
 * Uses Gemini Pro Vision for multimodal analysis (text + diagrams)
 */
export async function processQuestionPaper(imagePaths) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash - optimized for speed
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1, // Lower temperature for faster, more deterministic responses
        topK: 1,
        topP: 0.8,
      }
    });

    console.log(`🚀 Processing ${imagePaths.length} pages in parallel...`);
    const startTime = Date.now();

    // OPTIMIZED: Process all pages in parallel
    const pagePromises = imagePaths.map((imagePath, pageIndex) =>
      processPage(model, imagePath, pageIndex, imagePaths.length)
    );

    // Wait for all pages to complete
    const pageResults = await Promise.allSettled(pagePromises);

    // Collect all successful results
    const allQuestions = [];
    let successCount = 0;
    let failCount = 0;

    pageResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allQuestions.push(...result.value);
        successCount++;
      } else {
        failCount++;
        console.error(`❌ Page ${index + 1} failed:`, result.reason?.message || 'Unknown error');
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log(`✅ Processing complete in ${duration}s`);
    console.log(`   Success: ${successCount}/${imagePaths.length} pages`);
    console.log(`   Failed: ${failCount}/${imagePaths.length} pages`);

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

/**
 * Process a single page - optimized for speed
 */
async function processPage(model, imagePath, pageIndex, totalPages) {
  console.log(`📄 Processing page ${pageIndex + 1}/${totalPages}: ${path.basename(imagePath)}`);

  try {
    // Read file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);

    // OPTIMIZED PROMPT: Shorter and more direct
    const prompt = `Extract all MCQs from this page. For each question, identify: question number, question text, 4 options, and solve to find the correct answer (1-4).

Return ONLY valid JSON array:
[{"questionNumber":1,"question":"text","options":[{"optionNumber":1,"text":"opt1"},{"optionNumber":2,"text":"opt2"},{"optionNumber":3,"text":"opt3"},{"optionNumber":4,"text":"opt4"}],"correctAnswer":1}]

No explanations, just JSON.`;

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
      console.log(`✅ Page ${pageIndex + 1}: Extracted ${pageQuestions.length} questions`);
    } catch (parseError) {
      console.error(`❌ Page ${pageIndex + 1}: JSON parse failed -`, parseError.message);
      throw new Error(`Failed to parse page ${pageIndex + 1}`);
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
      return validQuestions;
    }

    return [];

  } catch (error) {
    console.error(`❌ Error processing page ${pageIndex + 1}:`, error.message);
    throw error;
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
