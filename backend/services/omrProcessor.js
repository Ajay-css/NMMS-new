import sharp from 'sharp';

/**
 * Process OMR sheet image to detect numbers (1, 2, 3, 4) inside bubbles
 */
export async function processOMRSheet(imageData, totalQuestions = 100) {
  try {
    // Convert base64 to buffer if needed
    let imageBuffer;
    if (typeof imageData === 'string') {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = imageData;
    }

    // Preprocess image: greyscale, normalize, and get raw pixel data
    const { data, info } = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // OMR Layout Configuration
    // Adjust these values based on your specific OMR sheet layout
    const questionsPerRow = 10; // Number of questions in one horizontal row
    const rows = Math.ceil(totalQuestions / questionsPerRow);

    // Margins to ignore (paper edges)
    const marginX = width * 0.05;
    const marginY = height * 0.05;
    const contentWidth = width - (2 * marginX);
    const contentHeight = height - (2 * marginY);

    const rowHeight = contentHeight / rows;
    const questionWidth = contentWidth / questionsPerRow;
    const optionWidth = questionWidth / 5; // Divide by 5 to account for spacing

    const answers = [];

    // Process each question
    for (let q = 0; q < totalQuestions; q++) {
      const row = Math.floor(q / questionsPerRow);
      const col = q % questionsPerRow;

      // Calculate center of the question block
      const questionY = marginY + (row * rowHeight) + (rowHeight / 2);
      const questionX = marginX + (col * questionWidth) + (questionWidth / 2);

      let darkestOption = null;
      let maxDarkness = -1; // Higher value means darker (inverted logic below)
      let minBrightness = 255; // Lower value means darker

      // Check all 4 options
      for (let opt = 1; opt <= 4; opt++) {
        // Calculate bubble center
        // Adjust offset based on your specific sheet layout
        const bubbleX = Math.floor(questionX - (questionWidth / 2) + (opt * optionWidth));
        const bubbleY = Math.floor(questionY);

        // Define bubble region size (radius)
        const radius = Math.floor(Math.min(optionWidth, rowHeight) * 0.25);

        let totalBrightness = 0;
        let pixelCount = 0;

        // Calculate average brightness of the bubble region
        for (let y = bubbleY - radius; y <= bubbleY + radius; y++) {
          for (let x = bubbleX - radius; x <= bubbleX + radius; x++) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const offset = y * width + x;
              totalBrightness += data[offset];
              pixelCount++;
            }
          }
        }

        const avgBrightness = totalBrightness / pixelCount;

        // Check if this is the darkest option so far
        if (avgBrightness < minBrightness) {
          minBrightness = avgBrightness;
          // Threshold: Bubble must be significantly dark (e.g., < 150 out of 255)
          // Adjust this threshold based on scan quality
          if (avgBrightness < 180) {
            darkestOption = opt;
          }
        }
      }

      answers.push({
        questionNumber: q + 1,
        selectedAnswer: darkestOption
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

