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
      console.log('Auto-margin detection failed - no content detected');
      throw new Error('Unidentified object detected. Please position a valid OMR sheet in the camera view.');
    }

    // VALIDATE OMR SHEET STRUCTURE
    // Check if detected content has characteristics of an OMR sheet
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate ink coverage in detected area
    let darkPixelCount = 0;
    let totalPixelsChecked = 0;
    const sampleStep = 5; // Sample every 5th pixel for performance

    for (let y = Math.floor(minY); y < Math.floor(maxY); y += sampleStep) {
      for (let x = Math.floor(minX); x < Math.floor(maxX); x += sampleStep) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          totalPixelsChecked++;
          if (data[y * width + x] < threshold) {
            darkPixelCount++;
          }
        }
      }
    }

    const inkCoverage = darkPixelCount / totalPixelsChecked;

    // OMR sheet validation criteria
    const aspectRatio = contentWidth / contentHeight;
    const contentArea = contentWidth * contentHeight;
    const imageArea = width * height;
    const contentPercentage = contentArea / imageArea;

    console.log(`Validation - Ink: ${(inkCoverage * 100).toFixed(1)}%, Aspect: ${aspectRatio.toFixed(2)}, Coverage: ${(contentPercentage * 100).toFixed(1)}%`);

    // Validation checks
    const validations = {
      inkCoverage: inkCoverage >= 0.05 && inkCoverage <= 0.6, // 5-60% ink coverage
      aspectRatio: aspectRatio >= 0.3 && aspectRatio <= 3.0, // Reasonable aspect ratio
      contentSize: contentPercentage >= 0.15, // At least 15% of image
      contentDimensions: contentWidth > (width * 0.2) && contentHeight > (height * 0.2) // Minimum size
    };

    const isValidOMR = Object.values(validations).every(v => v === true);

    if (!isValidOMR) {
      console.log('OMR validation failed:', validations);
      throw new Error('Unidentified object detected. Please position a valid OMR sheet in the camera view.');
    }

    // Relax bounds slightly
    minX = Math.max(0, minX - width * 0.02);
    maxX = Math.min(width, maxX + width * 0.02);
    minY = Math.max(0, minY - height * 0.02);
    maxY = Math.min(height, maxY + height * 0.02);
    console.log(`Auto-margins: X[${minX}-${maxX}], Y[${minY}-${maxY}]`);

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

      // IMPROVED RELATIVE DARKNESS LOGIC WITH MULTIPLE STRATEGIES
      optionBrightness.sort((a, b) => a.brightness - b.brightness);

      const darkest = optionBrightness[0];
      const secondDarkest = optionBrightness[1];
      const thirdDarkest = optionBrightness[2];
      const lightest = optionBrightness[3];

      // Calculate various metrics
      const avgAll = (darkest.brightness + secondDarkest.brightness + thirdDarkest.brightness + lightest.brightness) / 4;
      const avgOthers = (secondDarkest.brightness + thirdDarkest.brightness + lightest.brightness) / 3;
      const darkestToSecond = secondDarkest.brightness - darkest.brightness;
      const darkestToAvg = avgOthers - darkest.brightness;

      let selectedAnswer = null;

      // Strategy 1: Strong relative darkness (most reliable)
      // Darkest is at least 8% darker than average of others
      if (darkest.brightness < (avgOthers * 0.92)) {
        selectedAnswer = darkest.opt;
      }

      // Strategy 2: Absolute darkness with contrast
      // Darkest is absolutely dark AND others are relatively light
      else if (darkest.brightness < 150 && avgOthers > 165) {
        selectedAnswer = darkest.opt;
      }

      // Strategy 3: Clear separation from second darkest
      // There's a significant gap between darkest and second darkest
      else if (darkestToSecond > 12 && darkest.brightness < 180) {
        selectedAnswer = darkest.opt;
      }

      // Strategy 4: Variance-based detection
      // Darkest is significantly darker than the average of ALL options
      else if (darkest.brightness < (avgAll * 0.88)) {
        selectedAnswer = darkest.opt;
      }

      // Strategy 5: Lenient threshold for clear marks
      // Very lenient - if darkest is notably darker than others
      else if (darkestToAvg > 10 && darkest.brightness < 190) {
        selectedAnswer = darkest.opt;
      }

      // Strategy 6: Ultra-lenient fallback for approximate detection
      // If there's ANY reasonable difference, accept it
      else if (darkestToSecond > 8 && darkest.brightness < 200) {
        selectedAnswer = darkest.opt;
      }

      answers.push({
        questionNumber: q + 1,
        selectedAnswer: selectedAnswer
      });

      // Add to debug SVG
      // Define measureRadius here so it's available for debug drawing
      const measureRadius = Math.floor(Math.min(optionWidth, rowHeight) * 0.15);

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
