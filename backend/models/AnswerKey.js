import mongoose from 'mongoose';

const answerKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    questionNumber: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [{
      optionNumber: {
        type: Number,
        required: true
      },
      text: {
        type: String,
        required: true
      }
    }],
    correctAnswer: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    }
  }],
  totalQuestions: {
    type: Number,
    default: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AnswerKey', answerKeySchema);

