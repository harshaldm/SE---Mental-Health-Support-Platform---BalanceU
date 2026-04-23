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

export default function CounselorRegister() {
  const [fullName, setFullName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience]       = useState('');
  const [bio, setBio]                     = useState('');
  const [profilePic, setProfilePic]       = useState(null);
  const [degreePic, setDegreePic]         = useState(null);
  const [licensePic, setLicensePic]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const navigate = useNavigate();

  const isEmailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPassword;
  // No institute_id — counselors apply to institutes from their dashboard
  const isValid = isEmailValid && isPasswordMatch && fullName.length > 0 && degreePic && licensePic;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('full_name', fullName);
      formData.append('specialization', specialization);
      formData.append('experience', experience);
      formData.append('bio', bio);
      if (profilePic) formData.append('profile_pic', profilePic);
      formData.append('degree', degreePic);
      formData.append('license', licensePic);

      await axios.post('http://localhost:5000/api/auth/register-counselor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Account created! Sign in and apply to institutes from your dashboard.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FileButton = ({ label, file, setter, required }) => (
    <div style={{ flex: 1 }}>
      <label style={labelStyle}>{label}{required && ' *'}</label>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '6px',
        padding: '18px 12px',
        borderRadius: '14px',
        border: `1.5px dashed ${file ? SAGE : BORDER}`,
        background: file ? '#EFF4F1' : CREAM,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        color: file ? SAGE : MUTED,
        textAlign: 'center',
        transition: 'all 0.18s',
      }}>
        <span style={{ fontSize: '22px' }}>{file ? '✅' : '📎'}</span>
        {file ? file.name.slice(0, 16) + (file.name.length > 16 ? '…' : '') : 'Upload file'}
        <input type="file" hidden accept="image/*,application/pdf" onChange={e => setter(e.target.files[0])} />
      </label>
    </div>
  );

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
        maxWidth: '580px',
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
            Clinical Join
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: MUTED }}>
            Create your account. Apply to institutes from your dashboard after setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Name + Email */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Full Legal Name *</label>
              <input
                type="text"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Professional Email *</label>
              <input
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ ...inputStyle, borderColor: email.length > 0 && !isEmailValid ? '#E57373' : BORDER }}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = email.length > 0 && !isEmailValid ? '#E57373' : BORDER}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Password *</label>
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
              <label style={labelStyle}>Confirm Password *</label>
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

          {/* Specialization + Experience */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Specialization</label>
              <input
                type="text"
                placeholder="e.g. CBT, Anxiety"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Years of Experience</label>
              <input
                type="number"
                placeholder="e.g. 5"
                min="0"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = SAGE}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>Professional Bio</label>
            <textarea
              placeholder="Briefly describe your clinical background and approach..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              onFocus={e => e.target.style.borderColor = SAGE}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Document uploads */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>Documents</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <FileButton label="Profile Picture" file={profilePic} setter={setProfilePic} required={false} />
              <FileButton label="Degree / Diploma" file={degreePic} setter={setDegreePic} required={true} />
              <FileButton label="License / Cert" file={licensePic} setter={setLicensePic} required={true} />
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', marginBottom: 0, fontSize: '13px', color: MUTED }}>
          Already registered?{' '}
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
