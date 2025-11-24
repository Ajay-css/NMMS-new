import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Process OMR sheet image to detect numbers (1, 2, 3, 4) inside bubbles
 */
export async function processOMRSheet(imageData, totalQuestions = 100) {
  try {
    // Convert base64 to buffer if needed
    let imageBuffer;
    if (typeof imageData === 'string') {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = imageData;
    }
    
    // Preprocess image for better OCR - enhance contrast and sharpen
    const processed = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .linear(1.2, -(128 * 0.2)) // Increase contrast
      .toBuffer();
    
    // Get image metadata
    const metadata = await sharp(processed).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    // Calculate grid positions for 100 questions with 4 options each
    // Assuming standard OMR layout: questions in rows, options in columns
    const questionsPerRow = 10;
    const rows = Math.ceil(totalQuestions / questionsPerRow);
    const rowHeight = height / rows;
    const questionWidth = width / questionsPerRow;
    const optionWidth = questionWidth / 4; // 4 options per question
    
    const answers = [];
    
    // Process each question
    for (let q = 0; q < totalQuestions; q++) {
      const row = Math.floor(q / questionsPerRow);
      const col = q % questionsPerRow;
      
      const questionY = row * rowHeight + rowHeight / 2;
      const questionX = col * questionWidth + questionWidth / 2;
      
      // Check each of the 4 options for this question
      let selectedAnswer = null;
      let maxConfidence = 0;
      
      for (let opt = 1; opt <= 4; opt++) {
        // Calculate bubble position (each question has 4 bubbles in a row)
        const bubbleX = questionX - questionWidth / 2 + (opt - 0.5) * optionWidth;
        const bubbleY = questionY;
        
        // Extract a region around the bubble (larger region for better OCR)
        const sampleSize = Math.max(40, optionWidth * 0.6); // Larger sample for number detection
        const left = Math.max(0, Math.floor(bubbleX - sampleSize / 2));
        const top = Math.max(0, Math.floor(bubbleY - sampleSize / 2));
        const right = Math.min(width, Math.ceil(bubbleX + sampleSize / 2));
        const bottom = Math.min(height, Math.ceil(bubbleY + sampleSize / 2));
        
        // Extract bubble region
        const bubbleRegion = await sharp(processed)
          .extract({
            left,
            top,
            width: right - left,
            height: bottom - top
          })
          .resize(Math.max(100, (right - left) * 2), Math.max(100, (bottom - top) * 2), {
            kernel: sharp.kernel.lanczos3
          })
          .normalize()
          .sharpen()
          .toBuffer();
        
        // Use OCR to detect the number inside the bubble
        try {
          const { data } = await Tesseract.recognize(bubbleRegion, 'eng', {
            logger: () => {} // Suppress logs for performance
          });
          
          const text = data.text.trim();
          
          // Look for numbers 1, 2, 3, or 4 in the OCR result
          const numberMatch = text.match(/\b([1-4])\b/);
          
          if (numberMatch) {
            const detectedNumber = parseInt(numberMatch[1]);
            const confidence = data.confidence || 0;
            
            // If we found a number and it matches the expected option number
            if (detectedNumber === opt && confidence > maxConfidence) {
              maxConfidence = confidence;
              selectedAnswer = opt;
            }
          }
          
          // Also check if the bubble appears filled (dark) as a fallback
          const regionData = await sharp(bubbleRegion)
            .greyscale()
            .raw()
            .toBuffer();
          
          let totalDarkness = 0;
          for (let i = 0; i < regionData.length; i++) {
            totalDarkness += regionData[i];
          }
          const avgDarkness = totalDarkness / regionData.length;
          
          // If bubble is very dark (filled) and we haven't found a number yet
          if (avgDarkness < 80 && !selectedAnswer && opt === 1) {
            // Fallback: check if bubble is filled by darkness
            selectedAnswer = opt;
          }
        } catch (ocrError) {
          console.warn(`OCR error for question ${q + 1}, option ${opt}:`, ocrError.message);
        }
      }
      
      // If no answer detected via OCR, try darkness-based detection as fallback
      if (!selectedAnswer) {
        let darkestOption = null;
        let minDarkness = 255;
        
        for (let opt = 1; opt <= 4; opt++) {
          const bubbleX = questionX - questionWidth / 2 + (opt - 0.5) * optionWidth;
          const bubbleY = questionY;
          const sampleSize = Math.max(30, optionWidth * 0.5);
          const left = Math.max(0, Math.floor(bubbleX - sampleSize / 2));
          const top = Math.max(0, Math.floor(bubbleY - sampleSize / 2));
          const right = Math.min(width, Math.ceil(bubbleX + sampleSize / 2));
          const bottom = Math.min(height, Math.ceil(bubbleY + sampleSize / 2));
          
          const region = await sharp(processed)
            .extract({
              left,
              top,
              width: right - left,
              height: bottom - top
            })
            .greyscale()
            .raw()
            .toBuffer();
          
          let darkness = 0;
          for (let i = 0; i < region.length; i++) {
            darkness += region[i];
          }
          darkness = darkness / region.length;
          
          if (darkness < minDarkness) {
            minDarkness = darkness;
            if (darkness < 100) { // Threshold for filled bubble
              darkestOption = opt;
            }
          }
        }
        
        selectedAnswer = darkestOption;
      }
      
      answers.push({
        questionNumber: q + 1,
        selectedAnswer: selectedAnswer || null
      });
    }
    
    return answers;
  } catch (error) {
    console.error('Error processing OMR sheet:', error);
    throw new Error('Failed to process OMR sheet: ' + error.message);
  }
}

/**
 * Alternative method using contour detection (more advanced)
 */
export async function processOMRSheetAdvanced(imageData, totalQuestions = 100) {
  // This would use OpenCV.js or similar for more accurate bubble detection
  // For now, using the simpler threshold-based method above
  return processOMRSheet(imageData, totalQuestions);
}

