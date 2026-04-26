const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const User = require('../models/User');
const Institute = require('../models/Institute');
const StudentDetails = require('../models/StudentDetails');
const CustomFormSchema = require('../models/CustomFormSchema');

const SALT_ROUNDS = 10;

// ─── Register Admin ───
// POST /api/auth/register-admin
const registerAdmin = async (req, res) => {
  try {
    const { email, password, institute_name, institute_type, custom_institute_type } = req.body;

    if (!email || !password || !institute_name || !institute_type) {
      return res.status(400).json({ error: 'email, password, institute_name, and institute_type are required' });
    }

    // Role is always Admin
    const assignedRole = 'Admin';

    // Determine final institute type
    const finalType = institute_type === 'Others' && custom_institute_type ? custom_institute_type : institute_type;

    // Check for duplicate email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate unique alphanumeric institute_id
    const generatedInstituteId = nanoid(10);

    // Create the Institute Foundation record
    const institute = await Institute.create({
      id: generatedInstituteId,
      name: institute_name,
      type: finalType,
    });

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      password_hash,
      role: assignedRole,
      full_name: institute_name, // Admins identified by institute name globally
      institute_id: generatedInstituteId,
    });

    res.status(201).json({
      message: `${assignedRole} registered successfully. Institute Foundation Created.`,
      user: { id: user.id, email: user.email, role: user.role, institute_id: user.institute_id },
      institute,
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
    const { email, password, institute_id, full_name, custom_data } = req.body;

    if (!email || !password || !institute_id || !full_name) {
      return res.status(400).json({ error: 'email, password, full_name, and institute_id are required' });
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

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Save basic user info and custom details to PostgreSQL directly
    const student = await User.create({
      email,
      password_hash,
      role: 'Student',
      full_name,
      institute_id,
      profile_metadata: {
        full_name,
        ...(custom_data && typeof custom_data === 'object' ? custom_data : {})
      },
    });

    res.status(201).json({
      message: 'Student registered successfully',
      user: { 
        id: student.id, 
        email: student.email, 
        role: student.role, 
        institute_id: student.institute_id,
        profile_metadata: student.profile_metadata 
      },
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

    const secret = process.env.JWT_SECRET || 'balanceu_secure_key_2026';
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        full_name: user.full_name,
        institute_id: user.institute_id 
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ─── Get Current User Profile ───
// GET /api/auth/me (Protected)
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'full_name', 'institute_id', 'createdAt', 'profile_metadata'],
      include: [{ model: Institute, attributes: ['name'] }]
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

// ─── Register Counselor (Uses Multer) ───
// POST /api/auth/register-counselor
// NOTE: No institute_id required. Counselors apply to institutes from their dashboard.
const registerCounselor = async (req, res) => {
  try {
    const { email, password, full_name, specialization, experience, bio } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password, and full_name are required' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Handle files via multer (`req.files`)
    let documents = {
      profile_pic: req.files?.profile_pic?.[0]?.filename || null,
      degree: req.files?.degree?.[0]?.filename || null,
      license: req.files?.license?.[0]?.filename || null,
    };

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const counselor = await User.create({
      email,
      password_hash,
      role: 'Counselor',
      institute_id: null, // Set via counselor_institutes table after approval
      is_hired: false,
      profile_metadata: {
        full_name,
        specialization,
        experience,
        bio,
        documents
      }
    });

    res.status(201).json({
      message: 'Counselor account created. Please apply to institutes from your dashboard.',
      user: { id: counselor.id, email: counselor.email, role: counselor.role, is_hired: false }
    });
  } catch (error) {
    console.error('❌ Error registering counselor:', error.message);
    res.status(500).json({ error: 'Failed to submit counselor application' });
  }
};

module.exports = { registerAdmin, registerStudent, registerCounselor, login, getMe };
