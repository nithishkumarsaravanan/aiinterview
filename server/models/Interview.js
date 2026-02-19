const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
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
        score: Number,
        feedback: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
