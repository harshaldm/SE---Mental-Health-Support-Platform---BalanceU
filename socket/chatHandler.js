const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Appointment = require('../models/Appointment');
const Message = require('../models/Message');
const User = require('../models/User');
const Institute = require('../models/Institute');
const sendNotification = require('../utils/sendEmail');
const { crisisAlertTemplate } = require('../utils/emailTemplates');

// ─── Gemini AI Client ───
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze a chat message for crisis signals using Gemini.
 * Returns 'LOW', 'MODERATE', or 'CRISIS'.
 */
const triageMessage = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(
      `Analyze this student message: '${text}'. If it indicates self-harm or immediate crisis, return ONLY 'CRISIS'. If it shows high stress, return 'MODERATE'. Otherwise, return 'LOW'.`
    );
    const response = result.response.text().trim().toUpperCase();

    if (response.includes('CRISIS')) return 'CRISIS';
    if (response.includes('MODERATE')) return 'MODERATE';
    return 'LOW';
  } catch (error) {
    console.error('❌ Gemini triage failed:', error.message);
    return 'LOW'; // Default to LOW if AI fails
  }
};

/**
 * Initialize Socket.io with JWT authentication and chat room logic.
 * @param {import('socket.io').Server} io
 */
const initializeSocket = (io) => {

  // ─── JWT Authentication Middleware for Socket.io ───
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error — no token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role, institute_id }
      next();
    } catch (err) {
      return next(new Error('Authentication error — invalid token'));
    }
  });

  // ─── Connection Handler ───
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.id} (${socket.user.role})`);

    // ─── Join Room ───
    socket.on('join_room', async ({ appointment_id }) => {
      try {
        const appointment = await Appointment.findByPk(appointment_id);

        if (!appointment) {
          return socket.emit('error_message', { error: 'Appointment not found' });
        }

        // Verify this user is part of the appointment
        const userId = socket.user.id;
        if (appointment.student_id !== userId && appointment.counselor_id !== userId) {
          return socket.emit('error_message', { error: 'You are not part of this appointment' });
        }

        const roomName = `appointment_${appointment_id}`;
        socket.join(roomName);

        // Load chat history from MongoDB and send to the joining user
        const history = await Message.find({ appointment_id })
          .sort({ timestamp: 1 })
          .lean();

        socket.emit('chat_history', { appointment_id, messages: history });

        console.log(`📥 User ${userId} joined room: ${roomName}`);
      } catch (error) {
        console.error('❌ Error joining room:', error.message);
        socket.emit('error_message', { error: 'Failed to join room' });
      }
    });

    // ─── Send Message ───
    socket.on('send_message', async ({ appointment_id, text }) => {
      try {
        if (!text || !text.trim()) return;

        const userId = socket.user.id;
        const roomName = `appointment_${appointment_id}`;
        const trimmedText = text.trim();

        console.log(`\n[Socket] Message Received from User: ${userId}`);

        let sentimentFlag = 'LOW'; // default

        // 1. Run AI triage before saving for Student messages (Blocking Flow)
        if (socket.user.role === 'Student') {
          sentimentFlag = await triageMessage(trimmedText);
        }
        console.log(`[Socket] AI Sentiment Result: ${sentimentFlag}`);

        // 2. Persist message to MongoDB with the AI result
        let message;
        try {
          message = await Message.create({
            appointment_id,
            sender_id: userId,
            text: trimmedText,
            timestamp: new Date(),
            sentiment_flag: sentimentFlag,
          });
          console.log('[Socket] Saved to Mongo: Success');
        } catch (dbError) {
          console.log('[Socket] Saved to Mongo: Fail', dbError.message);
          throw dbError; // rethrow to be caught by the outer catch
        }

        // 3. Broadcast message to the room
        const messageData = {
          _id: message._id,
          appointment_id: message.appointment_id,
          sender_id: message.sender_id,
          sender_role: socket.user.role,
          text: message.text,
          timestamp: message.timestamp,
          sentiment_flag: sentimentFlag,
        };

        io.to(roomName).emit('receive_message', messageData);

        // 4. Mailtrap Integration & Crisis Handling
        if (sentimentFlag === 'CRISIS' && socket.user.role === 'Student') {
          // Fetch appointment to find the counselor
          const appointment = await Appointment.findByPk(appointment_id);
          if (appointment) {
            const student = await User.findByPk(userId);
            const counselor = await User.findByPk(appointment.counselor_id);
            const institute = await Institute.findByPk(socket.user.institute_id);

            // Send emergency_alert socket event to the room
            io.to(roomName).emit('emergency_alert', {
              type: 'CRISIS',
              student_id: userId,
              student_email: student ? student.email : 'Unknown',
              message_text: trimmedText,
              timestamp: message.timestamp,
            });

            // Send emergency email to the counselor
            if (counselor) {
              try {
                sendNotification(
                  counselor.email,
                  `🚨 CRISIS ALERT — Immediate Attention Required — ${institute ? institute.name : 'BalanceU'}`,
                  crisisAlertTemplate({
                    studentEmail: student ? student.email : 'Unknown Student',
                    instituteName: institute ? institute.name : 'Your Institute',
                    messageText: trimmedText,
                    timestamp: message.timestamp,
                  })
                );
                console.log('[Socket] Email Status: Sent');
              } catch (emailError) {
                console.log('[Socket] Email Status: Failed -', emailError.message);
              }
            } else {
              console.log('[Socket] Email Status: Not Sent (Counselor Not Found)');
            }
          }
        } else {
          console.log('[Socket] Email Status: Not Required');
        }

      } catch (error) {
        console.error('❌ Error sending message:', error.message);
        socket.emit('error_message', { error: 'Failed to send message' });
      }
    });

    // ─── Typing Indicator ───
    socket.on('typing_start', ({ appointment_id }) => {
      const roomName = `appointment_${appointment_id}`;
      socket.to(roomName).emit('typing_indicator', {
        user_id: socket.user.id,
        role: socket.user.role,
        is_typing: true,
      });
    });

    socket.on('typing_stop', ({ appointment_id }) => {
      const roomName = `appointment_${appointment_id}`;
      socket.to(roomName).emit('typing_indicator', {
        user_id: socket.user.id,
        role: socket.user.role,
        is_typing: false,
      });
    });

    // ─── Disconnect ───
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.id}`);
    });
  });
};

module.exports = initializeSocket;
