/**
 * Shared wrapper for all BalanceU emails — provides consistent branding.
 */
const wrapTemplate = (bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:1px;">🧠 BalanceU</h1>
              <p style="margin:4px 0 0; color:#e0e7ff; font-size:13px;">Mental Health Support Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding: 16px 32px; text-align:center; border-top: 1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                This is an automated notification from BalanceU. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Format a Date into a readable string.
 */
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};

/**
 * Email sent to Counselor when a student books a new appointment.
 */
const newAppointmentTemplate = ({ counselorEmail, studentEmail, instituteName, scheduledAt, issueDescription }) => {
  const body = `
    <h2 style="color:#1f2937; margin:0 0 16px;">📋 New Session Request</h2>
    <p style="color:#4b5563; line-height:1.6; margin:0 0 20px;">
      A student has requested a counseling session at <strong>${instituteName}</strong>.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
      <tr>
        <td style="color:#6b7280; font-size:13px; width:130px;">Student</td>
        <td style="color:#1f2937; font-weight:600;">${studentEmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Scheduled For</td>
        <td style="color:#1f2937; font-weight:600;">${formatDate(scheduledAt)}</td>
      </tr>
      ${issueDescription ? `
      <tr>
        <td style="color:#6b7280; font-size:13px;">Concern</td>
        <td style="color:#1f2937;">${issueDescription}</td>
      </tr>` : ''}
      <tr>
        <td style="color:#6b7280; font-size:13px;">Status</td>
        <td>
          <span style="background:#fef3c7; color:#92400e; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
            ⏳ Pending
          </span>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280; font-size:14px; margin:0;">
      Please log in to your BalanceU dashboard to confirm or reschedule this session.
    </p>
  `;
  return wrapTemplate(body);
};

/**
 * Email sent to Student when a counselor updates the appointment status.
 */
const statusUpdateTemplate = ({ studentEmail, counselorEmail, instituteName, scheduledAt, status }) => {
  const isConfirmed = status === 'confirmed';
  const statusColor = isConfirmed ? '#059669' : '#dc2626';
  const statusBg = isConfirmed ? '#d1fae5' : '#fee2e2';
  const statusIcon = isConfirmed ? '✅' : '❌';
  const statusText = isConfirmed ? 'Confirmed' : 'Cancelled';

  const body = `
    <h2 style="color:#1f2937; margin:0 0 16px;">📢 Appointment Update</h2>
    <p style="color:#4b5563; line-height:1.6; margin:0 0 20px;">
      Your counseling session at <strong>${instituteName}</strong> has been updated.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
      <tr>
        <td style="color:#6b7280; font-size:13px; width:130px;">Counselor</td>
        <td style="color:#1f2937; font-weight:600;">${counselorEmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Scheduled For</td>
        <td style="color:#1f2937; font-weight:600;">${formatDate(scheduledAt)}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Status</td>
        <td>
          <span style="background:${statusBg}; color:${statusColor}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
            ${statusIcon} ${statusText}
          </span>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280; font-size:14px; margin:0;">
      ${isConfirmed
        ? 'Your session is confirmed. Please be on time and reach out if you need to reschedule.'
        : 'Unfortunately, this session has been cancelled. Please book a new session if needed.'}
    </p>
  `;
  return wrapTemplate(body);
};
/**
 * Email sent to Counselor when a student shares a quiz assessment.
 */
const sharedAssessmentTemplate = ({ studentEmail, instituteName, quizType, riskLevel, totalScore }) => {
  const isHighRisk = ['Moderate', 'Moderately Severe', 'Severe'].includes(riskLevel);
  const riskColor = isHighRisk ? '#dc2626' : '#f59e0b';
  const riskBg = isHighRisk ? '#fee2e2' : '#fef3c7';
  const riskIcon = isHighRisk ? '🚨' : '⚠️';

  const body = `
    <h2 style="color:#1f2937; margin:0 0 16px;">${riskIcon} New Shared Assessment</h2>
    <p style="color:#4b5563; line-height:1.6; margin:0 0 20px;">
      A student at <strong>${instituteName}</strong> has shared a new ${isHighRisk ? '<strong style="color:#dc2626;">High-Risk</strong>' : ''} assessment with you.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
      <tr>
        <td style="color:#6b7280; font-size:13px; width:130px;">Student</td>
        <td style="color:#1f2937; font-weight:600;">${studentEmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Assessment</td>
        <td style="color:#1f2937; font-weight:600;">${quizType}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Score</td>
        <td style="color:#1f2937; font-weight:600;">${totalScore}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Risk Level</td>
        <td>
          <span style="background:${riskBg}; color:${riskColor}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
            ${riskIcon} ${riskLevel}
          </span>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280; font-size:14px; margin:0;">
      Please log in to your BalanceU dashboard to review the full report and AI analysis.
    </p>
  `;
  return wrapTemplate(body);
};

/**
 * Email sent to Counselor when a student submits a support request.
 */
