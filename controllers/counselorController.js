const User = require('../models/User');
const StudentDetails = require('../models/StudentDetails');

// ─── Get Students for Counselor's Institute ───
// GET /api/counselor/students
// Hybrid fetch: PostgreSQL (user basics) + MongoDB (custom details)
const getStudents = async (req, res) => {
  try {
    const counselorInstituteId = req.user.institute_id;

    // 1. Fetch all students from PostgreSQL for this institute
    const students = await User.findAll({
      where: {
        institute_id: counselorInstituteId,
        role: 'Student',
      },
      attributes: ['id', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    if (students.length === 0) {
      return res.status(200).json({ message: 'No students found', students: [] });
    }

    // 2. Fetch custom details from MongoDB for those student IDs
    const studentIds = students.map(s => s.id);
    const detailsDocs = await StudentDetails.find({
      user_id: { $in: studentIds },
    });

    // Build a lookup map: user_id → custom data
    const detailsMap = {};
    detailsDocs.forEach(doc => {
      detailsMap[doc.user_id] = doc.data;
    });

    // 3. Merge SQL + NoSQL data into a clean list
    const merged = students.map(student => ({
      id: student.id,
      email: student.email,
      registered_at: student.createdAt,
      profile_details: detailsMap[student.id] || null,
    }));

    // 4. Filter by search query (if provided)
    const { search } = req.query;
    let results = merged;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();

      results = merged.filter(student => {
        // Check email
        if (student.email.toLowerCase().includes(term)) return true;

        // Check all values inside profile_details (custom_data from MongoDB)
        if (student.profile_details && typeof student.profile_details === 'object') {
          return Object.values(student.profile_details).some(value =>
            String(value).toLowerCase().includes(term)
          );
        }

        return false;
      });
    }

    res.status(200).json({
      institute_id: counselorInstituteId,
      search: search || null,
      total: results.length,
      students: results,
    });
  } catch (error) {
    console.error('❌ Error fetching students:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

module.exports = { getStudents };
