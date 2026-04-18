const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const QuizResult = sequelize.define('QuizResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  quiz_type: {
    type: DataTypes.STRING, // 'PHQ-9' or 'GAD-7'
    allowNull: false,
  },
  total_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  risk_level: {
    type: DataTypes.STRING, // Minimal, Mild, Moderate, Moderately Severe, Severe
    allowNull: false,
  },
  shared_with_counselor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'quiz_results',
  timestamps: true,
});

// ─── Associations ───
User.hasMany(QuizResult, { foreignKey: 'user_id', as: 'quizResults' });
QuizResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = QuizResult;
