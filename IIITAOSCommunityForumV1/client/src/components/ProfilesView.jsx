import React, { useState, useEffect } from 'react';
import ContentRenderer from './ContentRenderer';

export default function ProfilesView({ user, onProfileUpdated }) {
  const [users, setUsers] = useState([]);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to fetch members: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (user) {
      setBioInput(user.bio || '');
      setNameInput(user.full_name || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: nameInput,
          bio: bioInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage('Profile updated successfully.');
      setEditingBio(false);
      onProfileUpdated(data.user);
      fetchUsers();
    } catch (err) {
      setError('Could not update profile: ' + err.message);
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'Administrator') return 'badge-admin';
    if (role === 'Contributor') return 'badge-contributor';
    return 'badge-student';
  };

  return (
    <div>
      {message && (
        <div className="notice-banner secure" style={{ marginBottom: '16px' }}>
          {message}
          <button className="close-btn" style={{ float: 'right' }} onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {error && (
        <div className="notice-banner vulnerable" style={{ marginBottom: '16px' }}>
          {error}
          <button className="close-btn" style={{ float: 'right' }} onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Current User Bio Editor */}
      {user && (
        <div className="card card-accent-blue" style={{ marginBottom: '28px' }}>
          <div className="card-header">
            <h3 className="card-title">Your Member Profile</h3>
            <button
              className={`btn btn-sm ${editingBio ? 'btn-danger' : 'btn-outline-blue'}`}
              onClick={() => setEditingBio(!editingBio)}
            >
              {editingBio ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editingBio ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio / Profile Description</label>
                <textarea
                  className="form-textarea"
                  value={bioInput}
                  placeholder="Enter a brief profile description..."
                  onChange={(e) => setBioInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-success btn-sm">
                Save Profile Changes
              </button>
            </form>
          ) : (
            <div>
              <div style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-heading)' }}>{user.full_name}</strong> (@{user.username}) : <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-heading)' }}>About:</strong> {user.bio ? (
                  <ContentRenderer content={user.bio} />
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No description set.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Member Directory */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '18px', color: 'var(--text-heading)' }}>
        Community Members ({users.length})
      </h2>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading directory...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {users.map((u) => (
            <div key={u.id} className="member-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>{u.full_name}</strong>
                <span className={`badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                @{u.username} : Joined {new Date(u.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                {u.bio ? (
                  <ContentRenderer content={u.bio} />
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No bio provided.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
