const { CounselingRequest, User, CounselorInstitute, Institute, Appointment } = require('../models');
const sendNotification = require('../utils/sendEmail');
const { supportRequestTemplate, requestResponseTemplate } = require('../utils/emailTemplates');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/institutes/:id/counselors
// Public — returns the list of active counselors for a given institute.
// Only exposes name, bio, specialization (documents stay private).
// ─────────────────────────────────────────────────────────────────────────────
const getCounselorsForInstitute = async (req, res) => {
  const { id: institute_id } = req.params;

  try {
    const links = await CounselorInstitute.findAll({
      where: { institute_id, status: 'active' },
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'email', 'profile_metadata'],
          where: { role: 'Counselor' },
        },
      ],
    });

    const counselors = links.map(link => {
      const meta = link.counselor.profile_metadata || {};
      return {
        id:             link.counselor.id,
        name:           meta.full_name   || link.counselor.email,
        bio:            meta.bio         || '',
        specialization: meta.specialization || '',
        experience:     meta.experience  || '',
      };
    });

    return res.json({ counselors });
  } catch (err) {
    console.error('getCounselorsForInstitute error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch counselors.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/requests/submit
// Student submits a support request to a counselor (auth required).
// Body: { counselor_id, institute_id, quiz_result_id?, score?, risk_level? }
// ─────────────────────────────────────────────────────────────────────────────
const submitRequest = async (req, res) => {
  const student_id = req.user.id;
  const { counselor_id, institute_id, quiz_result_id, score, risk_level } = req.body;

  if (!counselor_id || !institute_id) {
    return res.status(400).json({ error: 'counselor_id and institute_id are required.' });
  }

  try {
    // Prevent duplicate pending requests
    const existing = await CounselingRequest.findOne({
      where: { student_id, counselor_id, institute_id, status: 'pending' },
    });
    if (existing) {
      return res.status(409).json({ error: 'You already have a pending request with this counselor.' });
    }

    // Create the request
    const request = await CounselingRequest.create({
      student_id,
      counselor_id,
      institute_id,
      quiz_result_id: quiz_result_id || null,
      score:          score      != null ? score      : null,
      risk_level:     risk_level || null,
      status:         'pending',
    });

    // ── Gather names + institute for the email ──
    const [student, counselor, institute] = await Promise.all([
      User.findByPk(student_id,   { attributes: ['email', 'profile_metadata'] }),
      User.findByPk(counselor_id, { attributes: ['email', 'profile_metadata'] }),
      Institute.findByPk(institute_id, { attributes: ['name'] }),
    ]);

    const studentMeta   = student?.profile_metadata  || {};
    const counselorMeta = counselor?.profile_metadata || {};

    // ── Fire email to counselor (non-blocking) ──
    sendNotification(
      counselor.email,
      `New Support Request: ${studentMeta.full_name || student.email}`,
      supportRequestTemplate({
        studentEmail:  student.email,
        studentName:   studentMeta.full_name || null,
        instituteName: institute?.name || institute_id,
        score:         score ?? null,
        riskLevel:     risk_level || null,
        counselorName: counselorMeta.full_name || null,
      })
    );

    return res.status(201).json({
      message: 'Support request submitted successfully.',
      request_id: request.id,
    });
  } catch (err) {
    console.error('submitRequest error:', err.message);
    return res.status(500).json({ error: 'Failed to submit request.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/requests/my-requests
// Counselor fetches all pending/active requests directed at them.
// ─────────────────────────────────────────────────────────────────────────────
const getMyRequests = async (req, res) => {
  const counselor_id = req.user.id;

  try {
    const requests = await CounselingRequest.findAll({
      where: { counselor_id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'email', 'profile_metadata'],
        },
        {
          model: Institute,
          as: 'institute',
          attributes: ['id', 'name'],
        },
      ],
    });

    const formatted = requests.map(r => ({
      id:            r.id,
      status:        r.status,
      score:         r.score,
      risk_level:    r.risk_level,
      quiz_result_id:r.quiz_result_id,
      created_at:    r.createdAt,
      institute:     r.institute,
      student: {
        id:   r.student.id,
        email:r.student.email,
        name: r.student.profile_metadata?.full_name || r.student.email,
      },
    }));

    return res.json({ requests: formatted });
  } catch (err) {
    console.error('getMyRequests error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch requests.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/requests/:id/respond
// Counselor accepts or rejects a request. Triggers email back to student.
// Body: { action: 'accepted' | 'rejected' }
// ─────────────────────────────────────────────────────────────────────────────
const respondToRequest = async (req, res) => {
  const counselor_id = req.user.id;
  const { id }       = req.params;
  const { action }   = req.body;

  if (!['accepted', 'rejected'].includes(action)) {
    return res.status(400).json({ error: "action must be 'accepted' or 'rejected'." });
  }

  logger.start(`Updating request ${id} to ${action}...`);

  try {
    const request = await CounselingRequest.findOne({
      where: { id, counselor_id },
    });

    if (!request) {
      logger.error(`Request ${id} not found.`);
      return res.status(404).json({ error: 'Request not found or not yours to respond to.' });
    }
    if (request.status !== 'pending') {
      logger.error(`Request ${id} already processed.`);
      return res.status(409).json({ error: 'This request has already been responded to.' });
    }

    await request.update({ status: action });

    // ── If accepted, auto-create an Appointment (chat room) ──
    let appointmentId = null;
    if (action === 'accepted') {
      logger.info(`Auto-creating appointment for request ${id}...`);
      try {
        const appt = await Appointment.create({
          student_id:        request.student_id,
          counselor_id:      counselor_id,
          scheduled_at:      new Date(),
          status:            'confirmed',
          issue_description: `Auto-created from counseling request #${request.id}`,
        });
        appointmentId = appt.id;
        // Persist the appointment_id back on the request for easy lookup
        await request.update({ quiz_result_id: null }); // keep existing field untouched
        // Store appointment_id in a note field if needed — use raw update
        await CounselingRequest.update({ notes: String(appt.id) }, { where: { id: request.id } });
      } catch (apptErr) {
        console.warn('Could not auto-create appointment:', apptErr.message);
      }
    }

    // ── Gather info for the feedback email to the student ──
    const [student, counselor, institute] = await Promise.all([
      User.findByPk(request.student_id,  { attributes: ['email', 'profile_metadata'] }),
      User.findByPk(counselor_id,         { attributes: ['email', 'profile_metadata'] }),
      Institute.findByPk(request.institute_id, { attributes: ['name'] }),
    ]);

    const studentMeta   = student?.profile_metadata  || {};
    const counselorMeta = counselor?.profile_metadata || {};

    // ── Fire email to student (non-blocking) ──
    sendNotification(
      student.email,
      `${action === 'accepted' ? '✅' : '❌'} Support Request Update from ${counselorMeta.full_name || counselor.email}`,
      requestResponseTemplate({
        studentName:   studentMeta.full_name  || null,
        counselorName: counselorMeta.full_name || counselor.email,
        counselorEmail: counselor.email,
        instituteName: institute?.name || request.institute_id,
        action,
      })
    );

    return res.json({
      message: `Request ${action} successfully.`,
      request_id: request.id,
      appointment_id: appointmentId,
      status: action,
    });
  } catch (err) {
    console.error('respondToRequest error:', err.message);
    return res.status(500).json({ error: 'Failed to respond to request.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/requests/my-conversations
// Returns accepted requests + their linked appointment_id for both roles.
// The appointment_id is the chat room key for Socket.io.
// ─────────────────────────────────────────────────────────────────────────────
const getMyConversations = async (req, res) => {
  const userId = req.user.id;
  const role   = req.user.role;

  try {
    const where = role === 'Counselor'
      ? { counselor_id: userId, status: 'accepted' }
      : { student_id:   userId, status: 'accepted' };

    const requests = await CounselingRequest.findAll({
      where,
      include: [
        { model: User, as: 'student',   attributes: ['id', 'email', 'profile_metadata'] },
        { model: User, as: 'counselor', attributes: ['id', 'email', 'profile_metadata'] },
      ],
      order: [['updatedAt', 'DESC']],
    });

    // For each accepted request find the linked Appointment (chat room)
    const conversations = await Promise.all(requests.map(async (r) => {
      // The appointment was stored with student_id + counselor_id pair after accept
      const appt = await Appointment.findOne({
        where: { student_id: r.student_id, counselor_id: r.counselor_id, status: 'confirmed' },
        order: [['createdAt', 'DESC']],
      });
      return {
        request_id:     r.id,
        appointment_id: appt?.id || null,
        student: {
          id:   r.student.id,
          name: r.student.profile_metadata?.full_name || r.student.email,
          email: r.student.email,
        },
        counselor: {
          id:   r.counselor.id,
          name: r.counselor.profile_metadata?.full_name || r.counselor.email,
          email: r.counselor.email,
        },
      };
    }));

    return res.json({ conversations });
  } catch (err) {
    console.error('getMyConversations error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};

module.exports = {
  getCounselorsForInstitute,
  submitRequest,
  getMyRequests,
  respondToRequest,
  getMyConversations,
};
