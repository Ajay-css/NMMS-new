import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, isAdmin } from '../middleware/auth.js';
import AnswerKey from '../models/AnswerKey.js';
import { processQuestionPaper } from '../services/aiProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png) and PDF are allowed'));
    }
  }
});

// Upload question paper (4 pages)
router.post('/upload-question-paper', authenticate, isAdmin, upload.array('pages', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 4) {
      return res.status(400).json({ message: 'Please upload exactly 4 pages' });
    }

    const { name } = req.body;
    const files = req.files.map(file => file.path);

    // Process images with AI to extract questions and find answers
    const processedData = await processQuestionPaper(files);

    // Save answer key to database
    const answerKey = new AnswerKey({
      name: name || `Answer Key ${new Date().toLocaleDateString()}`,
      uploadedBy: req.user.userId,
      questions: processedData.questions,
      totalQuestions: processedData.questions.length
    });

    await answerKey.save();

    res.status(201).json({
      message: 'Question paper processed and answer key created successfully',
      answerKey: {
        id: answerKey._id,
        name: answerKey.name,
        totalQuestions: answerKey.totalQuestions
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to process question paper' });
  }
});

// Get all answer keys
router.get('/answer-keys', authenticate, isAdmin, async (req, res) => {
  try {
    const answerKeys = await AnswerKey.find()
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(answerKeys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single answer key
router.get('/answer-keys/:id', authenticate, async (req, res) => {
  try {
    const answerKey = await AnswerKey.findById(req.params.id)
      .populate('uploadedBy', 'username');
    
    if (!answerKey) {
      return res.status(404).json({ message: 'Answer key not found' });
    }
    
    res.json(answerKey);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete answer key
router.delete('/answer-keys/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const answerKey = await AnswerKey.findByIdAndDelete(req.params.id);
    
    if (!answerKey) {
      return res.status(404).json({ message: 'Answer key not found' });
    }
    
    res.json({ message: 'Answer key deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

