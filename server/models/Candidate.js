const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  resumePath: String,
  resumeText: String, // Context for LLM
  status: {
    type: String,
    enum: ['APPLIED', 'INVITED', 'SCHEDULED', 'COMPLETED', 'REJECTED'],
    default: 'APPLIED'
  },
  skills: [String],
  experienceLevel: String,
  
  // Security & Scheduling
  interviewToken: String, // Unique token for accessing booking/interview
  scheduledSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot'
  },
  interviewResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', candidateSchema);
