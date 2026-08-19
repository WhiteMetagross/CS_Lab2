import React, { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, mode, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState(mode || 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode) {
      setAuthMode(mode);
    }
    setError('');
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' 
      ? { username: username.trim().toLowerCase(), password }
      : { username: username.trim().toLowerCase(), password, full_name: fullName.trim(), bio };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUsername('');
      setPassword('');
      setFullName('');
      setBio('');
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="card-title">
            {authMode === 'login' ? 'Account Login' : 'Register New Account'}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="notice-banner vulnerable" style={{ marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {authMode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mridankan Mandal"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (e.g. mridankan)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {authMode === 'register' && (
            <div className="form-group">
              <label className="form-label">Bio / Profile Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief profile introduction"
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)' }}
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {authMode === 'login' ? 'Need an account? Register' : 'Already registered? Login'}
            </button>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
