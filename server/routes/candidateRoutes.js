const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Candidate = require('../models/Candidate');
const { sendBookingEmail } = require('../utils/emailService');

const upload = multer({ dest: 'uploads/' });

// Apply Endpoint
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, skills } = req.body; // In a real app, parse this from Resume
    const file = req.file;

    if (!file || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Read Resume
    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdf(dataBuffer);
    const resumeText = data.text;

    // Generate Token
    const interviewToken = crypto.randomBytes(32).toString('hex');

    // Create Candidate
    const candidate = new Candidate({
      name,
      email,
      resumePath: file.path,
      resumeText,
      interviewToken,
      status: 'INVITED' // Auto-invite for now
    });

    await candidate.save();

    // Send Email
    const bookingLink = `http://localhost:5173/book/${interviewToken}`;
    await sendBookingEmail(candidate, bookingLink);

    res.json({ message: 'Application received. Check your email to book a slot.' });

  } catch (error) {
    console.error('Apply Error:', error);
    res.status(500).json({ error: 'Failed to process application' });
  }
});

router.get('/:token', async (req, res) => {
    try {
        const candidate = await Candidate.findOne({ interviewToken: req.params.token });
        if (!candidate) return res.status(404).json({ error: 'Invalid token' });
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