const supportRequestTemplate = ({ studentEmail, studentName, instituteName, score, riskLevel, counselorName }) => {
  const isHighRisk = ['High', 'Severe', 'Moderately Severe'].includes(riskLevel);
  const riskColor = isHighRisk ? '#dc2626' : '#f59e0b';
  const riskBg    = isHighRisk ? '#fee2e2' : '#fef3c7';
  const riskIcon  = isHighRisk ? '🚨' : '⚠️';

  const body = `
    <h2 style="color:#1f2937; margin:0 0 16px;">🤝 New Support Request</h2>
    <p style="color:#4b5563; line-height:1.6; margin:0 0 20px;">
      Hi <strong>${counselorName || 'Counselor'}</strong>,<br/>
      A student at <strong>${instituteName}</strong> has requested your support and has shared their latest mental health assessment with you.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
      <tr>
        <td style="color:#6b7280; font-size:13px; width:130px;">Student</td>
        <td style="color:#1f2937; font-weight:600;">${studentName || studentEmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Email</td>
        <td style="color:#1f2937;">${studentEmail}</td>
      </tr>
      ${score != null ? `
      <tr>
        <td style="color:#6b7280; font-size:13px;">Assessment Score</td>
        <td style="color:#1f2937; font-weight:600;">${score}</td>
      </tr>` : ''}
      ${riskLevel ? `
      <tr>
        <td style="color:#6b7280; font-size:13px;">Risk Level</td>
        <td>
          <span style="background:${riskBg}; color:${riskColor}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
            ${riskIcon} ${riskLevel}
          </span>
        </td>
      </tr>` : ''}
    </table>
    <p style="color:#6b7280; font-size:14px; margin:0;">
      Please log in to your BalanceU dashboard to <strong>Accept</strong> or <strong>Reject</strong> this request.
    </p>
  `;
  return wrapTemplate(body);
};

/**
 * Email sent to Student when a counselor responds to their support request.
 */
const requestResponseTemplate = ({ studentName, counselorName, counselorEmail, instituteName, action }) => {
  const isAccepted = action === 'accepted';
  const color  = isAccepted ? '#059669' : '#dc2626';
  const bg     = isAccepted ? '#d1fae5' : '#fee2e2';
  const icon   = isAccepted ? '✅' : '❌';
  const label  = isAccepted ? 'Accepted' : 'Rejected';

  const body = `
    <h2 style="color:#1f2937; margin:0 0 16px;">${icon} Support Request ${label}</h2>
    <p style="color:#4b5563; line-height:1.6; margin:0 0 20px;">
      Hi <strong>${studentName || 'there'}</strong>,<br/>
      ${isAccepted
        ? `<strong>${counselorName}</strong> has <strong style="color:#059669;">accepted</strong> your support request at <strong>${instituteName}</strong>. They will be in touch with you shortly.`
        : `Unfortunately, <strong>${counselorName}</strong> was unable to accept your request at this time. Please consider reaching out to another counselor at <strong>${instituteName}</strong>.`
      }
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#f9fafb; border-radius:8px; margin-bottom:20px;">
      <tr>
        <td style="color:#6b7280; font-size:13px; width:130px;">Counselor</td>
        <td style="color:#1f2937; font-weight:600;">${counselorName}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Contact</td>
        <td style="color:#1f2937;">${counselorEmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Decision</td>
        <td>
          <span style="background:${bg}; color:${color}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
            ${icon} ${label}
          </span>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280; font-size:14px; margin:0;">
      ${isAccepted
        ? 'You can also reach out via the BalanceU app messaging feature.'
        : 'Log in to the BalanceU mobile app to explore other available counselors.'}
    </p>
  `;
  return wrapTemplate(body);
};

module.exports = { newAppointmentTemplate, statusUpdateTemplate, sharedAssessmentTemplate, crisisAlertTemplate, supportRequestTemplate, requestResponseTemplate };


/**
 * Email sent to Counselor when a student message is flagged as CRISIS by AI triage.
 */
function crisisAlertTemplate({ studentEmail, instituteName, messageText, timestamp }) {
  const body = `
    <h2 style="color:#dc2626; margin:0 0 16px;">🚨 CRISIS ALERT — Immediate Attention Required</h2>
    <p style="color:#4b5563; line-height:1.6; margin:0 0 20px;">
      A message from a student at <strong>${instituteName}</strong> has been flagged as a
      <strong style="color:#dc2626;">potential crisis</strong> by our AI triage system.
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background:#fef2f2; border: 1px solid #fecaca; border-radius:8px; margin-bottom:20px;">
      <tr>
        <td style="color:#6b7280; font-size:13px; width:130px;">Student</td>
        <td style="color:#1f2937; font-weight:600;">${studentEmail}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Flagged Message</td>
        <td style="color:#991b1b; font-style:italic;">"${messageText}"</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Time</td>
        <td style="color:#1f2937; font-weight:600;">${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
      </tr>
      <tr>
        <td style="color:#6b7280; font-size:13px;">Severity</td>
        <td>
          <span style="background:#fee2e2; color:#dc2626; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
            🚨 CRISIS
          </span>
        </td>
      </tr>
    </table>
    <p style="color:#dc2626; font-size:14px; font-weight:600; margin:0 0 8px;">
      Please reach out to this student immediately.
    </p>
    <p style="color:#6b7280; font-size:13px; margin:0;">
      If the student is in immediate danger, contact emergency services. Log in to your BalanceU dashboard to respond.
    </p>
  `;
  return wrapTemplate(body);
}
