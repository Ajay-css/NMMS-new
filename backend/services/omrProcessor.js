import sharp from 'sharp';

/**
 * Process OMR sheet image to detect numbers (1, 2, 3, 4) inside bubbles
 * Optimized for speed and accuracy using relative darkness comparison and smart center search
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

    // OMR Layout Configuration - ROBUST MODE
    const questionsPerRow = 10;
    const rows = Math.ceil(totalQuestions / questionsPerRow);

    // Margins - Standard A4 OMR usually has these margins
    const marginX = width * 0.05;
    const marginY = height * 0.04;
    const contentWidth = width - (2 * marginX);
    const contentHeight = height - (2 * marginY);

    const rowHeight = contentHeight / rows;
    const questionWidth = contentWidth / questionsPerRow;

    // Option spacing: | (1) (2) (3) (4) |
    // Options are usually centered within the question block
    const optionWidth = questionWidth / 4.2; // Adjusted spacing

    const answers = [];

    // Process each question
    for (let q = 0; q < totalQuestions; q++) {
      const row = Math.floor(q / questionsPerRow);
      const col = q % questionsPerRow;

      // Calculate approximate center of the question block
      const questionY = marginY + (row * rowHeight) + (rowHeight * 0.55);
      const questionX = marginX + (col * questionWidth) + (questionWidth * 0.15);

      let optionBrightness = [];

      // Check all 4 options
      for (let opt = 1; opt <= 4; opt++) {
        // Calculate estimated bubble center
        const estimatedX = Math.floor(questionX + ((opt - 1) * optionWidth) + (optionWidth * 0.6));
        const estimatedY = Math.floor(questionY);

        // SMART CENTER SEARCH:
        // The grid might be slightly off. Let's search a small area around the estimated center
        // to find the "true" center (the darkest spot).
        let minLocalBrightness = 255;
        let bestX = estimatedX;
        let bestY = estimatedY;

        const searchRadius = Math.floor(optionWidth * 0.2); // Search 20% around

        // Scan a small grid around the estimated point to find the darkest pixel
        // This helps align perfectly with the bubble
        for (let sy = estimatedY - searchRadius; sy <= estimatedY + searchRadius; sy += 2) {
          for (let sx = estimatedX - searchRadius; sx <= estimatedX + searchRadius; sx += 2) {
            if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
              const offset = sy * width + sx;
              if (data[offset] < minLocalBrightness) {
                minLocalBrightness = data[offset];
                bestX = sx;
                bestY = sy;
              }
            }
          }
        }

        // Now measure average brightness at the BEST center we found
        const measureRadius = Math.floor(Math.min(optionWidth, rowHeight) * 0.15);
        let totalBrightness = 0;
        let pixelCount = 0;

        for (let y = bestY - measureRadius; y <= bestY + measureRadius; y++) {
          for (let x = bestX - measureRadius; x <= bestX + measureRadius; x++) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const offset = y * width + x;
              totalBrightness += data[offset];
              pixelCount++;
            }
          }
        }

        const avgBrightness = totalBrightness / pixelCount;
        optionBrightness.push({ opt, brightness: avgBrightness });
      }

      // RELATIVE DARKNESS LOGIC:
      // Sort options by brightness (darkest first)
      optionBrightness.sort((a, b) => a.brightness - b.brightness);

      const darkest = optionBrightness[0];
      const secondDarkest = optionBrightness[1];

      // Calculate average brightness of the other 3 options
      const avgOthers = (optionBrightness[1].brightness + optionBrightness[2].brightness + optionBrightness[3].brightness) / 3;

      let selectedAnswer = null;

      // Debug log
      if (q < 3) {
        console.log(`Q${q + 1}: Darkest=${darkest.brightness.toFixed(1)} (Opt ${darkest.opt}), AvgOthers=${avgOthers.toFixed(1)}`);
      }

      // Logic:
      // 1. The darkest bubble must be darker than the average of others by a margin (e.g. 15% darker)
      // 2. OR if the contrast is huge (e.g. < 100 brightness vs > 180), pick it immediately
      if (darkest.brightness < (avgOthers * 0.85)) {
        selectedAnswer = darkest.opt;
      } else if (darkest.brightness < 120 && avgOthers > 160) {
        selectedAnswer = darkest.opt;
      }

      // Fallback: If we are still N/A but there is a "winner" (darkest is clearly separated from second darkest)
      if (!selectedAnswer && (secondDarkest.brightness - darkest.brightness) > 20) {
        selectedAnswer = darkest.opt;
      }

      answers.push({
        questionNumber: q + 1,
        selectedAnswer: selectedAnswer // Can still be null if really ambiguous, but much less likely
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
