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

module.exports = { newAppointmentTemplate, statusUpdateTemplate };
