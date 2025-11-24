import mongoose from 'mongoose';

const scanResultSchema = new mongoose.Schema({
  answerKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnswerKey',
    required: true
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: {
    type: String,
    default: 'Anonymous'
  },
  answers: [{
    questionNumber: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: Number,
      min: 1,
      max: 4
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  totalQuestions: {
    type: Number,
    default: 100
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ScanResult', scanResultSchema);

