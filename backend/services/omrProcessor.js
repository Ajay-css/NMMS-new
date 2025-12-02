import sharp from 'sharp';
import path from 'path';

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

    // AUTO-MARGIN DETECTION
    // Scan to find the bounding box of the content (the grid of bubbles)
    // We look for significant darkness (ink) starting from edges

    let minX = width, minY = height, maxX = 0, maxY = 0;
    const threshold = 200; // Pixel brightness threshold (pixels darker than this are "ink")

    // Scan horizontal center line to find left/right bounds
    const centerY = Math.floor(height / 2);
    for (let x = 0; x < width; x++) {
      if (data[centerY * width + x] < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    // Scan vertical center lines (at 25% and 75% width) to find top/bottom bounds
    const x1 = Math.floor(width * 0.25);
    const x2 = Math.floor(width * 0.75);

    for (let y = 0; y < height; y++) {
      if (data[y * width + x1] < threshold || data[y * width + x2] < threshold) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    // Add some padding to the detected bounds
    // If detection failed (e.g. blank page), fall back to defaults
    if (minX >= maxX || minY >= maxY) {
      console.log('Auto-margin detection failed, using defaults');
      minX = width * 0.05;
      maxX = width * 0.95;
      minY = height * 0.05;
      maxY = height * 0.95;
    } else {
      // Relax bounds slightly
      minX = Math.max(0, minX - width * 0.02);
      maxX = Math.min(width, maxX + width * 0.02);
      minY = Math.max(0, minY - height * 0.02);
      maxY = Math.min(height, maxY + height * 0.02);
      console.log(`Auto-margins: X[${minX}-${maxX}], Y[${minY}-${maxY}]`);
    }

    // OMR Layout Configuration - DYNAMIC
    const questionsPerRow = 10;
    const rows = Math.ceil(totalQuestions / questionsPerRow);

    const marginX = minX;
    const marginY = minY;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const rowHeight = contentHeight / rows;
    const questionWidth = contentWidth / questionsPerRow;

    // Option spacing: | (1) (2) (3) (4) |
    const optionWidth = questionWidth / 4.2;

    const answers = [];

    // SVG for debug overlay
    let svgOverlay = `<svg width="${width}" height="${height}">`;

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
        // Search WIDER area (40% of option width) to find the true center
        let minLocalBrightness = 255;
        let bestX = estimatedX;
        let bestY = estimatedY;

        const searchRadius = Math.floor(optionWidth * 0.4); // Increased search radius

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

        // Measure average brightness at the BEST center
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
        optionBrightness.push({ opt, brightness: avgBrightness, x: bestX, y: bestY });
      }

      // RELATIVE DARKNESS LOGIC
      optionBrightness.sort((a, b) => a.brightness - b.brightness);

      const darkest = optionBrightness[0];
      const secondDarkest = optionBrightness[1];
      const avgOthers = (optionBrightness[1].brightness + optionBrightness[2].brightness + optionBrightness[3].brightness) / 3;

      let selectedAnswer = null;

      // Logic: Darkest must be significantly darker
      if (darkest.brightness < (avgOthers * 0.90)) { // Relaxed threshold (90% of others)
        selectedAnswer = darkest.opt;
      } else if (darkest.brightness < 140 && avgOthers > 170) {
        selectedAnswer = darkest.opt;
      }

      // Fallback
      if (!selectedAnswer && (secondDarkest.brightness - darkest.brightness) > 15) {
        selectedAnswer = darkest.opt;
      }

      answers.push({
        questionNumber: q + 1,
        selectedAnswer: selectedAnswer
      });

      // Add to debug SVG
      optionBrightness.forEach(o => {
        const color = (o.opt === selectedAnswer) ? "green" : "red";
        const strokeWidth = (o.opt === selectedAnswer) ? 3 : 1;
        // Draw circle at detected center
        svgOverlay += `<circle cx="${o.x}" cy="${o.y}" r="${measureRadius}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" />`;
      });
    }

    svgOverlay += `</svg>`;

    // Save Debug Image
    try {
      // Assuming we are in backend/services, go up to root then to frontend/public
      const debugPath = path.join(process.cwd(), '../frontend/public/debug-omr.jpg');
      await sharp(imageBuffer)
        .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
        .toFile(debugPath);
      console.log('Debug image saved to:', debugPath);
    } catch (err) {
      console.error('Failed to save debug image:', err);
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
  return processOMRSheet(imageData, totalQuestions);
}
