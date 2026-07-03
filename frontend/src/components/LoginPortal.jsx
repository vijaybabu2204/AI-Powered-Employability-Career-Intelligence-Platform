import React, { useState, useRef, useEffect } from 'react';
import { Lock, Mail, User, Cpu, AlertTriangle, Key, Shield, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, forgotPassword, resetPassword } from '../services/api';

export default function LoginPortal({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('vijay@gmail.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  
  // Security token state (bypass code: 1337)
  const [token, setToken] = useState(['', '', '', '']);
  const tokenRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState(null);

  // New UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [authData, setAuthData] = useState(null);

  // Password Reset States
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState(null);

  // Intercept query reset token parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('reset_token');
    if (tokenParam) {
      setResetToken(tokenParam);
      setActiveTab('reset-password');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTokenChange = (index, val) => {
    if (isNaN(Number(val)) && val !== '') return;
    
    const newToken = [...token];
    newToken[index] = val;
    setToken(newToken);

    // Auto-focus next box
    if (val !== '' && index < 3) {
      tokenRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && token[index] === '' && index > 0) {
      tokenRefs[index - 1].current.focus();
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess(false);
    try {
      setLoading(true);
      const data = await forgotPassword(forgotEmail);
      setForgotSuccess(true);
      setSimulatedEmail({
        to: forgotEmail,
        link: data.reset_link
      });
      setShowForgotModal(false);
    } catch (err) {
      setError(err.message || "Failed to process password recovery.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match!");
      return;
    }
    try {
      setLoading(true);
      setScanProgress(0);
      await resetPassword(resetToken, newPassword);
      setResetSuccess(true);
      setActiveTab('login');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken(null);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'login') {
      const fullToken = token.join('');
      if (fullToken.length < 4) {
        setError("Please enter the 4-digit system bypass token.");
        return;
      }
      if (fullToken !== '1337') {
        setError("Bypass token mismatch! (System hint: Enter '1337' to authenticate)");
        return;
      }

      try {
        setLoading(true);
        setScanProgress(0);
        const data = await loginUser(email, password);
        setAuthData({
          name: data.name,
          email: data.email,
          avatar: data.name.charAt(0).toUpperCase()
        });
      } catch (err) {
        setLoading(false);
        setError(err.message || "Access Denied: Invalid security credentials.");
      }
    } else {
      // Register validation
      if (!name.trim()) {
        setError("Candidate Name signature is required.");
        return;
      }
      if (!email.trim() || !password.trim()) {
        setError("Email and password credentials are required.");
        return;
      }

      try {
        setLoading(true);
        setScanProgress(0);
        const data = await registerUser(name, email, password);
        setAuthData({
          name: data.name,
          email: data.email,
          avatar: data.name.charAt(0).toUpperCase()
        });
      } catch (err) {
        setLoading(false);
        setError(err.message || "Failed to register candidate.");
      }
    }
  };

  // Simulate scanning signature loading
  useEffect(() => {
    let timer;
    if (loading && authData) {
      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setLoading(false);
              onLogin(authData);
            }, 300);
            return 100;
          }
          return prev + 10;
        });
      }, 50);
    }
    return () => clearInterval(timer);
  }, [loading, authData]);

  return (
    <div className="login-container">
      {/* Dynamic Background Grid Effects */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(var(--glass-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.15,
          zIndex: 1
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
          zIndex: 1
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
          bottom: '10%',
          right: '15%',
          zIndex: 1
        }}
      />

      <div className="glass-panel login-card">
        {/* Logo Header */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Cpu size={24} />
          </div>
          <h2>CAREER.AI</h2>
          <p>Intelligence Platform Gate</p>
        </div>

        {/* Tab Selection */}
        {!loading && (
          <div className="auth-tabs">
            {activeTab === 'reset-password' ? (
              <button className="auth-tab active" style={{ width: '100%', cursor: 'default' }} disabled>
                Reset Database Key
              </button>
            ) : (
              <>
                <button 
                  className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('login'); setError(null); }}
                >
                  Access System
                </button>
                <button 
                  className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('register'); setError(null); }}
                >
                  Register Candidate
                </button>
              </>
            )}
          </div>
        )}

        {/* Scanning Progress Screen */}
        {loading ? (
          <div style={{ padding: '2rem 0', textAlign: 'center' }}>
            <div className="flex-center" style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)'
                }}
              >
                <Shield size={36} className="spinner" style={{ animationDuration: '3s' }} />
              </div>
              <div 
                style={{
                  position: 'absolute',
                  width: '90px',
                  height: '2px',
                  background: 'rgba(6, 182, 212, 0.8)',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
                  top: '50%',
                  animation: 'scanBeam 1.5s linear infinite'
                }}
              />
            </div>
            <h3 className="gradient-text">Scanning Credentials...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Establishing secure mainframe connection: {scanProgress}%
            </p>
            <div 
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '2px',
                marginTop: '1.25rem',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{
                  width: `${scanProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
                  transition: 'width 0.05s ease-out'
                }}
              />
            </div>
            
            {/* Inline keyframe injection */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scanBeam {
                0% { transform: translateY(-40px); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(40px); opacity: 0; }
              }
            `}} />
          </div>
        ) : activeTab === 'reset-password' ? (
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> New Encryption Key (Password)
              </label>
              <input 
                type="password" 
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> Confirm New Key (Password)
              </label>
              <input 
                type="password" 
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex-center gap-2" style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Save New Password
            </button>
            
            <button 
              type="button" 
              className="btn" 
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
              onClick={() => { setActiveTab('login'); setResetToken(null); setError(null); }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {activeTab === 'register' && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} /> Full Candidate Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Vijay Babukada"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> Link Identifier (Email)
              </label>
              <input 
                type="email" 
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Lock size={14} /> Encryption Key (Password)
                </label>
                <a 
                  onClick={() => setShowForgotModal(true)} 
                  style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </a>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                  required
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'login' && (
              <div className="security-token-group">
                <div className="security-token-header">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Key size={12} /> System Bypass Token
                  </label>
                  <span>Pass: 1337</span>
                </div>
                <div className="token-input-row">
                  {token.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={tokenRefs[idx]}
                      type="text"
                      className="token-box"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleTokenChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error alerts */}
            {error && (
              <div className="flex-center gap-2" style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              {activeTab === 'login' ? "Authorize Link" : "Register Credentials"}
            </button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}
        >
          <div className="glass-panel p-6" style={{ maxWidth: '400px', width: '100%', border: '1px solid var(--accent-cyan)' }}>
            <h3 style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-title)', marginBottom: '1rem' }}>
              <Mail size={20} /> Password Recovery Link
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              Enter your registered email address. We will generate and output a password reset link to your console outbox and send an interactive browser notification.
            </p>
            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered Email</label>
                <input 
                  type="email" 
                  placeholder="vijay@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                  required
                />
              </div>

              {error && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => { setShowForgotModal(false); setError(null); }}
                  style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Success Message banner */}
      {resetSuccess && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--success)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            zIndex: 1001,
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          Password updated successfully in database! Please sign in with your new key.
          <button 
            onClick={() => setResetSuccess(false)}
            style={{ marginLeft: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Simulated Email Notification Card */}
      {simulatedEmail && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '340px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-cyan)',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)',
            borderRadius: '12px',
            padding: '1rem',
            zIndex: 1000
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ✉️ Simulated Mail Received
            </span>
            <button 
              onClick={() => setSimulatedEmail(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0' }}>
            <strong>To:</strong> {simulatedEmail.to}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0', lineHeight: '1.4' }}>
            You received a password reset request from CAREER.AI.
          </p>
          <a 
            href={simulatedEmail.link}
            onClick={(e) => {
              e.preventDefault();
              const url = new URL(simulatedEmail.link);
              const token = url.searchParams.get('reset_token');
              setResetToken(token);
              setActiveTab('reset-password');
              setSimulatedEmail(null);
            }}
            className="btn btn-primary"
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '0.8rem',
              padding: '0.4rem',
              marginTop: '0.5rem',
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-primary))',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            Click to Reset Password
          </a>
        </div>
      )}
    </div>
  );
}
