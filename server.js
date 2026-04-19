require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize, connectMongoDB, connectPostgres } = require('./config/db');
const { Institute, User, CustomFormSchema, StudentDetails, Appointment, QuizResult, AssessmentDetails, Message } = require('./models');

// ─── Route Imports ───
const instituteRoutes = require('./routes/institute');
const authRoutes = require('./routes/auth');
const counselorRoutes = require('./routes/counselor');
const appointmentRoutes = require('./routes/appointment');
const quizRoutes = require('./routes/quiz');
const chatRoutes = require('./routes/chat');

// ─── Socket Handler ───
const initializeSocket = require('./socket/chatHandler');

const app = express();

// ─── Create HTTP server and attach Socket.io ───
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development; restrict in production
    methods: ['GET', 'POST'],
  },
});

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// ─── Health Check Route ───
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BalanceU API is running 🚀' });
});

// ─── API Routes ───
app.use('/api/institutes', instituteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/counselor', counselorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/chat', chatRoutes);

// ─── Initialize Socket.io ───
initializeSocket(io);

// ─── Start Server ───
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectPostgres();
    await connectMongoDB();

    // Sync Sequelize models with the database (creates tables if they don't exist)
    await sequelize.sync();

    console.log('Databases connected successfully');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
