import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Map, 
  MessageSquareCode,
  Terminal,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

const Github = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={props.size || 20} 
    height={props.size || 20} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Sidebar({ activeTab, setActiveTab, currentStudent, onLogout, theme, toggleTheme }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'placement', label: 'Placement Predictor', icon: TrendingUp },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Map },
    { id: 'interview', label: 'Mock Interview', icon: MessageSquareCode },
    { id: 'github', label: 'GitHub Analyzer', icon: Github },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Terminal style={{ color: 'var(--accent-cyan)' }} size={28} />
        <span className="gradient-text">CAREER.AI</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <a 
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      {currentStudent && (
        <div className="sidebar-footer">
          <div className="sidebar-profile" style={{ marginBottom: '0.75rem' }}>
            <div className="profile-avatar">
              {currentStudent.Name ? currentStudent.Name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <h4>{currentStudent.Name || 'User'}</h4>
              <p>{currentStudent.Email || 'No Email'}</p>
            </div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} style={{ marginBottom: '0.5rem' }}>
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
