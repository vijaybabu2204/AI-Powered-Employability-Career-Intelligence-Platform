import React, { useState } from 'react';
import { 
  Search, 
  Code2, 
  BookOpen, 
  GitPullRequest, 
  Award, 
  HelpCircle, 
  AlertTriangle, 
  Star, 
  GitFork, 
  Sparkles, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { analyzeGitHub } from '../services/api';

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

export default function GitHubAnalyzer() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // GitHub REST API payloads
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [readmeSample, setReadmeSample] = useState('');
  
  // AI analysis results
  const [aiReport, setAiReport] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchGitHubData = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    setRepos([]);
    setLanguages([]);
    setReadmeSample('');
    setAiReport(null);

    const user = username.trim();

    try {
      // 1. Fetch User Profile
      const userRes = await fetch(`https://api.github.com/users/${user}`);
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error("GitHub username not found.");
        throw new Error("Failed to fetch user profile. Rate limit may be exceeded.");
      }
      const profileData = await userRes.json();
      setProfile(profileData);

      // 2. Fetch User Repos (up to 100)
      const reposRes = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`);
      if (!reposRes.ok) throw new Error("Failed to fetch repository details.");
      let reposData = await reposRes.json();
      
      // Sort repos by stars + forks to find top representative projects
      reposData.sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count));
      setRepos(reposData.slice(0, 5));

      // 3. Compute Language Distribution
      const langCounts = {};
      let totalSize = 0;
      reposData.forEach(r => {
        if (r.language) {
          langCounts[r.language] = (langCounts[r.language] || 0) + 1;
          totalSize++;
        }
      });

      const langList = Object.keys(langCounts).map(lang => ({
        name: lang,
        count: langCounts[lang],
        percentage: Math.round((langCounts[lang] / totalSize) * 100)
      })).sort((a, b) => b.count - a.count);
      setLanguages(langList.slice(0, 5));

      // 4. Fetch Representative README sample
      // Try profile special readme first: {user}/{user}
      let readmeText = '';
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${user}/${user}/readme`, {
          headers: { 'Accept': 'application/vnd.github.v3.raw' }
        });
        if (readmeRes.ok) {
          readmeText = await readmeRes.text();
        } else if (reposData.length > 0) {
          // Fallback to top repo README
          const topRepo = reposData[0].name;
          const fallbackRes = await fetch(`https://api.github.com/repos/${user}/${topRepo}/readme`, {
            headers: { 'Accept': 'application/vnd.github.v3.raw' }
          });
          if (fallbackRes.ok) readmeText = await fallbackRes.text();
        }
      } catch (err) {
        console.warn("Could not retrieve sample README", err);
      }
      
      const croppedReadme = readmeText.substring(0, 1200);
      setReadmeSample(croppedReadme);

      // Trigger AI Analysis automatically
      setAnalyzing(true);
      try {
        // Build minimized repos payload for LLM tokens efficiency
        const llmRepos = reposData.slice(0, 10).map(r => ({
          name: r.name,
          description: r.description || '',
          language: r.language || '',
          stars: r.stargazers_count,
          forks: r.forks_count
        }));

        const report = await analyzeGitHub(
          {
            login: profileData.login,
            name: profileData.name || profileData.login,
            bio: profileData.bio || '',
            public_repos: profileData.public_repos
          },
          llmRepos,
          croppedReadme
        );
        setAiReport(report);
      } catch (err) {
        console.error("AI Analysis failed", err);
        setError("GitHub data loaded, but AI evaluation failed. Verify backend LLM is active.");
      } finally {
        setAnalyzing(false);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load GitHub portfolio data.");
    } finally {
      setLoading(false);
    }
  };

  // Synchronize color mapping to dynamic theme choice variables!
  const isLight = document.body.classList.contains('light-theme');
  const chartColor = isLight ? 'c2410c' : 'ec4899';

  return (
    <div>
      <div className="app-header">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>GitHub Portfolio Analyzer</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enter a GitHub username to analyze project complexity, documentation standards, and receive professional portfolio scorecards.
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="glass-panel p-6 text-center" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <form onSubmit={fetchGitHubData} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Github size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Enter GitHub Username (e.g. torvalds)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none'
              }}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || analyzing}
            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '44px' }}
          >
            <Search size={16} />
            {loading ? "Fetching..." : analyzing ? "Analyzing..." : "Analyze Profile"}
          </button>
        </form>

        {error && (
          <div className="flex-center gap-2 mt-4" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {loading && !profile && (
        <div className="glass-panel p-6 text-center" style={{ maxWidth: '500px', margin: '3rem auto' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px' }}></div>
          <h3 className="gradient-text">Accessing GitHub API...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Retrieving public profile structures, repository schemas, and code languages.
          </p>
        </div>
      )}

      {/* GitHub Profile Content dashboard */}
      {profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top User Summary & Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
            
            {/* User Profile Card */}
            <div className="glass-panel p-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <img 
                  src={profile.avatar_url} 
                  alt={profile.login} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }} 
                />
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)', margin: 0 }}>
                    {profile.name || profile.login}
                  </h3>
                  <a 
                    href={profile.html_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}
                  >
                    @{profile.login}
                  </a>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Joined: {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>
                  "{profile.bio}"
                </p>
              )}

              <div className="score-widget-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="score-mini-card" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Public Repos</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{profile.public_repos}</div>
                </div>
                <div className="score-mini-card" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Followers</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{profile.followers}</div>
                </div>
              </div>
            </div>

            {/* Language Breakdown & Top Repos */}
            <div className="glass-panel p-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                Primary Code Languages
              </h3>
              
              {languages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {languages.map((l, idx) => (
                    <div key={idx}>
                      <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{l.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{l.percentage}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${l.percentage}%`, 
                            height: '100%', 
                            background: idx === 0 ? 'var(--accent-cyan)' : idx === 1 ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                            borderRadius: '3px'
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No language distribution metadata found.</p>
              )}
            </div>

          </div>

          {/* Contribution Graph Row */}
          <div className="glass-panel p-6" style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
              GitHub Contribution Graph
            </h3>
            <div style={{ width: '100%', overflowX: 'auto', marginTop: '1rem' }}>
              <img 
                src={`https://ghchart.rshah.org/${chartColor}/${profile.login}`} 
                alt={`${profile.login}'s GitHub contributions chart`}
                style={{
                  minWidth: '650px',
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.01)'
                }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
              *Contributions loaded from public registry feeds
            </p>
          </div>

          {/* Representative Repositories Details */}
          <div className="glass-panel p-6" style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} style={{ color: 'var(--accent-cyan)' }} />
              Top Starred / Representative Repositories
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {repos.map((r, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                  <div>
                    <div className="flex-between">
                      <a 
                        href={r.html_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none' }}
                      >
                        {r.name}
                      </a>
                      {r.language && (
                        <span className="skill-badge" style={{ fontSize: '0.75rem' }}>{r.language}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', minHeight: '40px', lineHeight: '1.4' }}>
                      {r.description || "No project description provided."}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Star size={12} /> {r.stargazers_count} Stars
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <GitFork size={12} /> {r.forks_count} Forks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Portfolio Audit Report */}
          {analyzing && (
            <div className="glass-panel p-6 text-center">
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <h3 className="gradient-text">Analyzing Portfolio Code Quality...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Llama 3.1 is critiquing documentation README styles, repository complexity, and contribution graph consistency.
              </p>
            </div>
          )}

          {aiReport && (
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', textAlign: 'left' }}>
              
              {/* Detailed critiques */}
              <div className="glass-panel p-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                  AI Portfolio Audit & Critique
                </h3>

                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Project Diversity & Complexity:</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{aiReport.project_analysis}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Language Stack Feedback:</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{aiReport.language_feedback}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>README Sample Evaluation:</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{aiReport.readme_evaluation}</p>
                </div>
              </div>

              {/* Scorecard & Action Items checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Score panel */}
                <div className="glass-panel p-6 text-center" style={{ background: 'rgba(236, 72, 153, 0.04)', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                  <Award size={36} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem' }} />
                  <h4 style={{ color: 'var(--accent-primary)', margin: 0, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>Overall Portfolio Score</h4>
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--accent-primary)', fontFamily: 'var(--font-title)', marginTop: '0.25rem' }}>
                    {aiReport.portfolio_score}/10
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Graded against hiring benchmarks for junior and mid-level software roles.
                  </p>
                </div>

                {/* Recommendations */}
                <div className="glass-panel p-6">
                  <h4 style={{ fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Recruiter Action Items
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {aiReport.action_items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <ChevronRight size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '0.15rem' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
