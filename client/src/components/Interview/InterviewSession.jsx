import React, { useState, useEffect, useRef } from 'react';
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import './InterviewSession.css';

const InterviewSession = ({ questions, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [sessionState, setSessionState] = useState('READY'); // READY, SPEAKING, LISTENING, REVIEW
  const [transcriptBuffer, setTranscriptBuffer] = useState('');

  const { speak, cancel: cancelSpeech, speaking } = useSpeechSynthesis();
  const { 
    startListening, 
    stopListening, 
    transcript, 
    listening, 
    resetTranscript 
  } = useSpeechRecognition();

  // Effect to handle state transitions
  useEffect(() => {
      // We removed the auto-start on IDLE
  }, [sessionState, currentQuestionIndex]);

  // Effect to sync transcript to local buffer
  useEffect(() => {
      if (transcript) {
          setTranscriptBuffer(transcript);
      }
  }, [transcript]);


  const readQuestion = (index) => {
    setSessionState('SPEAKING');
    const text = questions[index];
    speak(text); 
    
    // We need to know when speaking ends to auto-start listening
    // Since our hook doesn't expose a promise, we monitor the 'speaking' state in a separate effect
    // or we can use a timeout as a fallback, but let's try to trust the user controls for now
    // Ideally, we'd have an onEnd callback in the speak function to trigger 'LISTENING'
    // For this MVP, let's make the user click "Start Answering" or auto-start after a delay?
    // Let's go with: Auto-start listening after speech ends is complex without a callback.
    // Let's add a "Start Answering" button for better UX control initially.
  };

  const handleStartListening = () => {
    cancelSpeech(); // Stop TTS if still going
    setSessionState('LISTENING');
    resetTranscript();
    setTranscriptBuffer('');
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
    setSessionState('REVIEW');
    // Save the answer temporarily
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = transcriptBuffer;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      readQuestion(nextIndex);
    } else {
      onComplete(answers);
    }
  };

  const handleReRecord = () => {
      setSessionState('LISTENING');
      resetTranscript();
      setTranscriptBuffer('');
      startListening();
  }

  const handleManualTextChange = (e) => {
      setTranscriptBuffer(e.target.value);
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = e.target.value;
      setAnswers(newAnswers);
  }

  const currentQuestionStr = questions[currentQuestionIndex];

  return (
    <div className="interview-session">
      <div className="interview-progress">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>

      <div className="interview-question-card">
         <h2>{currentQuestionStr}</h2>
         {sessionState === 'SPEAKING' && (
             <div className="speaking-indicator">
                 <span className="pulse"></span> AI is speaking...
             </div>
         )}
      </div>

      <div className="interview-answer-area">
          {sessionState === 'LISTENING' ? (
              <div className="listening-mode">
                  <div className="mic-icon pulse-ring">🎤</div>
                  <p>Listening... speak clearly</p>
                  <p className="live-transcript">{transcriptBuffer || "..."}</p>
                  <button className="btn-control stop" onClick={handleStopListening}>Stop Recording</button>
              </div>
          ) : sessionState === 'REVIEW' ? (
              <div className="review-mode">
                  <textarea 
                    className="answer-textarea" 
                    value={transcriptBuffer}
                    onChange={handleManualTextChange}
                  />
                  <div className="review-controls">
                      <button className="btn-control rerecord" onClick={handleReRecord}>Re-record</button>
                      <button className="btn-control next" onClick={handleNextQuestion}>
                          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Interview'}
                      </button>
                  </div>
              </div>
          ) : sessionState === 'READY' ? (
            <div className="idle-mode">
               <button className="btn-control start" onClick={() => readQuestion(currentQuestionIndex)}>
                   Start Interview
               </button>
            </div>
          ) : (
              <div className="idle-mode">
                 <button className="btn-control start" onClick={handleStartListening}>
                     {sessionState === 'SPEAKING' ? 'Interrupt & Answer' : 'Start Answering'}
                 </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default InterviewSession;
