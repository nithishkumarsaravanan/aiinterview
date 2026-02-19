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
const evaluateAnswers = async (questions, answers, jobDescription) => {
    // Construct the Q&A text for the prompt
    let qaText = "";
    questions.forEach((q, i) => {
        qaText += `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "No answer provided"}\n\n`;
    });

    const prompt = `
        You are a strict technical hiring manager and code reviewer.
        Your goal is to evaluate the candidate's answers with high scrutiny.

        CONTEXT (JOB DESCRIPTION):
        ${jobDescription}

        INTERVIEW DATA:
        ${qaText}

        EVALUATION RULES:
        1.  **Technical Accuracy**: Incorrect technical claims must be penalized heavily.
        2.  **Specificity**: Vague answers like "I will use a library" without naming it should get a low score.
        3.  **Job Relevance**: Answers must align with the specific tech stack mentioned in the Job Description.
        4.  **No Fluff**: Penalize buzzword stuffing if the underlying understanding is missing.

        For each answer:
        - Score from 0 to 10 (Be strict: 10 is reserved for perfect, production-ready answers).
        - Feedback: Point out specifically what was wrong or missing. Correct any technical misconceptions.

        Also provide:
        - Overall score (0–10)
        - Top 3 strengths
        - Top 3 weaknesses
        - Final recommendation: "Strong Hire", "Hire", "Consider", or "Reject"

        OUTPUT FORMAT:
        Return strictly in JSON format:
        {
            "scores": [number, number, ...],
            "feedback": ["feedback for Q1", "feedback for Q2", ...],
            "overall_score": number,
            "strengths": ["strength 1", "strength 2", ...],
            "weaknesses": ["weakness 1", "weakness 2", ...],
            "recommendation": "Strong Hire" | "Hire" | "Consider" | "Reject"
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
