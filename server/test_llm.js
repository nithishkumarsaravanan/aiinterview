const { generateQuestions } = require('./llmService');

const mockJobDescription = "We are looking for a Senior Software Engineer with experience in Node.js, React, and partial differential equations.";
const mockResumeText = "John Doe. Senior Software Engineer. 5 years of experience in Node.js and React. Loves math.";

async function test() {
    console.log("Starting LLM Test...");
    try {
        const questions = await generateQuestions(mockJobDescription, mockResumeText);
        console.log("Generated Questions:", questions);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

test();
