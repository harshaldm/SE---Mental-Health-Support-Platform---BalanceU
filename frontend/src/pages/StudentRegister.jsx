import { useNavigate } from 'react-router-dom';

const SAGE    = '#556B5F';
const CREAM   = '#FDFBF7';
const CARD    = '#F5F0E8';
const CHARCOAL = '#2C2C2C';
const MUTED   = '#7A7A6E';
const BORDER  = '#E0D9CE';

export default function StudentRegister() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: CREAM,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '"Manrope", "Inter", sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#fff',
        borderRadius: '32px',
        boxShadow: '0 4px 40px rgba(44, 44, 44, 0.08)',
        padding: '48px 44px 40px',
        textAlign: 'center',
      }}>

        {/* ─── Brand pill ─── */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: CARD,
          borderRadius: '50px',
          padding: '8px 20px',
          marginBottom: '28px',
        }}>
          <span style={{ fontSize: '18px' }}>🌿</span>
          <span style={{ fontWeight: '800', fontSize: '16px', color: SAGE }}>BalanceU</span>
        </div>

        {/* ─── Icon ─── */}
        <div style={{
          width: '88px',
          height: '88px',
          background: CARD,
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px',
        }}>
          📱
        </div>

        <h1 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: '800', color: CHARCOAL, letterSpacing: '-0.5px' }}>
          Students use the mobile app
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: '15px', color: MUTED, lineHeight: '1.7' }}>
          Your personalised wellness journey, assessments, and sessions with counselors live inside the BalanceU mobile app. Download it to get started.
        </p>

        {/* ─── Download QR placeholder ─── */}
        <div style={{
          background: CARD,
          border: `1.5px dashed ${BORDER}`,
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '28px',
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: '#E0D9CE',
            borderRadius: '16px',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: MUTED,
            fontWeight: '600',
          }}>
            QR Code
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: MUTED, fontWeight: '600' }}>
            Scan to download on iOS or Android
          </p>
        </div>

        {/* ─── App Store buttons ─── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          {['App Store', 'Google Play'].map(store => (
            <div
              key={store}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                background: CHARCOAL,
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>{store === 'App Store' ? '🍎' : '▶'}</span> {store}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: SAGE,
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '8px',
          }}
        >
          ← Back to Sign In
        </button>

        {/* ─── Trust badges ─── */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '🛡️', label: 'HIPAA Compliant' },
            { icon: '🔒', label: 'Encrypted Data' },
            { icon: '🌿', label: 'Wellness First' },
          ].map(badge => (
            <div key={badge.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: MUTED, fontWeight: '600' }}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
