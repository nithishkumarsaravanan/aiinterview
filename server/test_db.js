const mongoose = require('mongoose');
const Interview = require('./models/Interview');

mongoose.connect('mongodb://localhost:27017/ai-interviewer')
.then(async () => {
    console.log('MongoDB connected for testing');
    
    try {
        const testInterview = new Interview({
            jobDescription: "Test Job Description",
            resumeText: "Test Resume Text",
            questions: ["Question 1", "Question 2"]
        });

        await testInterview.save();
        console.log('Test interview saved successfully:', testInterview._id);

        // Verify retrieval
        const retrieved = await Interview.findById(testInterview._id);
        if (retrieved) {
            console.log('Verified: Document retrieved from DB');
        } else {
            console.error('Failed to retrieve document');
        }

    } catch (err) {
        console.error('Error saving test interview:', err);
    } finally {
        mongoose.connection.close();
    }
})
.catch(err => console.error('Connection error:', err));
