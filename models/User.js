const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Institute = require('./Institute');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Counselor', 'Student'),
    allowNull: false,
  },
  institute_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: Institute,
      key: 'id',
    },
  },
  profile_metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  is_hired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// ─── Associations ───
Institute.hasMany(User, { foreignKey: 'institute_id' });
User.belongsTo(Institute, { foreignKey: 'institute_id' });

module.exports = User;
