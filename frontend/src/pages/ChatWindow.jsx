import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/apiConfig';
import { Send, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Sanctuary palette ────────────────────────────────────────────────────────
const S = {
  cream:     '#FDFBF7',
  sage:      '#556B5F',
  sageLight: '#EFF4F1',
  charcoal:  '#2C2C2C',
  muted:     '#7A7A6E',
  border:    '#E0D9CE',
  error:     '#DC2626',
  errorBg:   '#FEE2E2',
  crisis:    '#991B1B',
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatWindow — reusable real-time chat component for the web portal.
// Props:
//   appointmentId  — the chat room key
//   peerName       — "Dr. Smith" or "Alex Johnson"
//   onClose        — () => void — hides the window
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatWindow({ appointmentId, peerName, onClose }) {
  const { user, token } = useAuth();
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [connected, setConnected] = useState(false);
  const [typing, setTyping]       = useState(false);
  const [crisisAlert, setCrisisAlert] = useState(null);
  const socketRef  = useRef(null);
  const bottomRef  = useRef(null);
  const typingTimer = useRef(null);

  // ─── Connect socket ──────────────────────────────────────────────────
  useEffect(() => {
    if (!appointmentId || !token) return;

    const socket = io(BASE_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { appointment_id: appointmentId });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat_history', ({ messages: history }) => {
      setMessages(history.map(normaliseMsg));
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, normaliseMsg(msg)]);
    });

    socket.on('typing_indicator', ({ role, is_typing }) => {
      if (role !== (user?.role)) setTyping(is_typing);
    });

    socket.on('emergency_alert', (alert) => {
      setCrisisAlert(alert);
    });

    return () => { socket.disconnect(); };
  }, [appointmentId, token, user]);

  // ─── Scroll to bottom on new message ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    socketRef.current?.emit('send_message', { appointment_id: appointmentId, text: trimmed });
    setText('');
    socketRef.current?.emit('typing_stop', { appointment_id: appointmentId });
  }, [text, connected, appointmentId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTyping = (val) => {
    setText(val);
    socketRef.current?.emit('typing_start', { appointment_id: appointmentId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { appointment_id: appointmentId });
    }, 1500);
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 380, height: 540,
      background: S.cream, borderRadius: 24, border: `1px solid ${S.border}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
      display: 'flex', flexDirection: 'column', zIndex: 9999,
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: S.sage, color: '#fff',
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>💬 {peerName || 'Chat'}</p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>{connected ? 'Connected' : 'Connecting…'}</p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 50,
          width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16} color="#fff" />
        </button>
      </div>

      {/* ── Crisis alert banner ── */}
      {crisisAlert && (
        <div style={{
          background: S.errorBg, borderBottom: `2px solid ${S.error}`,
          padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <AlertTriangle size={16} color={S.crisis} />
          <p style={{ fontSize: 12, fontWeight: 700, color: S.crisis, margin: 0 }}>
            🚨 Crisis signal detected. The counselor has been notified immediately.
          </p>
        </div>
      )}

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: S.muted, fontSize: 13, marginTop: 40 }}>
            Say hello to start the conversation.
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg._id || msg.timestamp} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: isMine ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '78%', padding: '9px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMine ? S.sage : '#fff',
                border: isMine ? 'none' : `1px solid ${S.border}`,
                color: isMine ? '#fff' : S.charcoal,
                fontSize: 14, lineHeight: 1.5,
              }}>
                {msg.text}
                {msg.sentiment_flag === 'CRISIS' && (
                  <span style={{ display: 'block', fontSize: 10, color: isMine ? 'rgba(255,255,255,0.7)' : S.error, marginTop: 3 }}>
                    🚨 crisis signal
                  </span>
                )}
              </div>
              <p style={{ fontSize: 10, color: S.muted, margin: '3px 4px 0' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
        {typing && (
          <div style={{ display: 'inline-flex', gap: 4, padding: '8px 14px', background: '#fff', borderRadius: 16, border: `1px solid ${S.border}`, width: 'fit-content' }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 7, height: 7, borderRadius: 4, background: S.muted,
                animation: `bounce 1s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 14px',
        borderTop: `1px solid ${S.border}`, background: '#fff',
      }}>
        <textarea
          rows={1}
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          style={{
            flex: 1, resize: 'none', borderRadius: 14, border: `1.5px solid ${S.border}`,
            padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit',
            color: S.charcoal, background: S.cream,
          }}
        />
        <button onClick={sendMessage} disabled={!text.trim() || !connected} style={{
          width: 40, height: 40, borderRadius: 50, border: 'none', cursor: 'pointer',
          background: text.trim() && connected ? S.sage : S.border,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, alignSelf: 'flex-end',
          transition: 'background 0.2s',
        }}>
          <Send size={16} color="#fff" />
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normaliseMsg(msg) {
  return {
    _id:            msg._id || String(Math.random()),
    sender_id:      msg.sender_id,
    text:           msg.text,
    timestamp:      msg.timestamp || new Date().toISOString(),
    sentiment_flag: msg.sentiment_flag || 'LOW',
  };
}
