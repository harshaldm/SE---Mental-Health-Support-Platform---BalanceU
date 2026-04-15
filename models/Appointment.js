const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  counselor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  issue_description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'appointments',
  timestamps: true,
});

// ─── Associations ───
User.hasMany(Appointment, { foreignKey: 'student_id', as: 'studentAppointments' });
User.hasMany(Appointment, { foreignKey: 'counselor_id', as: 'counselorAppointments' });
Appointment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Appointment.belongsTo(User, { foreignKey: 'counselor_id', as: 'counselor' });

module.exports = Appointment;
