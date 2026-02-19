import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import InterviewSession from '../components/Interview/InterviewSession';
import '../App.css';

const InterviewPage = () => {
    const { token } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [completed, setCompleted] = useState(false);
    
    // Check if interview is valid
    useEffect(() => {
        const init = async () => {
            try {
                // Get Candidate
                const candRes = await axios.get(`http://localhost:5000/api/candidates/${token}`);
                setCandidate(candRes.data);

                // MOCK: Generate questions based on resume Text (we would usually optimize this)
                // For MVP: We generate questions dynamically now
                if(candRes.data.status === 'SCHEDULED' || candRes.data.status === 'COMPLETED') {
                     // In real app, we check time window here
                }
                
                // MOCK JOB DESCRIPTION (In real app, fetch from DB)
                const mockJobDesc = "React, Node.js, MongoDB developer.";
                
                // Generate Questions
                const qRes = await axios.post('http://localhost:5000/api/generate-questions', {
                   jobDescription: mockJobDesc,
                   resumeText: candRes.data.resumeText // We need to add this to GET /candidates route or similar
                });
                
                setQuestions(qRes.data);
                setLoading(false);

            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        init();
    }, [token]);

    const handleComplete = async (answers) => {
        try {
            // MOCK JD
            const mockJobDesc = "React, Node.js, MongoDB developer.";

            await axios.post('http://localhost:5000/api/evaluate-answers', {
                answers,
                jobDescription: mockJobDesc, 
                // We'd pass candidateId/token ideally to link it
            });
            setCompleted(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading">Initializing Interview...</div>;
    if (completed) return <div className="container"><div className="card"><h2>Interview Completed</h2><p>Thank you. HR will be in touch.</p></div></div>;
    if (!candidate) return <div>Invalid Session</div>;

    return (
        <div className="container">
             <header className="header" style={{marginBottom: 0}}>
                <h1>Ai Interview</h1>
                <p>Candidate: {candidate.name}</p>
             </header>
             <InterviewSession questions={questions} onComplete={handleComplete} />
        </div>
    );
};

export default InterviewPage;
