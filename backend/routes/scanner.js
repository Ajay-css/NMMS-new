import express from 'express';
import { authenticate } from '../middleware/auth.js';
import AnswerKey from '../models/AnswerKey.js';
import ScanResult from '../models/ScanResult.js';
import { processOMRSheet } from '../services/omrProcessor.js';

const router = express.Router();

// Scan OMR sheet
router.post('/scan', authenticate, async (req, res) => {
  try {
    const { imageData, answerKeyId, studentName } = req.body;

    if (!imageData || !answerKeyId) {
      return res.status(400).json({ message: 'Image data and answer key ID are required' });
    }

    // Get answer key
    const answerKey = await AnswerKey.findById(answerKeyId);
    if (!answerKey) {
      return res.status(404).json({ message: 'Answer key not found' });
    }

    // Process OMR sheet image
    const scannedAnswers = await processOMRSheet(imageData, answerKey.totalQuestions);

    // Compare with answer key and calculate results
    const results = scannedAnswers.map((scanned, index) => {
      const question = answerKey.questions[index];
      const isCorrect = question && scanned.selectedAnswer === question.correctAnswer;
      return {
        questionNumber: index + 1,
        selectedAnswer: scanned.selectedAnswer,
        correctAnswer: question ? question.correctAnswer : null,
        isCorrect
      };
    });

    const correctCount = results.filter(r => r.isCorrect).length;
    const wrongCount = results.length - correctCount;
    const score = correctCount;
    const percentage = (correctCount / results.length) * 100;

    // Save scan result
    const scanResult = new ScanResult({
      answerKeyId: answerKey._id,
      scannedBy: req.user.userId,
      studentName: studentName || 'Anonymous',
      answers: results,
      totalQuestions: results.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      score,
      percentage: Math.round(percentage * 100) / 100
    });

    await scanResult.save();

    res.json({
      message: 'OMR sheet scanned successfully',
      result: {
        id: scanResult._id,
        studentName: scanResult.studentName,
        totalQuestions: scanResult.totalQuestions,
        correctAnswers: scanResult.correctAnswers,
        wrongAnswers: scanResult.wrongAnswers,
        score: scanResult.score,
        percentage: scanResult.percentage,
        answers: results,
        scannedAt: scanResult.scannedAt
      }
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ message: error.message || 'Failed to scan OMR sheet' });
  }
});

// Get all scan results
router.get('/results', authenticate, async (req, res) => {
  try {
    const results = await ScanResult.find()
      .populate('answerKeyId', 'name')
      .populate('scannedBy', 'username')
      .sort({ scannedAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all scan results
router.delete('/results', authenticate, async (req, res) => {
  try {
    // Optional: Check if user is admin
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Access denied' });
    // }

    await ScanResult.deleteMany({});
    res.json({ message: 'All scan results deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single scan result
router.get('/results/:id', authenticate, async (req, res) => {
  try {
    const result = await ScanResult.findById(req.params.id)
      .populate('answerKeyId', 'name')
      .populate('scannedBy', 'username');

    if (!result) {
      return res.status(404).json({ message: 'Scan result not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

