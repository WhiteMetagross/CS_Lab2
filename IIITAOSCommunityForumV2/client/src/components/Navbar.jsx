import React from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout
}) {
  const getRoleBadgeClass = (role) => {
    if (role === 'Administrator') return 'badge-admin';
    if (role === 'Contributor') return 'badge-contributor';
    return 'badge-student';
  };

  return (
    <header className="header">
      <div className="header-top">
        <div>
          <div className="brand-title">IIIT-A Open Source Community</div>
          <div className="brand-subtitle">
            Discussion Forum and Project Collaboration Portal
          </div>
        </div>

        <div className="header-actions">
          {/* User Status / Login / Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                {user.full_name} : @{user.username} ({user.role})
              </span>
              <button className="btn btn-sm btn-danger" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-primary" onClick={() => onOpenAuth('login')}>
                Login
              </button>
              <button className="btn btn-sm btn-outline-blue" onClick={() => onOpenAuth('register')}>
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="nav-bar">
        <button
          className={`nav-tab ${activeTab === 'forum' ? 'active' : ''}`}
          onClick={() => setActiveTab('forum')}
        >
          Discussions
        </button>
        <button
          className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Live Chat
        </button>
        <button
          className={`nav-tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Members
        </button>
      </nav>
    </header>
  );
}
