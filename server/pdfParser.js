const pdf = require('pdf-parse');

/**
 * Extracts text from a PDF buffer.
 * @param {Buffer} dataBuffer - The buffer of the PDF file.
 * @returns {Promise<string>} - The extracted text.
 */
const extractTextFromPDF = async (dataBuffer) => {
    try {
        console.log(`Attempting to parse PDF. Buffer size: ${dataBuffer.length} bytes`);
        const data = await pdf(dataBuffer);
        
        if (!data || !data.text) {
            console.warn("PDF parsed but no text found.");
            return ""; 
        }

        console.log(`PDF parsed successfully. Text length: ${data.text.length} chars`);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};

module.exports = { extractTextFromPDF };
