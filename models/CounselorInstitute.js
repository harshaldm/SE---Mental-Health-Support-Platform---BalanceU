const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ─── CounselorInstitute (Junction Table) ───
// Manages the many-to-many relationship between counselors and institutes.
// A counselor can apply to multiple institutes and work across them.
// Status lifecycle: pending → active | rejected
const CounselorInstitute = sequelize.define('CounselorInstitute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  counselor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  institute_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'institutes',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'counselor_institutes',
  timestamps: true,
  indexes: [
    {
      // Prevent duplicate applications to the same institute
      unique: true,
      fields: ['counselor_id', 'institute_id'],
    },
  ],
});

// ─── Associations ───
const User = require('./User');
const Institute = require('./Institute');

User.belongsToMany(Institute, { through: CounselorInstitute, foreignKey: 'counselor_id', as: 'institutes' });
Institute.belongsToMany(User, { through: CounselorInstitute, foreignKey: 'institute_id', as: 'counselors' });

User.hasMany(CounselorInstitute, { foreignKey: 'counselor_id', onDelete: 'CASCADE' });
CounselorInstitute.belongsTo(User, { foreignKey: 'counselor_id', as: 'counselor' });

Institute.hasMany(CounselorInstitute, { foreignKey: 'institute_id', onDelete: 'CASCADE' });
CounselorInstitute.belongsTo(Institute, { foreignKey: 'institute_id', as: 'institute' });

module.exports = CounselorInstitute;

