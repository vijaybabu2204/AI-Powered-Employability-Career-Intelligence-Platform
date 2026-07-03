import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileCheck, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  Compass, 
  ListTodo,
  Sparkles,
  History
} from 'lucide-react';
import { uploadResume, fetchResumeResults } from '../services/api';

export default function ResumeAnalyzer({ currentStudent }) {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [currentStudent]);

  const loadHistory = async () => {
    try {
      const data = await fetchResumeResults();
      // Filter history for current student
      const studentHistory = data
        .filter(r => r.StudentID === currentStudent.StudentID)
        .sort((a, b) => b.ResumeID - a.ResumeID); // Latest first
      setHistory(studentHistory);
    } catch (err) {
      console.error("Error loading resume history", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await uploadResume(file);
      // Sanitize backend response fields to map consistently with history data formats
      const mapped = {
        candidate_name: result.candidate_name,
        email: result.email,
        phone: result.phone,
        education: parseList(result.education),
        experience: result.experience,
        skills: parseList(result.skills),
        missing_skills: parseList(result.missing_skills),
        best_roles: parseList(result.best_roles),
        role_match: result.role_match,
        ats_score: result.ats_score,
        strengths: parseList(result.strengths),
        weaknesses: parseList(result.weaknesses),
        resume_suggestions: parseList(result.resume_suggestions),
        recommended_courses: parseList(result.recommended_courses),
        recommended_projects: parseList(result.recommended_projects),
        career_summary: result.career_summary
      };
      setAnalysis(mapped);
      loadHistory(); // Refresh history
    } catch (err) {
      console.error(err);
      setError("Failed to analyze resume. Please ensure the backend is running and Ollama is online.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse strings/arrays into clean arrays
  const parseList = (value) => {
    if (!value) return [];
    let arr = [];
    if (Array.isArray(value)) {
      arr = value;
    } else if (typeof value === 'string') {
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          arr = JSON.parse(value);
        } catch (e) {
          // Fall through
        }
      } else {
        arr = value.split(',').map(item => item.trim()).filter(Boolean);
      }
    }
    
    // Sanitize items inside array to guarantee they are safe strings/React children
    return arr.map(item => {
      if (typeof item === 'object' && item !== null) {
        if (item.title) {
          let text = item.title;
          if (item.platform) text += ` (${item.platform})`;
          else if (item.provider) text += ` (${item.provider})`;
          if (item.url) return text + ` - ${item.url}`;
          return text;
        }
        if (item.name) {
          return item.name + (item.description ? `: ${item.description}` : '');
        }
        return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      return String(item);
    });
  };

  const selectHistoryItem = (item) => {
    // Map DB record columns back to frontend expected fields
    const mapped = {
      candidate_name: item.CandidateName,
      email: item.Email,
      phone: item.Phone,
      education: parseList(item.Education),
      experience: item.Experience,
      skills: parseList(item.SkillsFound),
      missing_skills: parseList(item.MissingSkills),
      best_roles: parseList(item.BestRole),
      role_match: item.RoleMatch,
      ats_score: item.ATSScore,
      strengths: parseList(item.Strengths),
      weaknesses: parseList(item.Weaknesses),
      resume_suggestions: parseList(item.Suggestions),
      recommended_courses: parseList(item.RecommendedCourses),
      recommended_projects: parseList(item.RecommendedProjects)
    };
    setAnalysis(mapped);
    setShowHistory(false);
  };

  // Circular progress stroke calculation
  const getStrokeDashoffset = (score) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>ATS Resume Analyzer</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Upload your resume PDF to scan it for ATS keyword optimization, score match, and skills analysis.
          </p>
        </div>
        <div>
          {history.length > 0 && (
            <button 
              className="btn btn-primary"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', boxShadow: 'none', border: '1px solid var(--glass-border)' }}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={18} />
              {showHistory ? "Show Upload Form" : "View Upload History"}
            </button>
          )}
        </div>
      </div>

      {showHistory ? (
        <div className="glass-panel p-6">
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.5rem' }}>Previous Resume Scans</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Candidate Name</th>
                  <th>Best Role</th>
                  <th>ATS Score</th>
                  <th>Role Match</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.UploadDate).toLocaleDateString()}</td>
                    <td>{h.CandidateName || 'Unknown'}</td>
                    <td>{h.BestRole || 'N/A'}</td>
                    <td>
                      <span className={`font-semibold ${h.ATSScore >= 75 ? 'text-success' : h.ATSScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                        {h.ATSScore}%
                      </span>
                    </td>
                    <td>{h.RoleMatch}%</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => selectHistoryItem(h)}>
                        Load Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {!analysis && !loading && (
            <div className="glass-panel p-6" style={{ maxWidth: '700px', margin: '0 auto' }}>
              <form onSubmit={handleUpload}>
                <div className="upload-dropzone">
                  <label htmlFor="resume-file" style={{ cursor: 'pointer' }}>
                    <div className="upload-icon">
                      <Upload size={32} />
                    </div>
                    <h3>Drag & Drop your Resume</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Supports standard PDF files up to 10MB
                    </p>
                    {file && (
                      <div className="flex-center gap-2 mt-4" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
                        <FileCheck size={20} />
                        <span>{file.name}</span>
                      </div>
                    )}
                  </label>
                  <input 
                    type="file" 
                    id="resume-file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </div>

                {error && (
                  <div className="flex-center gap-2 mt-4" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="text-center mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!file}
                    style={{ minWidth: '180px' }}
                  >
                    Analyze Resume
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && (
            <div className="glass-panel p-6 text-center" style={{ maxWidth: '600px', margin: '3rem auto' }}>
              <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
              </div>
              <h3 className="gradient-text">Analyzing your resume...</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Our system is parsing your PDF text and invoking Llama 3.1 LLM to extract skills, evaluate ATS matching, and generate recommendations. This may take 10-15 seconds.
              </p>
            </div>
          )}

          {analysis && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Back to upload button */}
              <div>
                <button 
                  className="btn" 
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  onClick={() => setAnalysis(null)}
                >
                  ← Scan Another Resume
                </button>
              </div>

              {/* Top Summary Panel */}
              <div className="glass-panel p-6" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="scores-container" style={{ margin: 0, justifyContent: 'center' }}>
                  <div className="circular-score">
                    <svg className="circle-svg">
                      <defs>
                        <linearGradient id="atsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <circle className="circle-bg" cx="60" cy="60" r="50" />
                      <circle 
                        className="circle-progress ats" 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={getStrokeDashoffset(analysis.ats_score || 0)}
                      />
                      <text className="circle-text" x="60" y="66" textAnchor="middle">
                        {analysis.ats_score || 0}%
                      </text>
                    </svg>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>ATS Match Score</span>
                  </div>

                  <div className="circular-score">
                    <svg className="circle-svg">
                      <defs>
                        <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <circle className="circle-bg" cx="60" cy="60" r="50" />
                      <circle 
                        className="circle-progress match" 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={getStrokeDashoffset(analysis.role_match || 0)}
                      />
                      <text className="circle-text" x="60" y="66" textAnchor="middle">
                        {analysis.role_match || 0}%
                      </text>
                    </svg>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Role Fit Level</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem' }}>
                  <h2 className="gradient-text" style={{ fontSize: '1.8rem', fontFamily: 'var(--font-title)' }}>
                    {analysis.candidate_name || 'Candidate Report'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Email:</span> {analysis.email || 'N/A'} | <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Phone:</span> {analysis.phone || 'N/A'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {parseList(analysis.best_roles).map((r, i) => (
                      <span key={i} className="skill-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderColor: 'rgba(99, 102, 241, 0.3)', fontWeight: '600' }}>
                        {r}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {analysis.career_summary || 'Your profile indicates robust baseline capabilities aligned with modern technological roles. Review recommendations below to improve.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills and Gaps Panel */}
              <div className="details-grid" style={{ margin: 0 }}>
                <div className="glass-panel p-6">
                  <h4 style={{ color: 'var(--success)' }}>
                    <CheckCircle2 size={18} />
                    <span>Skills Found ({parseList(analysis.skills).length})</span>
                  </h4>
                  <div className="skills-container" style={{ marginTop: '0.75rem' }}>
                    {parseList(analysis.skills).map((s, i) => (
                      <span key={i} className="skill-badge high">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h4 style={{ color: 'var(--warning)' }}>
                    <AlertTriangle size={18} />
                    <span>Keyword & Skill Gaps ({parseList(analysis.missing_skills).length})</span>
                  </h4>
                  <div className="skills-container" style={{ marginTop: '0.75rem' }}>
                    {parseList(analysis.missing_skills).length > 0 ? (
                      parseList(analysis.missing_skills).map((s, i) => (
                        <span key={i} className="skill-badge gap">
                          {s}
                        </span>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Excellent! No major missing skills identified.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Details & Action Items Grid */}
              <div className="details-grid" style={{ margin: 0 }}>
                <div className="glass-panel details-card">
                  <h4>
                    <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                    <span>Strengths</span>
                  </h4>
                  <ul className="bullets-list">
                    {parseList(analysis.strengths).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                <div className="glass-panel details-card">
                  <h4>
                    <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                    <span>Weaknesses / Areas of Growth</span>
                  </h4>
                  <ul className="bullets-list">
                    {parseList(analysis.weaknesses).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              {/* Suggestions and Projects */}
              <div className="details-grid" style={{ margin: 0 }}>
                <div className="glass-panel details-card">
                  <h4>
                    <ListTodo size={18} style={{ color: 'var(--accent-cyan)' }} />
                    <span>Resume Optimization Suggestions</span>
                  </h4>
                  <ul className="suggestions-list">
                    {parseList(analysis.resume_suggestions).map((s, i) => (
                      <li key={i}>
                        <span className="bullet-icon" style={{ color: 'var(--accent-cyan)' }}>✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel details-card">
                  <h4>
                    <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
                    <span>Recommended Upskilling Path</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Courses:</p>
                      <ul className="bullets-list">
                        {parseList(analysis.recommended_courses).map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hands-on Projects:</p>
                      <ul className="bullets-list">
                        {parseList(analysis.recommended_projects).map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
