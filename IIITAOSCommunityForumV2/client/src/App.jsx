import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ForumView from './components/ForumView';
import ChatView from './components/ChatView';
import ProfilesView from './components/ProfilesView';

let currentCsrfToken = '';

// Intercept state-changing requests to inject the Anti-CSRF Token header
if (typeof window !== 'undefined' && !window.__CSRF_INTERCEPTOR_SET__) {
  window.__CSRF_INTERCEPTOR_SET__ = true;
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const opts = { ...options };
    const method = (opts.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && currentCsrfToken) {
      opts.headers = {
        ...opts.headers,
        'X-CSRF-Token': currentCsrfToken
      };
    }
    return originalFetch(url, opts);
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('forum');
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.csrfToken) {
          currentCsrfToken = data.csrfToken;
        }
      } else {
        setUser(null);
        currentCsrfToken = '';
      }
    } catch (err) {
      console.log('Session check error:', err);
      setUser(null);
      currentCsrfToken = '';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      currentCsrfToken = '';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (u, tokenData) => {
    setUser(u);
    if (tokenData?.csrfToken) {
      currentCsrfToken = tokenData.csrfToken;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <div className="main-content">
        {activeTab === 'forum' && (
          <ForumView
            user={user}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            user={user}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'profiles' && (
          <ProfilesView
            user={user}
            onProfileUpdated={(u) => setUser(u)}
          />
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        mode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleAuthSuccess}
      />
    </div>
  );
}
