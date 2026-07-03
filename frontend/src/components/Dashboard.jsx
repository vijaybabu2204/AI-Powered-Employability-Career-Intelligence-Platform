import React, { useEffect, useState } from 'react';
import { 
  Award, 
  BookOpen, 
  TrendingUp, 
  CheckCircle,
  Briefcase,
  User,
  Clock
} from 'lucide-react';
import { fetchSkills, fetchPlacementResults, fetchResumeResults } from '../services/api';

export default function Dashboard({ currentStudent }) {
  const [skills, setSkills] = useState([]);
  const [placementHistory, setPlacementHistory] = useState([]);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStudent) return;
    setLoading(true);
    
    Promise.all([
      fetchSkills(),
      fetchPlacementResults(),
      fetchResumeResults()
    ]).then(([allSkills, allPlacements, allResumes]) => {
      // Filter by current student id
      const studentId = currentStudent.StudentID;
      
      const filteredSkills = allSkills.filter(s => s.StudentID === studentId);
      setSkills(filteredSkills);

      const filteredPlacements = allPlacements.filter(p => p.StudentID === studentId);
      setPlacementHistory(filteredPlacements);

      const filteredResumes = allResumes.filter(r => r.StudentID === studentId);
      setResumeHistory(filteredResumes);
      
      setLoading(false);
    }).catch(err => {
      console.error("Error loading dashboard data", err);
      setLoading(false);
    });
  }, [currentStudent]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Get unique skills
  const uniqueSkills = [...new Set(skills.map(s => s.SkillName))];

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>Welcome Back, {currentStudent?.Name || 'User'}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Track your career growth, optimize your resume, and practice for technical interviews.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel metric-card">
          <div className="metric-details">
            <p>Academic Standing</p>
            <h3>{currentStudent?.CGPA || 'N/A'} CGPA</h3>
          </div>
          <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
            <Award size={24} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-details">
            <p>Verified Skills</p>
            <h3>{uniqueSkills.length} Skills</h3>
          </div>
          <div className="metric-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
            <BookOpen size={24} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-details">
            <p>Placement Checks</p>
            <h3>{placementHistory.length} Predictions</h3>
          </div>
          <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary)' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-details">
            <p>Resume Submissions</p>
            <h3>{resumeHistory.length} Analyzed</h3>
          </div>
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-content-layout">
        <div className="glass-panel dashboard-skills-panel">
          <h3 className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontFamily: 'var(--font-title)' }}>
            <span>Verified Skills Profile</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>Active DB Records</span>
          </h3>
          {uniqueSkills.length > 0 ? (
            <div className="skills-container">
              {uniqueSkills.map((skill, idx) => (
                <span key={idx} className="skill-badge high">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No skills recorded. Upload a resume to populate your profile.</p>
          )}
        </div>

        <div className="glass-panel dashboard-activity-panel">
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontFamily: 'var(--font-title)' }}>
            Student Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="metric-icon" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                <User size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch / Department</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>{currentStudent?.Branch || 'General'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="metric-icon" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                <Clock size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Year of Study</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>Year {currentStudent?.YearOfStudy || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="metric-icon" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                <Briefcase size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Career Path</p>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                  {resumeHistory.length > 0 ? resumeHistory[resumeHistory.length - 1].BestRole : 'Not Determined'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
