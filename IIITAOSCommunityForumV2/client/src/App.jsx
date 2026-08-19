import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ForumView from './components/ForumView';
import ChatView from './components/ChatView';
import ProfilesView from './components/ProfilesView';

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
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log('Session check error:', err);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
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
        onLoginSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
