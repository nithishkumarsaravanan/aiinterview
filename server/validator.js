/**
 * Checks if the text content appears to be from a resume.
 * @param {string} text - The extracted text from the PDF.
 * @returns {boolean} - True if it looks like a resume, false otherwise.
 */
const isResume = (text) => {
    if (!text || typeof text !== 'string') return false;

    const lowerText = text.toLowerCase();
    
    // List of common resume keywords/sections
    const keywords = [
        'experience',
        'education',
        'skills',
        'projects',
        'summary',
        'profile',
        'objective',
        'curriculum vitae',
        'resume',
        'contact',
        'work history',
        'qualifications',
        'certifications',
        'achievements',
        'technical skills'
    ];

    // Count how many unique keywords are present
    let matchCount = 0;
    const minMatches = 2; // Require at least 2 distinct keywords to be safer

    for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
            matchCount++;
        }
        if (matchCount >= minMatches) return true;
    }

    return false;
};

/**
 * Checks if the text content appears to be a job description.
 * @param {string} text - The job description text.
 * @returns {boolean} - True if it looks like a JD, false otherwise.
 */
const isJobDescription = (text) => {
    if (!text || typeof text !== 'string') return false;

    const lowerText = text.toLowerCase();
    
    // List of common JD keywords
    const keywords = [
        'responsibility',
        'responsibilities',
        'requirement',
        'requirements',
        'role',
        'job',
        'description',
        'qualification',
        'qualifications',
        'skill',
        'skills',
        'experience',
        'team',
        'about us',
        'overview',
        'candidate',
        'duty',
        'duties',
        'optional',
        'preferred',
        'nice to have',
        'plus',
        'what you will do',
        'who you are'
    ];

    // Count how many unique keywords are present
    let matchCount = 0;
    const minMatches = 2; // Require at least 2 distinct keywords

    for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
            matchCount++;
        }
        if (matchCount >= minMatches) return true;
    }

    return false;
};

module.exports = { isResume, isJobDescription };
