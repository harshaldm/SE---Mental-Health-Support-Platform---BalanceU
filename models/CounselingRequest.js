const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ─── CounselingRequest ────────────────────────────────────────────────────────
// Tracks a student's request for support from a specific counselor.
// Status lifecycle: pending → accepted | rejected
const CounselingRequest = sequelize.define('CounselingRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  counselor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  institute_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'institutes', key: 'id' },
  },
  quiz_result_id: {
    // MongoDB ObjectId stored as string — from the assessments collection
    type: DataTypes.STRING,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  risk_level: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  appointment_id: {
    // Set when counselor accepts — references appointments.id (the chat room)
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    // Freeform notes or context about the request
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'counseling_requests',
  timestamps: true,
});

// ─── Associations ───
const User = require('./User');
const Institute = require('./Institute');

// Student side
User.hasMany(CounselingRequest, { foreignKey: 'student_id', as: 'studentRequests', onDelete: 'CASCADE' });
CounselingRequest.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Counselor side
User.hasMany(CounselingRequest, { foreignKey: 'counselor_id', as: 'counselorRequests', onDelete: 'CASCADE' });
CounselingRequest.belongsTo(User, { foreignKey: 'counselor_id', as: 'counselor' });

// Institute side
Institute.hasMany(CounselingRequest, { foreignKey: 'institute_id', onDelete: 'CASCADE' });
CounselingRequest.belongsTo(Institute, { foreignKey: 'institute_id', as: 'institute' });

module.exports = CounselingRequest;
