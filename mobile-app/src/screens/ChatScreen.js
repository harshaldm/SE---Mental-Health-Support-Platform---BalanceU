import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/apiConfig';
import { designTokens } from '../globalStyles';

const C = designTokens.colors;
const R = designTokens.radius;

// ─────────────────────────────────────────────────────────────────────────────
// ChatScreen — real-time chat between student and their accepted counselor.
// Props:
//   appointmentId  — the Socket.io room key (number)
//   peerName       — display name of the other party
//   currentUserId  — logged-in user's id (for bubble alignment)
//   token          — JWT for socket auth
//   onBack         — () => close the chat
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatScreen({ appointmentId, peerName, currentUserId, token, onBack }) {
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [connected, setConnected] = useState(false);
  const [typingPeer, setTypingPeer] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState(false);
  const socketRef   = useRef(null);
  const listRef     = useRef(null);
  const typingTimer = useRef(null);

  // ─── Connect & subscribe ────────────────────────────────────────────────
  useEffect(() => {
    if (!appointmentId || !token) return;

    const socket = io(BASE_URL, {
      auth:       { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { appointment_id: appointmentId });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat_history', ({ messages: hist }) => {
      setMessages(Array.isArray(hist) ? hist.map(normalise) : []);
    });

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, normalise(msg)]);
    });

    socket.on('typing_indicator', ({ is_typing }) => {
      setTypingPeer(is_typing);
    });

    socket.on('emergency_alert', () => {
      setCrisisAlert(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [appointmentId, token]);

  // ─── Scroll to bottom on new message ────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  // ─── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !connected) return;
    socketRef.current?.emit('send_message', { appointment_id: appointmentId, text: trimmed });
    setText('');
    socketRef.current?.emit('typing_stop', { appointment_id: appointmentId });
    clearTimeout(typingTimer.current);
  }, [text, connected, appointmentId]);

  const handleTyping = (val) => {
    setText(val);
    socketRef.current?.emit('typing_start', { appointment_id: appointmentId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { appointment_id: appointmentId });
    }, 1500);
  };

  // ─── Render message bubble ───────────────────────────────────────────────
  const renderBubble = ({ item }) => {
    const isMine = item.sender_id === currentUserId;
    return (
      <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubblePeer]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {item.text}
          </Text>
          {item.sentiment_flag === 'CRISIS' && (
            <Text style={styles.crisisFlag}>🚨 crisis signal</Text>
          )}
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.peerName}>{peerName || 'Chat'}</Text>
          <Text style={[styles.status, { color: connected ? C.success : C.muted }]}>
            {connected ? '● Connected' : '○ Connecting…'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Crisis alert banner */}
      {crisisAlert && (
        <View style={styles.crisisBanner}>
          <Text style={styles.crisisBannerText}>
            🚨 Your counselor has been alerted to this conversation.
          </Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {!connected && (
          <View style={styles.connectingOverlay}>
            <ActivityIndicator color={C.sage} />
            <Text style={styles.connectingText}>Connecting to chat…</Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item._id || String(Math.random())}
          renderItem={renderBubble}
          contentContainerStyle={styles.messages}
          ListEmptyComponent={
            connected ? (
              <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
            ) : null
          }
          ListFooterComponent={
            typingPeer ? (
              <View style={styles.typingDots}>
                <Text style={styles.typingText}>typing…</Text>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTyping}
            placeholder="Message…"
            placeholderTextColor={C.muted}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || !connected) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || !connected}
          >
            <Text style={styles.sendBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalise(msg) {
  return {
    _id:            msg._id || String(Math.random()),
    sender_id:      msg.sender_id,
    text:           msg.text || '',
    timestamp:      msg.timestamp || new Date().toISOString(),
    sentiment_flag: msg.sentiment_flag || 'LOW',
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backArrow: { fontSize: 28, color: C.sage, fontWeight: '700', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  peerName: { fontSize: 16, fontWeight: '800', color: C.charcoal },
  status: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  // Crisis
  crisisBanner: {
    backgroundColor: '#FEE2E2', borderBottomWidth: 2, borderBottomColor: '#DC2626',
    padding: 12, alignItems: 'center',
  },
  crisisBannerText: { fontSize: 12, fontWeight: '700', color: '#991B1B' },

  // Connecting overlay
  connectingOverlay: {
    padding: 20, alignItems: 'center', gap: 8,
  },
  connectingText: { fontSize: 13, color: C.muted },

  // Messages
  messages: { padding: 16, paddingBottom: 8 },
  emptyText: { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 48 },

  // Bubbles
  bubble: {
    maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: C.sage,
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: C.charcoal, lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  crisisFlag: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  timestamp: { fontSize: 10, color: C.muted, marginTop: 3, marginHorizontal: 4 },

  // Typing
  typingDots: { padding: 8, paddingHorizontal: 16 },
  typingText: { fontSize: 12, color: C.muted, fontStyle: 'italic' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: C.cream, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: C.charcoal, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.border },
  sendBtnText: { color: '#fff', fontWeight: '900', fontSize: 22, lineHeight: 32 },
});
