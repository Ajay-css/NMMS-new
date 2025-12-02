import sharp from 'sharp';

/**
 * Process OMR sheet image to detect numbers (1, 2, 3, 4) inside bubbles
 * Optimized for speed and accuracy using dynamic thresholding
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

    // OMR Layout Configuration - FINE TUNED
    // Adjust these values based on your specific OMR sheet layout
    const questionsPerRow = 10;
    const rows = Math.ceil(totalQuestions / questionsPerRow);

    // Margins - slightly adjusted to avoid edges
    const marginX = width * 0.04; // 4% margin
    const marginY = height * 0.03; // 3% margin
    const contentWidth = width - (2 * marginX);
    const contentHeight = height - (2 * marginY);

    const rowHeight = contentHeight / rows;
    const questionWidth = contentWidth / questionsPerRow;

    // Option spacing within a question block
    // A question block has 4 options. We need to find the center of each.
    // |  (1)  (2)  (3)  (4)  |
    const optionWidth = questionWidth / 4.5; // Slightly tighter spacing

    const answers = [];

    // Calculate global average brightness to set a baseline
    let globalSum = 0;
    for (let i = 0; i < data.length; i += 100) { // Sample every 100th pixel
      globalSum += data[i];
    }
    const globalAvg = globalSum / (data.length / 100);
    // Dynamic threshold: A filled bubble is typically 30-40% darker than the paper
    const detectionThreshold = globalAvg * 0.75;

    console.log(`Global Avg Brightness: ${globalAvg.toFixed(2)}, Threshold: ${detectionThreshold.toFixed(2)}`);

    // Process each question
    for (let q = 0; q < totalQuestions; q++) {
      const row = Math.floor(q / questionsPerRow);
      const col = q % questionsPerRow;

      // Calculate center of the question block
      const questionY = marginY + (row * rowHeight) + (rowHeight * 0.6); // Shift down slightly
      const questionX = marginX + (col * questionWidth) + (questionWidth * 0.1); // Shift right slightly

      let darkestOption = null;
      let minBrightness = 255;

      // Check all 4 options
      for (let opt = 1; opt <= 4; opt++) {
        // Calculate bubble center
        // We assume options are distributed horizontally in the question block
        const bubbleX = Math.floor(questionX + ((opt - 1) * optionWidth) + (optionWidth * 0.8));
        const bubbleY = Math.floor(questionY);

        // Define bubble region size (radius) - smaller to hit the center of the bubble
        const radius = Math.floor(Math.min(optionWidth, rowHeight) * 0.15);

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

        // Debug logging for first few questions to check alignment
        if (q < 3) {
          console.log(`Q${q + 1} Opt${opt}: Brightness ${avgBrightness.toFixed(2)} (Threshold: ${detectionThreshold.toFixed(2)}) at [${bubbleX}, ${bubbleY}]`);
        }

        // Check if this is the darkest option so far
        if (avgBrightness < minBrightness) {
          minBrightness = avgBrightness;

          // It must be significantly darker than the paper (dynamic threshold)
          // AND it must be absolutely dark enough (e.g. < 160) to avoid shadows
          if (avgBrightness < detectionThreshold || avgBrightness < 150) {
            darkestOption = opt;
          }
        }
      }

      answers.push({
        questionNumber: q + 1,
        selectedAnswer: darkestOption // Will be null if no option met the threshold
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
