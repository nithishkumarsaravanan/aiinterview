import { useState } from 'react';
import axios from 'axios';
import InterviewSession from './components/Interview/InterviewSession';
import './App.css';

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [interviewId, setInterviewId] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setQuestions([]);
    setInterviewId(null);
    setAnswers([]);
    setEvaluation(null);

    if (!jobDescription || !resume) {
      setError('Please provide both a job description and a resume PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    formData.append('resume', resume);

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/generate-questions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
        setInterviewId(response.data.interviewId);
        setAnswers(new Array(response.data.questions.length).fill(''));
      } else {
        setError('Failed to generate questions. Received unexpected response.');
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message;
      setError(`Error: ${backendError}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitAnswers = async (finalAnswers) => {
    setError('');
    setEvaluating(true);
    
    // Use the passed answers if available, otherwise fallback to state (for safety)
    const answersToSubmit = finalAnswers || answers;

    try {
      const response = await axios.post('http://localhost:5000/api/evaluate-answers', {
        interviewId,
        answers: answersToSubmit
      });

      if (response.data && response.data.evaluation) {
        setEvaluation(response.data.evaluation);
        // Also update local state to match what was submitted, for display consistency
        setAnswers(answersToSubmit);
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message;
      setError(`Evaluation Error: ${backendError}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>AI Interviewer Engine</h1>
      </header>

      <main className="main-content">
        {!questions.length && (
          <section className="input-section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  className="input-textarea"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows="6"
                />
              </div>

              <div className="form-group">
                <label htmlFor="resume">Candidate Resume (PDF)</label>
                <input
                  type="file"
                  id="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="input-file"
                />
              </div>

              <button type="submit" className="btn-generate" disabled={loading}>
                {loading ? 'Generating Questions...' : 'Generate Questions'}
              </button>

              {error && <p className="error-message">{error}</p>}
            </form>
          </section>
        )}

        {questions.length > 0 && !evaluation && (
          <section className="results-section">
             {evaluating ? (
                 <div className="loading-indicator">
                     <div className="spinner"></div>
                     <h2>Validating & Scoring Answers...</h2>
                     <p>The AI is analyzing your responses against the job requirements.</p>
                 </div>
             ) : (
                 <InterviewSession 
                    questions={questions}
                    onComplete={(collectedAnswers) => {
                        setAnswers(collectedAnswers);
                        handleSubmitAnswers(collectedAnswers);
                    }}
                 />
             )}
          </section>
        )}

        {evaluation && (
          <section className="evaluation-section">
             <div className="evaluation-card">
                <h2>Interview Evaluation</h2>
                
                <div className="evaluation-header">
                  <div className="score-container">
                    <div className="score-label">Overall Score</div>
                    <div className={`score-value ${evaluation.overall_score >= 7 ? 'high' : evaluation.overall_score >= 4 ? 'medium' : 'low'}`}>
                      {evaluation.overall_score}/10
                    </div>
                  </div>
                  
                  <div className={`recommendation-badge ${
                    evaluation.recommendation.includes('Strong') ? 'high' : 
                    evaluation.recommendation.includes('Reject') ? 'low' : 'medium'
                  }`}>
                    {evaluation.recommendation}
                  </div>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-column">
                    <h3>Strengths</h3>
                    <ul className="analysis-list strengths">
                      {evaluation.strengths.map((str, i) => <li key={i}>{str}</li>)}
                    </ul>
                  </div>
                  <div className="analysis-column">
                    <h3>Weaknesses</h3>
                    <ul className="analysis-list weaknesses">
                      {evaluation.weaknesses.map((weak, i) => <li key={i}>{weak}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="detailed-feedback">
                  <h3>Question Analysis</h3>
                  {questions.map((q, i) => (
                    <div key={i} className="feedback-item">
                      <div className="feedback-question">
                        <strong>Q{i+1}: </strong> {q}
                      </div>
                      <div className="feedback-answer">
                         <strong>Your Answer: </strong> {answers[i] || <i>No answer provided</i>}
                      </div>
                      <div className="feedback-meta">
                        <span className={`mini-score ${evaluation.scores[i] >= 7 ? 'high' : 'low'}`}>
                          Score: {evaluation.scores[i]}/10
                        </span>
                        <p className="feedback-text">{evaluation.feedback[i]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn-generate btn-reset" 
                  onClick={() => {
                    setQuestions([]);
                    setEvaluation(null);
                    setJobDescription('');
                    setResume(null);
                    setAnswers([]);
                  }}
                >
                  Start New Interview
                </button>
             </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
