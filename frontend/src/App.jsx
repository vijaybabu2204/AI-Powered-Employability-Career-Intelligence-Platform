import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import PlacementPredictor from './components/PlacementPredictor';
import LearningRoadmap from './components/LearningRoadmap';
import MockInterview from './components/MockInterview';
import GitHubAnalyzer from './components/GitHubAnalyzer';
import LoginPortal from './components/LoginPortal';
import { fetchStudents } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("authenticated") === "true"
  );
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  // Theme State
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await fetchStudents();
        setStudents(data);
        if (data.length > 0) {
          const matched = data.find(s => s.Email?.toLowerCase() === currentUser?.email?.toLowerCase());
          if (matched) {
            setCurrentStudent(matched);
          } else {
            setCurrentStudent({
              StudentID: currentUser?.student_id || 1,
              Name: currentUser?.name || 'Candidate',
              Email: currentUser?.email || '',
              Branch: 'Computer Science',
              CGPA: '7.8',
              YearOfStudy: 'Year 4'
            });
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load students. Please verify that the FastAPI backend server is running on http://localhost:8000 and the MySQL database is active.");
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [currentUser]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("authenticated");
    localStorage.removeItem("currentUser");
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.5rem', background: '#0b0f19' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-main)' }}>Initializing Career.AI Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.5rem', background: '#0b0f19', padding: '2rem', textAlign: 'center' }}>
        <div style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', maxWidth: '500px' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>Backend Connection Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPortal 
        onLogin={(userData) => {
          setIsAuthenticated(true);
          setCurrentUser(userData);
          localStorage.setItem("authenticated", "true");
          localStorage.setItem("currentUser", JSON.stringify(userData));
        }} 
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentStudent={currentStudent} 
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="main-content">

        {/* Tab Router Panels */}
        {activeTab === 'dashboard' && <Dashboard currentStudent={currentStudent} />}
        {activeTab === 'resume' && <ResumeAnalyzer currentStudent={currentStudent} />}
        {activeTab === 'placement' && <PlacementPredictor currentStudent={currentStudent} />}
        {activeTab === 'roadmap' && <LearningRoadmap currentStudent={currentStudent} />}
        {activeTab === 'interview' && <MockInterview currentStudent={currentStudent} />}
        {activeTab === 'github' && <GitHubAnalyzer />}
      </main>
    </div>
  );
}
