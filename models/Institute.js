const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Institute = sequelize.define('Institute', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // e.g. University, Coaching, etc.
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contact_info: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  registration_schema: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'institutes',
  timestamps: true,
});

module.exports = Institute;
