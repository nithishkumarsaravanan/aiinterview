const axios = require('axios');

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3';

/**
 * Generates interview questions based on job description and resume text.
 * @param {string} jobDescription - The job description text.
 * @param {string} resumeText - The extracted resume text.
 * @returns {Promise<Array>} - A list of generated interview questions.
 */
const generateQuestions = async (jobDescription, resumeText) => {
    const prompt = `
        You are an expert technical interviewer. 
        
        STEP 1: ANALYZE EXPERIENCE
        Analyze the Candidate Resume to determine if they are a "Fresher" (0-2 years, no major industry experience) or "Experienced" (2+ years, mid-senior level).
        
        STEP 2: GENERATE QUESTIONS
        Based on the Job Description and the Candidate's Experience Level, generate 5-10 detailed and relevant interview questions.
        
        - IF FRESHER: Focus on core concepts, fundamental knowledge, and academic projects. Questions should be standard and testing basics.
        - IF EXPERIENCED: Focus on deep technical concepts, system design, architectural decisions, scenario-based problem solving, and past project challenges. Questions should be complex and probe depth of understanding.

        JOB DESCRIPTION:
        ${jobDescription}
        
        RESUME:
        ${resumeText}
        
        OUTPUT FORMAT:
        Provide the response ONLY as a valid JSON object with the following structure:
        {
            "experienceLevel": "Fresher" or "Experienced",
            "questions": ["Question 1", "Question 2", ...]
        }
    `;

    try {
        console.log("Sending request to Ollama...");
        const response = await axios.post(OLLAMA_API_URL, {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false,
            format: "json",
            options: {
                num_gpu: 0 // Force CPU to avoid CUDA errors
            }
        }, {
            timeout: 120000 // 2 minutes timeout
        });

        console.log("Ollama response received.");

        if (response.data && response.data.response) {
            // Parse the JSON response from Ollama
            try {
                const parsed = JSON.parse(response.data.response);
                
                // standard format check
                if (parsed.questions && Array.isArray(parsed.questions)) {
                    return parsed.questions;
                }
                
                // Fallback: if it returns just an array
                if (Array.isArray(parsed)) {
                    // Check if the first item is an object with questions (based on the user error)
                    if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0]['Interview Questions']) {
                         return parsed[0]['Interview Questions'];
                    }
                    if (parsed.length > 0 && typeof parsed[0] === 'string') {
                        return parsed;
                    }
                }

                console.warn("Unexpected JSON structure:", parsed);
                // If we can't find questions, throw or return empty
                return [];

            } catch (e) {
                console.error("Failed to parse LLM response as JSON:", response.data.response);
                // Fallback: return raw text split by newlines if JSON parsing fails
                 return response.data.response.split('\n').filter(line => line.trim().length > 0);
            }
        } else {
            console.error("Invalid response structure from Ollama:", response.data);
            throw new Error('Invalid response from Ollama');
        }
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error('Error: Request to Ollama timed out.');
            throw new Error('LLM request timed out. Please try again.');
        }
        console.error('Error calling LLM support:', error.message);
        if (error.response) {
            console.error('Ollama API Error Data:', error.response.data);
            console.error('Ollama API Status:', error.response.status);
        }
        throw new Error('Failed to generate questions via LLM');
    }
};


/**
 * Evaluates the candidate's answers against the questions.
 * @param {Array<string>} questions - The list of interview questions.
 * @param {Array<string>} answers - The candidate's answers.
 * @returns {Promise<Object>} - The evaluation result { score, feedback }.
 */
const evaluateAnswers = async (questions, answers) => {
    // Construct the Q&A text for the prompt
    let qaText = "";
    questions.forEach((q, i) => {
        qaText += `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "No answer provided"}\n\n`;
    });

    const prompt = `
        You are a strict technical interviewer.
        Evaluate the following Candidate Answers against the Interview Questions.
        
        INTERVIEW DATA:
        ${qaText}
        
        CRITERIA:
        1. Accuracy: Are the answers technically correct?
        2. Relevance: Do they directly address the question?
        3. Depth: Does the candidate demonstrate sufficient understanding?
        
        OUTPUT FORMAT:
        Provide the response ONLY as a valid JSON object.
        {
            "score": <number 0-10>,
            "feedback": "<string: A consolidated summary of the evaluation, highlighting key strengths and major errors. be professional but strict.>"
        }
    `;

    try {
        console.log("Sending evaluation request to Ollama...");
        const response = await axios.post(OLLAMA_API_URL, {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false,
            format: "json",
            options: {
                num_gpu: 0
            }
        }, {
            timeout: 120000
        });

        console.log("Ollama evaluation received.");

        if (response.data && response.data.response) {
            try {
                return JSON.parse(response.data.response);
            } catch (e) {
                console.error("Failed to parse LLM evaluation:", response.data.response);
                throw new Error("Failed to parse evaluation result.");
            }
        } else {
            throw new Error('Invalid response from Ollama');
        }
    } catch (error) {
        console.error('Error calling LLM for evaluation:', error.message);
        throw new Error('Failed to evaluate answers via LLM');
    }
};

module.exports = { generateQuestions, evaluateAnswers };
