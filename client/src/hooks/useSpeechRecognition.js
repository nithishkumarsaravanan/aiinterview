import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        setSupported(true);

        recognitionRef.current.onstart = () => {
          setListening(true);
        };

        recognitionRef.current.onend = () => {
          setListening(false);
        };

        recognitionRef.current.onError = (event) => {
          console.error('Speech recognition error', event.error);
          setListening(false);
        };

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          setTranscript(finalTranscript + interimTranscript);
        };
      }
    }
  }, []);


  // Reset transcript when needed
  const resetTranscript = () => {
    setTranscript('');
  };

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      try {
        resetTranscript();
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  };

  return { 
    startListening, 
    stopListening, 
    transcript, 
    listening, 
    supported,
    resetTranscript,
    setTranscript
  };
};

export default useSpeechRecognition;
