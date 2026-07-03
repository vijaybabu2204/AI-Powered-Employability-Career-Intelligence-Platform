import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  HelpCircle, 
  Layers, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { predictPlacement, fetchPlacementResults } from '../services/api';

export default function PlacementPredictor({ currentStudent }) {
  const [formData, setFormData] = useState({
    cgpa: 7.5,
    coding_score: 75,
    aptitude_score: 75,
    communication_score: 75,
    projects: 2,
    internships: 1
  });

  const [probability, setProbability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentStudent) {
      setFormData(prev => ({
        ...prev,
        cgpa: parseFloat(currentStudent.CGPA) || 7.5
      }));
      loadHistory();
    }
  }, [currentStudent]);

  const loadHistory = async () => {
    try {
      const data = await fetchPlacementResults();
      const studentHistory = data.filter(h => h.StudentID === currentStudent.StudentID);
      setHistory(studentHistory.reverse()); // Latest first
    } catch (err) {
      console.error("Error fetching placement history", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cgpa' ? parseFloat(value) : parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProbability(null);

    try {
      const res = await predictPlacement(formData);
      setProbability(res.placement_probability);
      loadHistory(); // Reload history
    } catch (err) {
      console.error(err);
      setError("Failed to calculate prediction. Ensure the ML backend and connection are active.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (prob) => {
    if (prob >= 75) return 'var(--success)';
    if (prob >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  // Helper to generate dynamic guidance based on input scores
  const getFeedbackNotes = () => {
    const feedback = [];
    if (formData.cgpa < 7.5) {
      feedback.push({
        type: 'warning',
        text: 'Your CGPA is slightly below the preferred cutoff for premium tier hiring (usually 8.0+). focus on maintaining or improving your academic standing.'
      });
    } else {
      feedback.push({
        type: 'success',
        text: 'Your academic CGPA meets the eligibility criteria for most Tier-1 & Tier-2 organizations.'
      });
    }

    if (formData.coding_score < 70) {
      feedback.push({
        type: 'warning',
        text: 'Focus on Data Structures and Algorithms (DSA) on LeetCode/CodeForces. Aim for consistent weekly practice to raise coding scores.'
      });
    }

    if (formData.aptitude_score < 70) {
      feedback.push({
        type: 'warning',
        text: 'Aptitude is the first elimination round for many companies. Solve Quantitative & Logical Reasoning papers on IndiaBIX.'
      });
    }

    if (formData.projects < 2) {
      feedback.push({
        type: 'warning',
        text: 'A minimum of 2 major projects in React/Python/Cloud is highly recommended to substantiate your resume.'
      });
    }

    if (formData.internships === 0) {
      feedback.push({
        type: 'warning',
        text: 'No internships recorded. Apply for virtual internships or open source contributions to boost real-world exposure.'
      });
    }

    return feedback;
  };

  const getStrokeDashoffset = (score) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>Placement Predictor</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enter your academic and technical performance parameters to compute campus placement probability using our ML model.
          </p>
        </div>
      </div>

      <div className="dashboard-content-layout">
        
        {/* Form Panel */}
        <div className="glass-panel p-6">
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} className="text-cyan-500" style={{ color: '#06b6d4' }} />
            Performance Parameters
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>CGPA (0 - 10)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  name="cgpa" 
                  value={formData.cgpa}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Coding Score (0 - 100)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  name="coding_score" 
                  value={formData.coding_score}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Aptitude Score (0 - 100)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  name="aptitude_score" 
                  value={formData.aptitude_score}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Communication (0 - 100)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  name="communication_score" 
                  value={formData.communication_score}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Academic Projects</label>
                <input 
                  type="number" 
                  min="0" 
                  max="10" 
                  name="projects" 
                  value={formData.projects}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Internships Completed</label>
                <input 
                  type="number" 
                  min="0" 
                  max="10" 
                  name="internships" 
                  value={formData.internships}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? "Computing Prediction..." : "Predict Campus Placement Probability"}
              </button>
            </div>
          </form>

          {error && (
            <div className="flex-center gap-2 mt-4" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results Gauge Panel */}
        <div className="glass-panel p-6 flex-center" style={{ flexDirection: 'column', minHeight: '320px' }}>
          {probability !== null ? (
            <div className="text-center" style={{ width: '100%' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1rem' }}>Placement Probability</h3>
              
              <div className="flex-center" style={{ margin: '1.5rem 0' }}>
                <div className="circular-score">
                  <svg className="circle-svg" style={{ width: '150px', height: '150px' }}>
                    <defs>
                      <linearGradient id="probGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={getScoreColor(probability)} />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                    <circle className="circle-bg" cx="75" cy="75" r="65" strokeWidth="10" />
                    <circle 
                      className="circle-progress" 
                      cx="75" 
                      cy="75" 
                      r="65" 
                      strokeWidth="10"
                      stroke="url(#probGradient)"
                      strokeDasharray={2 * Math.PI * 65}
                      strokeDashoffset={getStrokeDashoffset(probability)}
                    />
                    <text 
                      className="circle-text" 
                      x="75" 
                      y="82" 
                      textAnchor="middle" 
                      style={{ fontSize: '1.8rem', fill: getScoreColor(probability) }}
                    >
                      {probability}%
                    </text>
                  </svg>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'inline-block' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Likely Target Role: <strong style={{ color: 'var(--text-primary)' }}>Data Analyst</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center" style={{ color: 'var(--text-muted)' }}>
              <TrendingUp size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Fill out the technical metrics form and click Predict to display campus hiring forecast.</p>
            </div>
          )}
        </div>

      </div>

      {probability !== null && (
        <div className="glass-panel p-6 mt-4">
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={18} style={{ color: 'var(--accent-primary)' }} />
            Targeted Skill & Placement Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {getFeedbackNotes().map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', borderRadius: '8px', background: f.type === 'success' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', border: f.type === 'success' ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(245,158,11,0.15)' }}>
                {f.type === 'success' ? (
                  <CheckCircle size={18} className="text-success" style={{ marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={18} className="text-warning" style={{ marginTop: '2px', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History panel */}
      {history.length > 0 && (
        <div className="glass-panel p-6 mt-4">
          <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: 'var(--accent-secondary)' }} />
            Prediction Run History
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>CGPA</th>
                  <th>Coding Score</th>
                  <th>Aptitude Score</th>
                  <th>Comm. Score</th>
                  <th>Projects</th>
                  <th>Internships</th>
                  <th>Predicted Probability</th>
                  <th>Predicted Role</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{h.CGPA}</td>
                    <td>{h.CodingScore}</td>
                    <td>{h.AptitudeScore}</td>
                    <td>{h.CommunicationScore}</td>
                    <td>{h.Projects}</td>
                    <td>{h.Internships}</td>
                    <td>
                      <strong style={{ color: getScoreColor(h.PlacementProbability) }}>
                        {h.PlacementProbability}%
                      </strong>
                    </td>
                    <td>{h.PredictedRole}</td>
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
