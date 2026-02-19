const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate'
    },
    jobDescription: {
        type: String,
        required: true
    },
    resumeText: {
        type: String,
        required: true
    },
    questions: {
        type: [String],
        required: true
    },
    answers: {
        type: [String],
        default: []
    },
    evaluation: {
        scores: [Number],
        feedback: [String],
        overall_score: Number,
        strengths: [String],
        weaknesses: [String],
        recommendation: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
