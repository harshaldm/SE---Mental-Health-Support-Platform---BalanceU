const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
require('dotenv').config();


// ─── PostgreSQL Connection (via Sequelize) ───
const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

// ─── MongoDB Connection (via Mongoose) ───
const connectMongoDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');
};

// ─── PostgreSQL Auth Check ───
const connectPostgres = async () => {
  const uri = process.env.POSTGRES_URI || '';
  console.log(`🔍 POSTGRES_URI starts with: "${uri.substring(0, 10)}..."`);
  await sequelize.authenticate();
  console.log('✅ PostgreSQL connected');
};

module.exports = { sequelize, connectMongoDB, connectPostgres };
