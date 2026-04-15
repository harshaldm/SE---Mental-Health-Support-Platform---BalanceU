const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Institute = require('../models/Institute');
const StudentDetails = require('../models/StudentDetails');
const CustomFormSchema = require('../models/CustomFormSchema');

const SALT_ROUNDS = 10;

// ─── Register Admin ───
// POST /api/auth/register-admin
const registerAdmin = async (req, res) => {
  try {
    const { email, password, institute_id, role } = req.body;

    if (!email || !password || !institute_id) {
      return res.status(400).json({ error: 'email, password, and institute_id are required' });
    }

    // Validate and default role
    const allowedRoles = ['Admin', 'Counselor', 'Student'];
    const assignedRole = allowedRoles.includes(role) ? role : 'Student';

    // Verify institute exists
    const institute = await Institute.findByPk(institute_id);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      password_hash,
      role: assignedRole,
      institute_id,
    });

    res.status(201).json({
      message: `${assignedRole} registered successfully`,
      user: { id: user.id, email: user.email, role: user.role, institute_id: user.institute_id },
    });
  } catch (error) {
    console.error('❌ Error registering admin:', error.message);
    res.status(500).json({ error: 'Failed to register admin' });
  }
};

// ─── Register Student ───
// POST /api/auth/register-student
const registerStudent = async (req, res) => {
  try {
    const { email, password, institute_id, custom_data } = req.body;

    if (!email || !password || !institute_id) {
      return res.status(400).json({ error: 'email, password, and institute_id are required' });
    }

    // Verify institute exists
    const institute = await Institute.findByPk(institute_id);
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Validate custom_data against the institute's form schema (if one exists)
    if (custom_data && typeof custom_data === 'object') {
      const formSchema = await CustomFormSchema.findOne({ institute_id });
      if (formSchema && Array.isArray(formSchema.fields)) {
        const expectedKeys = formSchema.fields.map(f => f.label);
        const submittedKeys = Object.keys(custom_data);
        const missingKeys = expectedKeys.filter(k => !submittedKeys.includes(k));
        if (missingKeys.length > 0) {
          return res.status(400).json({
            error: 'Missing required custom fields',
            missing: missingKeys,
          });
        }
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 1. Save basic user info to PostgreSQL
    const student = await User.create({
      email,
      password_hash,
      role: 'Student',
      institute_id,
    });

    // 2. Save custom form responses to MongoDB
    let details = null;
    if (custom_data && typeof custom_data === 'object') {
      try {
        details = await StudentDetails.create({
          user_id: student.id,
          institute_id,
          data: custom_data,
        });
      } catch (mongoError) {
        // Rollback: remove the PostgreSQL user if MongoDB save fails
        await student.destroy();
        console.error('❌ MongoDB save failed, rolled back PostgreSQL user:', mongoError.message);
        return res.status(500).json({ error: 'Registration failed — could not save custom data' });
      }
    }

    res.status(201).json({
      message: 'Student registered successfully',
      user: { id: student.id, email: student.email, role: student.role, institute_id: student.institute_id },
      student_details: details,
    });
  } catch (error) {
    console.error('❌ Error registering student:', error.message);
    res.status(500).json({ error: 'Failed to register student' });
  }
};
// ─── Login ───
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT with user info in the payload
    const payload = {
      id: user.id,
      role: user.role,
      institute_id: user.institute_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, institute_id: user.institute_id },
    });
  } catch (error) {
    console.error('❌ Error during login:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ─── Get Current User Profile ───
// GET /api/auth/me (Protected)
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'institute_id', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

module.exports = { registerAdmin, registerStudent, login, getMe };
