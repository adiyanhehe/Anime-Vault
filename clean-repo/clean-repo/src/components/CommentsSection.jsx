import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageSquare, Trash2, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { useUser } from '../api/UserContext';
import { fetchMediaComments, addMediaComment, deleteMediaComment } from '../api/db';

export default function CommentsSection({ mediaId }) {
  const { user, setShowAuthModal, setAuthTab } = useUser();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch comments on mount and when mediaId changes
  useEffect(() => {
    loadComments();
  }, [mediaId]);

  const loadComments = async () => {
    try {
      const data = await fetchMediaComments(mediaId);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setAuthTab('login');
      setShowAuthModal(true);
      return;
    }

    if (!commentText.trim()) {
      setError('Please type a message before posting.');
      return;
    }

    setLoading(true);
    try {
      const res = await addMediaComment(user.id, user.username, mediaId, commentText);
      if (res.success) {
        setComments(prev => [res.comment, ...prev]);
        setCommentText('');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An error occurred while posting your comment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const success = await deleteMediaComment(commentId, user.id);
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      setError('Failed to delete comment.');
    }
  };

  return (
    <div className="comments-wrapper" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '30px',
      boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.02)'
    }}>
      
      {/* Header */}
      <h3 style={{
        fontSize: '1.2rem', fontWeight: '800', color: '#fff',
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'
      }}>
        <MessageSquare size={18} style={{ color: 'var(--brand-color)' }} />
        Discussion Hub <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>({comments.length})</span>
      </h3>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onClick={() => {
              if (!user) {
                setAuthTab('login');
                setShowAuthModal(true);
              }
            }}
            placeholder={user ? "Share your thoughts on this show..." : "Sign in to join the discussion..."}
            rows="3"
            style={{
              width: '100%', padding: '14px 44px 14px 14px', fontSize: '0.85rem', color: '#fff',
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
              outline: 'none', resize: 'none', transition: 'all 0.2s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
            }}
            onFocus={e => {
              if (user) {
                e.currentTarget.style.borderColor = 'var(--brand-color)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 26, 117, 0.15), inset 0 2px 4px rgba(0,0,0,0.3)';
              }
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)';
            }}
          />
          
          <button
            type="submit"
            disabled={loading}
            style={{
              position: 'absolute', bottom: '12px', right: '12px',
              background: 'var(--brand-color)', border: 'none',
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(255, 26, 117, 0.25)',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 26, 117, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 26, 117, 0.25)';
            }}
          >
            {user ? <Send size={14} /> : <Sparkles size={14} />}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxH: '500px', overflowY: 'auto' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id || index} style={{
              display: 'flex', gap: '12px', padding: '14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)',
              transition: 'all 0.2s ease'
            }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
               onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'}>
              
              {/* Avatar */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff1a75, #ff6b9d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', fontSize: '0.8rem', fontWeight: '900', flexShrink: 0
              }}>
                {comment.username.charAt(0).toUpperCase()}
              </div>

              {/* Body */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <Link 
                    to={`/user/${comment.username}`} 
                    style={{ 
                      fontSize: '0.85rem', fontWeight: '800', color: 'var(--brand-color)', 
                      textDecoration: 'none', transition: 'all 0.2s' 
                    }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {comment.username}
                  </Link>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={10} />
                    {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {comment.comment_text}
                </p>
              </div>

              {/* Delete Button */}
              {user && (user.username === comment.username || user.id === comment.user_id) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  style={{
                    alignSelf: 'flex-start', background: 'none', border: 'none',
                    color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px',
                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                >
                  <Trash2 size={13} />
                </button>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
