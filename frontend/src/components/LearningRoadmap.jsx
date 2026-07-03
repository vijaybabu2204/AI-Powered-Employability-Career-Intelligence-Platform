import React, { useState } from 'react';
import { 
  Map, 
  BookOpen, 
  Award, 
  Terminal, 
  Lightbulb, 
  Compass, 
  AlertTriangle 
} from 'lucide-react';
import { generateRoadmap } from '../services/api';

const renderTopic = (topic) => {
  if (typeof topic === 'object' && topic !== null) {
    if (topic.category && topic.technologies) {
      const techs = Array.isArray(topic.technologies) ? topic.technologies.join(', ') : String(topic.technologies);
      return `${topic.category}: ${techs}`;
    }
    if (topic.name) {
      return topic.name + (topic.details ? `: ${topic.details}` : '');
    }
    return Object.entries(topic)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
      .join(' | ');
  }
  return String(topic);
};

const renderListItem = (item) => {
  if (typeof item === 'object' && item !== null) {
    if (item.title) {
      let text = item.title;
      if (item.platform) text += ` (${item.platform})`;
      else if (item.provider) text += ` (${item.provider})`;
      if (item.url) return <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', textDecoration: 'underline' }}>{text}</a>;
      return text;
    }
    if (item.name) {
      return item.name + (item.description ? `: ${item.description}` : '');
    }
    return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return String(item);
};

export default function LearningRoadmap({ currentStudent }) {
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setRoadmapData(null);

    try {
      const data = await generateRoadmap();
      setRoadmapData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate learning roadmap. Please ensure you have uploaded a resume in the 'Resume Analyzer' tab first so the LLM has a profile to base the roadmap on.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>Personalized Learning Roadmap</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Generate a targeted, AI-powered month-wise roadmap detailing courses, projects, and study focuses based on your resume.
          </p>
        </div>
      </div>

      {!roadmapData && !loading && (
        <div className="glass-panel p-6 text-center" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <Map size={48} style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)', opacity: 0.8 }} />
          <h3>Create Your Skill Accelerator Plan</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Our career mentor agent will scan your latest resume analysis, cross-reference it with target roles, and draft a month-by-month syllabus of missing skill sets, recommended open-source projects, and credentials.
          </p>
          <button 
            className="btn btn-primary"
            onClick={handleGenerate}
            style={{ minWidth: '200px' }}
          >
            Generate Roadmap
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
          <h3 className="gradient-text">Charting Your Path...</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Evaluating resume skills gaps against target roles and using Llama 3.1 to generate an optimal Month-by-Month syllabus. This takes about 10-15 seconds.
          </p>
        </div>
      )}

      {roadmapData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Back button */}
          <div>
            <button 
              className="btn" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              onClick={() => setRoadmapData(null)}
            >
              ← Reset & Regenerate
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
            
            {/* Timeline Panel */}
            <div className="glass-panel p-6">
              <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={20} style={{ color: 'var(--accent-cyan)' }} />
                Month-by-Month Mastery
              </h3>
              
              <div className="timeline">
                {roadmapData.roadmap?.map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="glass-panel timeline-content">
                      <div className="timeline-title">
                        <h4>Month {item.month}</h4>
                        <span className="timeline-tag">{item.focus || 'Focus Area'}</span>
                      </div>
                      <div className="skills-container" style={{ marginTop: '0.75rem' }}>
                        {item.topics?.map((topic, i) => (
                          <span key={i} className="skill-badge" style={{ fontSize: '0.8rem' }}>
                            {renderTopic(topic)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="glass-panel p-6">
                <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <BookOpen size={16} style={{ color: 'var(--accent-cyan)' }} />
                  Free online courses
                </h3>
                <ul className="bullets-list" style={{ gap: '0.5rem' }}>
                  {roadmapData.courses?.map((c, i) => <li key={i}>{renderListItem(c)}</li>)}
                </ul>
              </div>

              <div className="glass-panel p-6">
                <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <Terminal size={16} style={{ color: 'var(--accent-primary)' }} />
                  Projects to build
                </h3>
                <ul className="bullets-list" style={{ gap: '0.5rem' }}>
                  {roadmapData.projects?.map((p, i) => <li key={i}>{renderListItem(p)}</li>)}
                </ul>
              </div>

              <div className="glass-panel p-6">
                <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <Award size={16} style={{ color: 'var(--accent-secondary)' }} />
                  Recommended Certifications
                </h3>
                <ul className="bullets-list" style={{ gap: '0.5rem' }}>
                  {roadmapData.certifications?.map((c, i) => <li key={i}>{renderListItem(c)}</li>)}
                </ul>
              </div>

              <div className="glass-panel p-6">
                <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <Lightbulb size={16} style={{ color: 'var(--warning)' }} />
                  Technical Interview tips
                </h3>
                <ul className="bullets-list" style={{ gap: '0.5rem' }}>
                  {roadmapData.interview_tips?.map((t, i) => <li key={i}>{renderListItem(t)}</li>)}
                </ul>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
