import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Process question paper images to extract questions and find correct answers
 */
export async function processQuestionPaper(imagePaths) {
  const allQuestions = [];
  
  try {
    // Process each page
    for (let pageIndex = 0; pageIndex < imagePaths.length; pageIndex++) {
      const imagePath = imagePaths[pageIndex];
      const questionsPerPage = 25; // Assuming 25 questions per page for 100 total
      
      // Preprocess image for better OCR
      const processedImage = await sharp(imagePath)
        .greyscale()
        .normalize()
        .sharpen()
        .toBuffer();
      
      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(processedImage, 'eng', {
        logger: m => console.log(m)
      });
      
      // Extract questions from OCR text
      const questions = extractQuestionsFromText(text, pageIndex * questionsPerPage + 1);
      
      // For each question, find the correct answer using AI/web search
      for (const question of questions) {
        const correctAnswer = await findCorrectAnswer(question);
        question.correctAnswer = correctAnswer;
        allQuestions.push(question);
      }
    }
    
    // Ensure we have exactly 100 questions
    while (allQuestions.length < 100) {
      allQuestions.push({
        questionNumber: allQuestions.length + 1,
        question: `Question ${allQuestions.length + 1}`,
        options: [
          { optionNumber: 1, text: 'Option A' },
          { optionNumber: 2, text: 'Option B' },
          { optionNumber: 3, text: 'Option C' },
          { optionNumber: 4, text: 'Option D' }
        ],
        correctAnswer: 1 // Default to option 1
      });
    }
    
    return { questions: allQuestions.slice(0, 100) };
  } catch (error) {
    console.error('Error processing question paper:', error);
    throw new Error('Failed to process question paper: ' + error.message);
  }
}

/**
 * Extract questions and options from OCR text
 */
function extractQuestionsFromText(text, startQuestionNumber) {
  const questions = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  let currentQuestion = null;
  let questionNumber = startQuestionNumber;
  
  for (const line of lines) {
    // Detect question number pattern (e.g., "1.", "Q1", etc.)
    const questionMatch = line.match(/^(\d+)\.?\s*(.+)/);
    
    if (questionMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        questionNumber: questionNumber++,
        question: questionMatch[2].trim(),
        options: [],
        correctAnswer: null
      };
    } else if (currentQuestion) {
      // Detect options (a), b), c), d) or 1), 2), 3), 4)
      const optionMatch = line.match(/^([a-dA-D1-4])[\.\)]\s*(.+)/);
      if (optionMatch) {
        const optionNum = optionMatch[1].toLowerCase();
        const optionIndex = optionNum === 'a' ? 1 : optionNum === 'b' ? 2 : optionNum === 'c' ? 3 : optionNum === 'd' ? 4 : parseInt(optionNum);
        
        if (optionIndex >= 1 && optionIndex <= 4) {
          currentQuestion.options.push({
            optionNumber: optionIndex,
            text: optionMatch[2].trim()
          });
        }
      } else if (currentQuestion.question.length < 200) {
        // Append to question if it's a continuation
        currentQuestion.question += ' ' + line.trim();
      }
    }
  }
  
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  // Ensure all questions have 4 options
  questions.forEach(q => {
    while (q.options.length < 4) {
      q.options.push({
        optionNumber: q.options.length + 1,
        text: `Option ${String.fromCharCode(64 + q.options.length + 1)}`
      });
    }
  });
  
  return questions;
}

/**
 * Find correct answer for a question using Google Gemini 1.5 Flash
 */
async function findCorrectAnswer(question) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found, using fallback');
      return 1;
    }

    // Initialize Gemini AI - using Gemini 1.5 Flash (stable version)
    // For experimental: use 'gemini-2.0-flash-exp'
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format the question and options
    const prompt = `You are an expert at answering multiple choice questions. Analyze the following question and its options carefully, then determine the correct answer.

Question: ${question.question}

Options:
1. ${question.options[0]?.text || 'Option 1'}
2. ${question.options[1]?.text || 'Option 2'}
3. ${question.options[2]?.text || 'Option 3'}
4. ${question.options[3]?.text || 'Option 4'}

IMPORTANT: Respond with ONLY the number (1, 2, 3, or 4) of the correct answer. Do not include any explanation, text, or additional information. Just the number.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Extract number from response
    const answerMatch = text.match(/\b([1-4])\b/);
    if (answerMatch) {
      const answer = parseInt(answerMatch[1]);
      if (answer >= 1 && answer <= 4) {
        console.log(`Question ${question.questionNumber}: AI selected answer ${answer}`);
        return answer;
      }
    }
    
    // Fallback if parsing fails
    console.warn(`Could not parse answer for question ${question.questionNumber}, defaulting to 1`);
    return 1;
  } catch (error) {
    console.error('Error finding correct answer with Gemini:', error);
    // Default to option 1 if AI fails
    return 1;
  }
}

