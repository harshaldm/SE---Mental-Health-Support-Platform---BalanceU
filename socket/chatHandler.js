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
 * Returns 'Low', 'Moderate', or 'Crisis'.
 */
const triageMessage = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(
      `Analyze this message from a student to a counselor. If it indicates immediate self-harm or severe crisis, return 'CRISIS'. If it's general stress, return 'MODERATE'. Otherwise, return 'LOW'. Return only the word.\n\nMessage: "${text}"`
    );
    const response = result.response.text().trim().toUpperCase();

    if (response.includes('CRISIS')) return 'Crisis';
    if (response.includes('MODERATE')) return 'Moderate';
    return 'Low';
  } catch (error) {
    console.error('❌ Gemini triage failed:', error.message);
    return 'Low'; // Default to Low if AI fails
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

        // 1. Persist message to MongoDB (initially with default 'Low')
        const message = await Message.create({
          appointment_id,
          sender_id: userId,
          text: trimmedText,
          timestamp: new Date(),
          sentiment_flag: 'Low',
        });

        // 2. Broadcast message to the room immediately (don't wait for AI)
        const messageData = {
          _id: message._id,
          appointment_id: message.appointment_id,
          sender_id: message.sender_id,
          sender_role: socket.user.role,
          text: message.text,
          timestamp: message.timestamp,
          sentiment_flag: 'Low',
        };

        io.to(roomName).emit('receive_message', messageData);

        // 3. Run AI triage in the background (only for Student messages)
        if (socket.user.role === 'Student') {
          const sentimentFlag = await triageMessage(trimmedText);

          // Update the message in MongoDB with the AI result
          await Message.findByIdAndUpdate(message._id, { sentiment_flag: sentimentFlag });

          // If sentiment changed, emit an update to the room
          if (sentimentFlag !== 'Low') {
            io.to(roomName).emit('sentiment_update', {
              message_id: message._id,
              sentiment_flag: sentimentFlag,
            });
          }

          // 4. CRISIS handling — email + emergency alert
          if (sentimentFlag === 'Crisis') {
            console.log(`🚨 CRISIS detected from User ${userId} in room ${roomName}`);

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

              // Send emergency email to the counselor (non-blocking)
              if (counselor) {
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
              }
            }
          }
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
