const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const MoodLog = sequelize.define('MoodLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  mood_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  log_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'mood_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'log_date'],
    }
  ]
});

User.hasMany(MoodLog, { foreignKey: 'user_id' });
MoodLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = MoodLog;
