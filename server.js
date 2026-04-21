require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize, connectMongoDB, connectPostgres } = require('./config/db');
const { Institute, User, CustomFormSchema, StudentDetails, Appointment, QuizResult, AssessmentDetails, Message, MoodLog, Resource } = require('./models');

// ─── Route Imports ───
const instituteRoutes = require('./routes/institute');
const authRoutes = require('./routes/auth');
const counselorRoutes = require('./routes/counselor');
const appointmentRoutes = require('./routes/appointment');
const quizRoutes = require('./routes/quiz');
const chatRoutes = require('./routes/chat');
const moodRoutes = require('./routes/mood');
const resourceRoutes = require('./routes/resource');
const medicationRoutes = require('./routes/medication');

// ─── Socket Handler ───
const initializeSocket = require('./socket/chatHandler');

// ─── Cron Jobs ───
const initCronJobs = require('./jobs/cronJobs');

const app = express();

// ─── Create HTTP server and attach Socket.io ───
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development; restrict in production
    methods: ['GET', 'POST'],
  },
});

const path = require('path');

// ─── Middleware ───
app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'PATCH', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Attach io to app so routes can emit events via req.app.get('io') ───
app.set('io', io);

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
app.use('/api/mood', moodRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/meds', medicationRoutes);
app.use('/api/admin', require('./routes/admin'));

// ─── Initialize Socket.io ───
initializeSocket(io);

// ─── Start Server ───
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectPostgres();
    await connectMongoDB();

    // Sync Sequelize models with the database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });

    console.log('Databases connected successfully');

    // ─── Initialize Background Jobs ───
    initCronJobs(app);

    server.listen(PORT, '0.0.0.0', () => {
      console.log("Server listening on all network interfaces...");
      console.log(`🔌 Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
