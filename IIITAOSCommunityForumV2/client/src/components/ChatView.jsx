import React, { useState, useEffect, useRef } from 'react';
import ContentRenderer from './ContentRenderer';

export default function ChatView({ user, onOpenAuth }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchChat = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!inputText.trim()) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInputText('');
      fetchChat();
    } catch (err) {
      setError('Could not send message: ' + err.message);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear all community chat messages?')) return;
    try {
      await fetch('/api/chat/clear', { method: 'DELETE' });
      fetchChat();
    } catch (err) {
      setError('Failed to clear chat: ' + err.message);
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'Administrator') return 'badge-admin';
    if (role === 'Contributor') return 'badge-contributor';
    return 'badge-student';
  };

  return (
    <div>
      {error && (
        <div className="notice-banner vulnerable">
          {error}
          <button className="close-btn" style={{ float: 'right' }} onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-header">
          <div>
            <strong style={{ fontSize: '1rem' }}>#general-chat</strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
              Real-time community channel ({messages.length} messages)
            </span>
          </div>
          {user && user.role === 'Administrator' && (
            <button className="btn btn-sm btn-danger" onClick={handleClearChat}>
              Clear Chat History
            </button>
          )}
        </div>

        <div className="chat-messages">
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
              No messages in chat yet. Type a message below.
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="chat-message-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-heading)' }}>{msg.full_name}</strong>
                  <span>(@{msg.username})</span>
                  <span>:</span>
                  <span className={`badge ${getRoleBadgeClass(msg.role)}`}>{msg.role}</span>
                  <span>:</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <ContentRenderer content={msg.message} />
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-box" onSubmit={handleSendMessage}>
          {user ? (
            <>
              <input
                type="text"
                className="form-input"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Send Message
              </button>
            </>
          ) : (
            <div style={{ width: '100%', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Please <button type="button" className="btn btn-sm btn-outline-blue" onClick={() => onOpenAuth('login')}>Log In</button> to send chat messages.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
