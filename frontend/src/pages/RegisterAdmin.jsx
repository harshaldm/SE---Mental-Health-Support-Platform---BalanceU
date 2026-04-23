import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SAGE    = '#556B5F';
const CREAM   = '#FDFBF7';
const CARD    = '#F5F0E8';
const CHARCOAL = '#2C2C2C';
const MUTED   = '#7A7A6E';
const BORDER  = '#E0D9CE';

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '14px',
  border: `1.5px solid ${BORDER}`,
  background: CREAM,
  color: CHARCOAL,
  fontSize: '15px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: CHARCOAL,
  marginBottom: '7px',
};

const INSTITUTE_TYPES = [
  'Engineering College/University',
  'Medical College/University',
  'Law College/University',
  'Arts & Science College',
  'Management Institute',
  'Others',
];

export default function RegisterAdmin() {
  const [instituteName, setInstituteName]           = useState('');
  const [email, setEmail]                           = useState('');
  const [password, setPassword]                     = useState('');
  const [confirmPassword, setConfirmPassword]       = useState('');
  const [instituteType, setInstituteType]           = useState('');
  const [customInstituteType, setCustomInstituteType] = useState('');
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState('');

  const navigate = useNavigate();

  const isEmailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPassword;
  const isTypeValid     = instituteType && (instituteType !== 'Others' || customInstituteType.trim() !== '');
  const isValid         = isEmailValid && isPasswordMatch && isTypeValid && instituteName.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register-admin', {
        email,
        password,
        institute_name: instituteName,
        institute_type: instituteType,
        custom_institute_type: customInstituteType,
      });
      alert('Institute & Admin account created successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '500px',
        background: '#fff',
        borderRadius: '32px',
        boxShadow: '0 4px 40px rgba(44, 44, 44, 0.08)',
        padding: '44px 40px 36px',
      }}>

        {/* Brand pill */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: CARD, borderRadius: '50px', padding: '8px 20px', marginBottom: '16px',
          }}>
            <span style={{ fontSize: '18px' }}>🌿</span>
            <span style={{ fontWeight: '800', fontSize: '16px', color: SAGE }}>BalanceU</span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: CHARCOAL, letterSpacing: '-0.5px' }}>
            Register Your Institute
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: MUTED }}>
            Establish your institution on the BalanceU network.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={labelStyle}>Institute Name</label>
            <input
              type="text"
              placeholder="e.g. Pune Institute of Technology"
              value={instituteName}
              onChange={e => setInstituteName(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = SAGE}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          <div>
            <label style={labelStyle}>Institute Type</label>
            <select
              value={instituteType}
              onChange={e => setInstituteType(e.target.value)}
              required
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
              onFocus={e => e.target.style.borderColor = SAGE}
              onBlur={e => e.target.style.borderColor = BORDER}
            >
              <option value="" disabled>Select a type…</option>
              {INSTITUTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {instituteType === 'Others' && (
            <div>
              <label style={labelStyle}>Specify Type</label>
              <input
                type="text"
                placeholder="e.g. Research Institute"
                value={customInstituteType}
                onChange={e => setCustomInstituteType(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Official Email</label>
            <input
              type="email"
              placeholder="admin@institution.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ ...inputStyle, borderColor: email.length > 0 && !isEmailValid ? '#E57373' : BORDER }}
              onFocus={e => e.target.style.borderColor = SAGE}
              onBlur={e => e.target.style.borderColor = email.length > 0 && !isEmailValid ? '#E57373' : BORDER}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{ ...inputStyle, borderColor: confirmPassword.length > 0 && !isPasswordMatch ? '#E57373' : BORDER }}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = confirmPassword.length > 0 && !isPasswordMatch ? '#E57373' : BORDER}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '50px',
              background: isValid ? SAGE : '#B0B0A8',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              cursor: isValid ? 'pointer' : 'not-allowed',
              marginTop: '4px',
              fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Creating...' : 'Establish Institute'}
          </button>
        </form>

        {/* Back link */}
        <p style={{ textAlign: 'center', marginTop: '16px', marginBottom: 0, fontSize: '13px', color: MUTED }}>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: SAGE, fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            Sign In
          </button>
        </p>

        {/* Trust badges */}
        <div style={{
          marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${BORDER}`,
          display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap',
        }}>
          {[{ icon: '🛡️', label: 'HIPAA Compliant' }, { icon: '🔒', label: 'Encrypted Data' }, { icon: '🌿', label: 'Wellness First' }].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: MUTED, fontWeight: '600' }}>
              <span>{b.icon}</span><span>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
