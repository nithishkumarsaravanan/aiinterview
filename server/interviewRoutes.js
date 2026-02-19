const express = require('express');
const multer = require('multer');
const { extractTextFromPDF } = require('./pdfParser');
const { generateQuestions } = require('./llmService');
const { isResume, isJobDescription } = require('./validator');

const Interview = require('./models/Interview');

const router = express.Router();

// Configure multer for memory storage (we don't need to save files to disk for this)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/generate-questions', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription } = req.body;
        const resumeFile = req.file;

        if (!jobDescription || !resumeFile) {
            return res.status(400).json({ error: 'Job description and resume PDF are required.' });
        }

        // Validate Job Description
        if (!isJobDescription(jobDescription)) {
            return res.status(400).json({ 
                error: 'The provided text does not appear to be a valid Job Description. Please ensure it contains standard sections like Responsibilities, Requirements, or Skills.' 
            });
        }

        console.log("Processing request...");
        console.log("Job Description Length:", jobDescription.length);
        console.log("Resume File:", {
            originalname: resumeFile.originalname,
            mimetype: resumeFile.mimetype,
            size: resumeFile.size
        });
        
        // 1. Extract text from PDF
        const resumeText = await extractTextFromPDF(resumeFile.buffer);
        console.log("Resume text extracted.");

        // 2. Validate content
        if (!isResume(resumeText)) {
            console.warn("Validation failed: Document does not appear to be a resume.");
            return res.status(400).json({ 
                error: 'The uploaded file does not appear to be a valid resume. Please ensure it contains standard sections like Experience, Education, or Skills.' 
            });
        }        

        // 3. Generate questions via LLM
        const questions = await generateQuestions(jobDescription, resumeText);
        console.log("Questions generated.");

        // 4. Save to Database
        const interview = new Interview({
            jobDescription,
            resumeText,
            questions
        });
        await interview.save();
        console.log("Interview data saved to database with ID:", interview._id);

        res.json({ questions, interviewId: interview._id });

    } catch (error) {
        console.error('Error in /generate-questions:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

router.post('/evaluate-answers', async (req, res) => {
    try {
        const { interviewId, answers } = req.body;

        if (!interviewId || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Interview ID and answers array are required.' });
        }

        // 1. Find Interview
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ error: 'Interview session not found.' });
        }

        // 2. Validate answers length
        if (answers.length !== interview.questions.length) {
            return res.status(400).json({ error: 'Number of answers must match number of questions.' });
        }

        console.log(`Evaluating answers for interview ${interviewId}...`);

        // 3. Evaluate Answers via LLM
        const { evaluateAnswers } = require('./llmService');
        const evaluation = await evaluateAnswers(interview.questions, answers);
        
        console.log("Evaluation complete:", evaluation);

        // 4. Update Database
        interview.answers = answers;
        interview.evaluation = evaluation;
        await interview.save();

        res.json({ evaluation });

    } catch (error) {
        console.error('Error in /evaluate-answers:', error);
        res.status(500).json({ error: error.message || 'Failed to evaluate answers.' });
    }
});

module.exports = router;
