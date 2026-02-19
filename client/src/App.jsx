import { useState } from 'react';
import axios from 'axios';
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

  const handleSubmitAnswers = async () => {
    setError('');
    setEvaluating(true);

    try {
      const response = await axios.post('http://localhost:5000/api/evaluate-answers', {
        interviewId,
        answers
      });

      if (response.data && response.data.evaluation) {
        setEvaluation(response.data.evaluation);
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
            <div className="questions-card">
              <h2>Interview Questions</h2>
              <p className="instruction-text">Please answer the following questions to the best of your ability.</p>
              
              <div className="questions-list">
                {questions.map((q, index) => (
                  <div key={index} className="question-item-container">
                    <div className="question-text">
                      <span className="question-number">Q{index + 1}.</span>
                      {q}
                    </div>
                    <textarea 
                      className="answer-textarea"
                      placeholder="Type your answer here..."
                      rows="4"
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button onClick={handleSubmitAnswers} className="btn-generate btn-evaluate" disabled={evaluating}>
                {evaluating ? 'Evaluating Answers...' : 'Submit Answers'}
              </button>
              
              {error && <p className="error-message">{error}</p>}
            </div>
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
