import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquareCode, 
  Send, 
  CheckCircle, 
  Award, 
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Volume1
} from 'lucide-react';
import { mockInterview, evaluateFullInterview, fetchResumeResults, fetchInterviewHistory } from '../services/api';

const renderCategory = (cat) => {
  if (typeof cat === 'object' && cat !== null) {
    if (cat.category) {
      let text = cat.category;
      if (cat.languages) {
        const langs = Array.isArray(cat.languages) ? cat.languages.join(', ') : String(cat.languages);
        text += ` - ${langs}`;
      }
      return text;
    }
    return Object.values(cat).map(String).join(' - ');
  }
  return String(cat);
};

export default function MockInterview({ currentStudent }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewRole, setInterviewRole] = useState('Software Engineer');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sessionActive, setSessionActive] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  
  // Local storage for user answers: [ { question: "...", answer: "...", category: "..." } ]
  const [scoresAccumulator, setScoresAccumulator] = useState([]);
  
  // Bulk Evaluation state
  const [bulkEvaluation, setBulkEvaluation] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Completed sessions history list
  const [completedSessions, setCompletedSessions] = useState([]);

  // Voice Speech Recognition States & Refs
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  // Voice Speech Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadHistory = async () => {
    if (!currentStudent) return;
    try {
      const allHist = await fetchInterviewHistory(currentStudent.StudentID);
      const filtered = allHist
        .filter(h => h.StudentID === currentStudent.StudentID && h.Question?.startsWith("Full Mock"))
        .map(h => {
          const role = h.Question.replace("Full Mock Interview:", "").trim();
          return {
            role: role || 'Software Engineer',
            date: new Date(h.CreatedAt).toLocaleDateString(),
            questionsCount: 10,
            avgScore: h.OverallScore || 0
          };
        });
      setCompletedSessions(filtered);
    } catch (err) {
      console.error("Error loading interview logs", err);
    }
  };

  useEffect(() => {
    if (!currentStudent) return;
    
    // Resolve role
    const resolveRole = async () => {
      try {
        const results = await fetchResumeResults();
        const studentResumes = results.filter(r => r.StudentID === currentStudent.StudentID);
        if (studentResumes.length > 0) {
          const latest = studentResumes[studentResumes.length - 1];
          if (latest.BestRole) {
            const role = latest.BestRole.split(',')[0].trim();
            setInterviewRole(role);
          }
        }
      } catch (err) {
        console.error("Error fetching student profile for interview", err);
      }
    };
    
    resolveRole();
    loadHistory();

    // Check localStorage to restore active session or evaluation
    const savedEval = localStorage.getItem(`latest_interview_${currentStudent.StudentID}`);
    if (savedEval) {
      try {
        const parsed = JSON.parse(savedEval);
        if (parsed.evaluation) setBulkEvaluation(parsed.evaluation);
        if (parsed.answers) setScoresAccumulator(parsed.answers);
        if (parsed.questions) setQuestions(parsed.questions);
        if (parsed.completed !== undefined) setInterviewCompleted(parsed.completed);
        if (parsed.role) setInterviewRole(parsed.role);
        if (parsed.currentIdx !== undefined) setCurrentIdx(parsed.currentIdx);
        if (parsed.sessionActive !== undefined) setSessionActive(parsed.sessionActive);
      } catch (err) {
        console.error("Error restoring interview session from localStorage", err);
      }
    }
  }, [currentStudent]);

  // Speech Recognition (Speech-to-Text) Initialization
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
      return;
    }
    setError(null);
    setIsListening(true);

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop after a pause
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserAnswer(prev => prev.trim() ? prev + ' ' + transcript : transcript);
    };

    rec.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please verify microphone permissions in browser settings.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
    recognition.current = rec;
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  // Speech Synthesis (Text-to-Speech)
  const speakQuestion = (text) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop active speaking
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Google')) ||
                         voices.find(voice => voice.lang.startsWith('en')) ||
                         voices[0];
                         
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Automatically read questions aloud when advancing
  useEffect(() => {
    if (sessionActive && questions.length > 0) {
      speakQuestion(questions[currentIdx].question);
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [currentIdx, sessionActive, questions]);

  const handleStartInterview = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIdx(0);
    setScoresAccumulator([]);
    setInterviewCompleted(false);
    setBulkEvaluation(null);

    try {
      const data = await mockInterview(interviewRole);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setSessionActive(true);
        
        if (currentStudent) {
          localStorage.setItem(`latest_interview_${currentStudent.StudentID}`, JSON.stringify({
            role: interviewRole,
            answers: [],
            questions: data.questions,
            completed: false,
            currentIdx: 0,
            sessionActive: true,
            evaluation: null
          }));
        }
      } else {
        throw new Error("No questions returned");
      }
    } catch (err) {
      console.error(err);
      setError("Could not generate interview questions. Please upload a resume PDF in the 'Resume Analyzer' tab first so we can tailor the mock interview questions to your skills.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    stopListening();
    stopSpeaking();

    // Store question and answer block locally
    const currentQ = questions[currentIdx];
    const item = {
      question: currentQ.question,
      answer: userAnswer.trim(),
      category: currentQ.category || 'General'
    };

    const newAccumulator = [...scoresAccumulator, item];
    setScoresAccumulator(newAccumulator);

    let nextIdx = currentIdx;
    let active = sessionActive;
    let completed = interviewCompleted;

    // Go to next question or complete sessions
    if (currentIdx < questions.length - 1) {
      nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setUserAnswer('');
    } else {
      active = false;
      completed = true;
      setSessionActive(false);
      setInterviewCompleted(true);
    }

    if (currentStudent) {
      localStorage.setItem(`latest_interview_${currentStudent.StudentID}`, JSON.stringify({
        role: interviewRole,
        answers: newAccumulator,
        questions: questions,
        completed: completed,
        currentIdx: nextIdx,
        sessionActive: active,
        evaluation: null
      }));
    }
  };

  const handleGenerateAnalysis = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const data = await evaluateFullInterview(scoresAccumulator, interviewRole, currentStudent?.StudentID);
      
      // Robust sanitization to guard against malformed LLM outputs and avoid white/black screens
      const sanitized = {
        technical_score: data?.technical_score ?? 0,
        communication_score: data?.communication_score ?? 0,
        grammar_score: data?.grammar_score ?? 0,
        overall_score: data?.overall_score ?? 0,
        general_feedback: typeof data?.general_feedback === 'string' ? data.general_feedback : 'No general feedback provided.',
        grammar_feedback: typeof data?.grammar_feedback === 'string' ? data.grammar_feedback : 'No grammatical feedback provided.',
        breakdown: Array.isArray(data?.breakdown) ? data.breakdown.map((item, idx) => ({
          question: item?.question || questions[idx]?.question || `Question ${idx + 1}`,
          candidate_answer: item?.candidate_answer || scoresAccumulator[idx]?.answer || 'No answer recorded.',
          expert_answer: item?.expert_answer || 'No model solution provided.',
          score: item?.score ?? 0,
          feedback: item?.feedback || 'No question feedback provided.',
          category: item?.category || scoresAccumulator[idx]?.category || 'General'
        })) : []
      };

      setBulkEvaluation(sanitized);

      if (currentStudent) {
        localStorage.setItem(`latest_interview_${currentStudent.StudentID}`, JSON.stringify({
          role: interviewRole,
          answers: scoresAccumulator,
          questions: questions,
          completed: true,
          currentIdx: currentIdx,
          sessionActive: false,
          evaluation: sanitized
        }));
      }

      await loadHistory();
    } catch (err) {
      console.error(err);
      setError("Could not analyze interview responses. Verify the backend and LLM are online.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    stopSpeaking();
    stopListening();
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswer('');
    setSessionActive(false);
    setInterviewCompleted(false);
    setScoresAccumulator([]);
    setBulkEvaluation(null);

    if (currentStudent) {
      localStorage.removeItem(`latest_interview_${currentStudent.StudentID}`);
    }
  };

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>AI Technical Mock Interview</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Simulate a real coding and system design mock interview. Get instant evaluations and correct answers.
          </p>
        </div>
      </div>

      {/* Start screen */}
      {!sessionActive && !interviewCompleted && !bulkEvaluation && (
        <div className="glass-panel p-6 text-center" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <MessageSquareCode size={48} style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)', opacity: 0.8 }} />
          <h3>Start AI Mock Interview Room</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            We'll customize 10 interview questions spanning HR, SQL, Python, System Design, and projects found in your resume. Use voice assistance to speak your answers aloud.
          </p>

          <div className="form-group" style={{ maxWidth: '300px', margin: '0 auto 1.5rem', textAlign: 'left' }}>
            <label style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>Interview Target Role</label>
            <select 
              value={interviewRole} 
              onChange={(e) => setInterviewRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Software Engineer" style={{ background: 'var(--bg-secondary)' }}>Software Engineer</option>
              <option value="Python Developer" style={{ background: 'var(--bg-secondary)' }}>Python Developer</option>
              <option value="Data Analyst" style={{ background: 'var(--bg-secondary)' }}>Data Analyst</option>
              <option value="AI/ML Engineer" style={{ background: 'var(--bg-secondary)' }}>AI/ML Engineer</option>
              <option value="Data Scientist" style={{ background: 'var(--bg-secondary)' }}>Data Scientist</option>
              <option value="Full Stack Developer" style={{ background: 'var(--bg-secondary)' }}>Full Stack Developer</option>
              <option value="VLSI Engineer" style={{ background: 'var(--bg-secondary)' }}>VLSI Engineer</option>
              <option value="Embedded Systems Engineer" style={{ background: 'var(--bg-secondary)' }}>Embedded Systems Engineer</option>
            </select>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleStartInterview}
            disabled={loading}
            style={{ minWidth: '180px' }}
          >
            {loading ? "Generating Room..." : "Begin Mock Interview"}
          </button>

          {error && (
            <div className="flex-center gap-2 mt-4" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} />
              <span style={{ maxWidth: '450px', textAlign: 'left', lineHeight: '1.4' }}>{error}</span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="glass-panel p-6 text-center" style={{ maxWidth: '600px', margin: '3rem auto' }}>
          <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
          </div>
          <h3 className="gradient-text">Generating customized questions...</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            The AI is reading your resume, identifying key project architectures, and building 10 core interview questions. Please wait about 10 seconds.
          </p>
        </div>
      )}

      {/* Active Q&A Interface */}
      {sessionActive && questions.length > 0 && (
        <div className="interview-chat">
          
          {/* Header Progress */}
          <div className="glass-panel p-4 flex-between" style={{ borderRadius: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Interviewing for: <strong style={{ color: 'var(--accent-cyan)' }}>{interviewRole}</strong>
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>

          {/* AI Question Bubble with speak triggers */}
          <div className="chat-bubble bot glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <div className="flex-between">
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-cyan)', margin: 0, fontWeight: '700' }}>
                Interviewer ({renderCategory(questions[currentIdx].category) || 'General'})
              </p>
              <button
                type="button"
                onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(questions[currentIdx].question)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isSpeaking ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{isSpeaking ? 'Mute' : 'Speak'}</span>
              </button>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {questions[currentIdx].question}
            </p>
          </div>

          {/* User Voice/Text Answer Area */}
          <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '0.25rem', overflow: 'hidden' }}>
              <textarea
                placeholder="Type your detailed technical answer here... OR click the microphone button below to record your voice response."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '130px',
                  padding: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-main)',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Mic Input controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                    border: isListening ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
                    color: isListening ? 'var(--danger)' : 'var(--accent-cyan)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                {isListening ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <span className="voice-wave-bar"></span>
                    <span className="voice-wave-bar" style={{ animationDelay: '0.15s' }}></span>
                    <span className="voice-wave-bar" style={{ animationDelay: '0.3s' }}></span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '700', marginLeft: '0.25rem' }}>Recording... Speak now.</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click microphone to record voice</span>
                )}
              </div>

              <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  onClick={handleReset}
                >
                  Quit Session
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!userAnswer.trim()}
                >
                  {currentIdx < questions.length - 1 ? "Next Question" : "Finish Interview"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </form>
          
          {error && (
            <div className="flex-center gap-2 mt-4" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Gated Post-Interview Summary: Analysis Trigger */}
      {interviewCompleted && !bulkEvaluation && (
        <div className="glass-panel p-6 text-center" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 1rem' }} />
          <h3>All Questions Completed!</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Excellent. You have recorded answers for all {questions.length} mock interview questions. Let's analyze your overall verbal accuracy, grammar structures, and core technical compatibility.
          </p>

          <button 
            className="btn btn-primary"
            onClick={handleGenerateAnalysis}
            disabled={analyzing}
            style={{ minWidth: '220px' }}
          >
            {analyzing ? "Analyzing responses..." : "Analyze Interview Results"}
          </button>

          {analyzing && (
            <div className="flex-center" style={{ marginTop: '1.5rem', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Synthesizing feedback matrices. Please wait about 10-15 seconds...</p>
            </div>
          )}

          {error && (
            <div className="flex-center gap-2 mt-4" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Report Dashboard */}
      {bulkEvaluation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Overall Scorecard */}
          <div className="glass-panel p-6" style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
            <div className="text-center" style={{ marginBottom: '1.5rem' }}>
              <Award size={44} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem' }} />
              <h2 className="gradient-text">Interview Performance Evaluation</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Unified grading report for: <strong style={{ color: 'var(--accent-cyan)' }}>{interviewRole}</strong>
              </p>
            </div>

            <div className="score-widget-container" style={{ margin: '2rem 0' }}>
              <div className="score-mini-card">
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Technical accuracy</p>
                <div className="score-number" style={{ color: 'var(--accent-cyan)' }}>
                  {bulkEvaluation.technical_score}/10
                </div>
              </div>

              <div className="score-mini-card">
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Communication</p>
                <div className="score-number" style={{ color: 'var(--accent-secondary)' }}>
                  {bulkEvaluation.communication_score}/10
                </div>
              </div>

              <div className="score-mini-card">
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grammar Score</p>
                <div className="score-number" style={{ color: 'var(--success)' }}>
                  {bulkEvaluation.grammar_score}/10
                </div>
              </div>

              <div className="score-mini-card" style={{ background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: '700' }}>Overall rating</p>
                <div className="score-number" style={{ color: 'var(--accent-primary)' }}>
                  {bulkEvaluation.overall_score}/10
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'left', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>General Review Feedback:</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{bulkEvaluation.general_feedback}</p>
              </div>
              
              {bulkEvaluation.grammar_feedback && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Grammatical Mistakes & Corrections:</p>
                  <p style={{ fontSize: '0.95rem', color: '#fca5a5', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{bulkEvaluation.grammar_feedback}</p>
                </div>
              )}
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="glass-panel p-6">
            <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', fontSize: '1.25rem' }}>
              Question-by-Question Diagnostics
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {bulkEvaluation.breakdown?.map((item, idx) => (
                <div key={idx} style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Question {idx + 1} ({item.category || 'General'}):
                  </p>
                  <p style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                    {item.question}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Your Answer:</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>"{item.candidate_answer || 'No spoken answer recorded.'}"</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Expert Model Solution:</p>
                      <p style={{ fontSize: '0.9rem', color: '#a7f3d0', lineHeight: '1.5' }}>{item.expert_answer}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong>Score: {item.score || 0}/10</strong> | {item.feedback}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleReset} style={{ minWidth: '180px' }}>
                <RefreshCw size={16} />
                Practice New Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed session reports history log */}
      {completedSessions.length > 0 && !sessionActive && !interviewCompleted && !bulkEvaluation && (
        <div className="glass-panel p-6 mt-4">
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--accent-secondary)' }} />
            Interview History Logs
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th>Target Role</th>
                  <th>Total Qs</th>
                  <th>AI Score Rating</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.map((s, i) => (
                  <tr key={i}>
                    <td>{s.date}</td>
                    <td>{s.role}</td>
                    <td>{s.questionsCount} Questions</td>
                    <td>
                      <strong style={{ color: s.avgScore >= 7 ? 'var(--success)' : s.avgScore >= 5 ? 'var(--warning)' : 'var(--danger)' }}>
                        {s.avgScore} / 10
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
