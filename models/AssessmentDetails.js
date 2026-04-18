const mongoose = require('mongoose');

const assessmentDetailsSchema = new mongoose.Schema({
  quiz_result_id: {
    type: Number, // References the PostgreSQL QuizResult.id
    required: true,
    index: true,
  },
  question_responses: [
    {
      question: { type: String, required: true },
      score: { type: Number, required: true },
      text: { type: String, default: '' }, // Optional free-text response
    },
  ],
  ai_sentiment_analysis: {
    type: String, // Gemini-generated counselor summary
    default: null,
  },
}, {
  timestamps: true,
  collection: 'assessment_details',
});

const AssessmentDetails = mongoose.model('AssessmentDetails', assessmentDetailsSchema);

module.exports = AssessmentDetails;
