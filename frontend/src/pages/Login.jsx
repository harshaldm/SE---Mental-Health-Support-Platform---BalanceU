import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/apiConfig';
import axios from 'axios';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const T = {
  sage:     '#556B5F',
  sageHover:'#445A4F',
  cream:    '#FDFBF7',
  card:     '#F5F0E8',
  white:    '#FFFFFF',
  charcoal: '#2C2C2C',
  muted:    '#7A7A6E',
  border:   '#E0D9CE',
  error:    '#991B1B',
  errorBg:  '#FEE2E2',
  errorBdr: '#FECACA',
  red:      '#E57373',
  disabled: '#B0B0A8',
};

// ─── Shared Style Factories ───────────────────────────────────────────────────
const inp = (extra = {}) => ({
  width: '100%', padding: '13px 16px', borderRadius: '12px',
  border: `1.5px solid ${T.border}`, background: T.cream,
  color: T.charcoal, fontSize: '14px', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.18s',
  ...extra,
});
const lbl = { display: 'block', fontSize: '12px', fontWeight: '700', color: T.charcoal, marginBottom: '6px', letterSpacing: '0.2px' };
const field = { display: 'flex', flexDirection: 'column', gap: 0 };

const focusSage  = e => (e.target.style.borderColor = T.sage);
const blurBorder = e => (e.target.style.borderColor = T.border);

function Btn({ children, onClick, type = 'button', disabled = false, style = {}, variant = 'primary' }) {
  const base = {
    width: '100%', padding: '14px', borderRadius: '50px', fontSize: '14px',
    fontWeight: '700', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', transition: 'background 0.18s', letterSpacing: '0.2px',
  };
  const variants = {
    primary: { background: disabled ? T.disabled : T.sage, color: '#fff' },
    ghost:   { background: 'none', border: 'none', color: T.sage, fontSize: '13px', padding: '6px 0', width: 'auto' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => !disabled && variant === 'primary' && (e.target.style.background = T.sageHover)}
      onMouseLeave={e => !disabled && variant === 'primary' && (e.target.style.background = T.sage)}
    >
      {children}
    </button>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ background: T.errorBg, border: `1px solid ${T.errorBdr}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: T.error }}>
      {msg}
    </div>
  );
}

function TrustFooter() {
  return (
    <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap' }}>
      {[['🛡️','HIPAA Compliant'],['🔒','Encrypted Data'],['🌿','Wellness First']].map(([icon, label]) => (
        <span key={label} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:T.muted, fontWeight:'600' }}>
          {icon} {label}
        </span>
      ))}
    </div>
  );
}

function BrandPill() {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:T.card, borderRadius:'50px', padding:'7px 18px', marginBottom:'18px' }}>
      <span style={{ fontSize:'16px' }}>🌿</span>
      <span style={{ fontWeight:'800', fontSize:'15px', color:T.sage }}>BalanceU</span>
    </div>
  );
}

// ─── Password Input with Eye Toggle ──────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder = '••••••••', label }) {
  const [show, setShow] = useState(false);
  return (
    <div style={field}>
      {label && <label style={lbl}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          style={{ ...inp(), paddingRight: '44px' }}
          onFocus={focusSage}
          onBlur={blurBorder}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:T.muted, padding:0 }}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}

// ─── FileUpload Button ────────────────────────────────────────────────────────
function FileBtn({ label, file, setter, required }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...lbl, marginBottom: '6px' }}>{label}{required && ' *'}</div>
      <label style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:'5px', padding:'16px 10px', borderRadius:'12px', cursor:'pointer',
        border:`1.5px dashed ${file ? T.sage : T.border}`,
        background: file ? '#EFF4F1' : T.cream,
        fontSize:'11px', fontWeight:'700', color: file ? T.sage : T.muted,
        textAlign:'center', transition:'all 0.18s',
      }}>
        <span style={{ fontSize:'20px' }}>{file ? '✅' : '📎'}</span>
        {file ? file.name.slice(0,14)+(file.name.length>14?'…':'') : 'Upload'}
        <input type="file" hidden accept="image/*,application/pdf" onChange={e => setter(e.target.files[0])} />
      </label>
    </div>
  );
}

// ─── SIGN-IN FORM (Counselor / Admin) ────────────────────────────────────────
function SignInForm({ activeRole, onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [remember, setRemember]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={field}>
        <label style={lbl}>University Email</label>
        <input
          type="email" placeholder="you@university.edu" value={email}
          onChange={e => setEmail(e.target.value)}
          required style={inp()} onFocus={focusSage} onBlur={blurBorder}
        />
      </div>

      <div style={field}>
        <PasswordInput label="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'9px' }}>
          <label style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'12px', color:T.muted, fontWeight:'600' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              style={{ accentColor:T.sage, width:'14px', height:'14px' }} />
            Remember me
          </label>
          <button type="button" style={{ background:'none', border:'none', color:T.sage, fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', padding:0 }}>
            Forgot password?
          </button>
        </div>
      </div>

      <ErrBox msg={error} />

      <Btn type="submit" disabled={loading} style={{ marginTop:'4px' }}>
        {loading ? 'Signing in…' : `Sign In as ${activeRole}`}
      </Btn>
    </form>
  );
}

// ─── STUDENT MOBILE MESSAGE ───────────────────────────────────────────────────
function StudentMobileBlock() {
  return (
    <div style={{ textAlign:'center', padding:'8px 0 4px' }}>
      <div style={{ fontSize:'52px', marginBottom:'14px' }}>📱</div>
      <p style={{ fontSize:'16px', fontWeight:'700', color:T.charcoal, margin:'0 0 8px' }}>
        Students use the mobile app
      </p>
      <p style={{ fontSize:'13px', color:T.muted, margin:'0 0 24px', lineHeight:'1.7' }}>
        Your journey lives inside the BalanceU mobile app.<br />Download it to get started.
      </p>

      {/* QR Code placeholder */}
      <div style={{ background:T.card, border:`1.5px dashed ${T.border}`, borderRadius:'18px', padding:'22px', marginBottom:'20px' }}>
        <div style={{ width:'100px', height:'100px', background:'#E0D9CE', borderRadius:'12px', margin:'0 auto 10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:T.muted, fontWeight:'700' }}>
          QR Code
        </div>
        <p style={{ margin:0, fontSize:'12px', color:T.muted, fontWeight:'600' }}>Scan to download on iOS or Android</p>
      </div>

      {/* Store buttons */}
      <div style={{ display:'flex', gap:'10px' }}>
        {[['🍎','App Store'],['▶','Google Play']].map(([icon, label]) => (
          <div key={label} style={{ flex:1, padding:'13px', borderRadius:'12px', background:T.charcoal, color:'#fff', fontSize:'12px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}>
            <span>{icon}</span> {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STUDENT REGISTRATION FORM (Dynamic Schema) ───────────────────────────────
function StudentRegForm({ onBack }) {
  const [institutes, setInstitutes] = useState([]);
  const [instSearch, setInstSearch] = useState('');
  const [showInstList, setShowInstList] = useState(false);
  const [selectedInst, setSelectedInst] = useState(null);
  const [schema, setSchema]         = useState([]);
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [customData, setCustomData] = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Fetch institutes on search change
  const fetchInstitutes = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institutes/list`);
      setInstitutes(res.data.institutes || []);
    } catch { /* silent */ }
  }, []);

  const handleInstSearch = async (val) => {
    setInstSearch(val);
    setSelectedInst(null);
    setSchema([]);
    setShowInstList(true);
    if (val.length > 0 && institutes.length === 0) await fetchInstitutes();
  };

  const handleSelectInst = async (inst) => {
    setSelectedInst(inst);
    setInstSearch(inst.name);
    setShowInstList(false);
    setSchema([]);
    setCustomData({});
    try {
      const res = await axios.get(`${BASE_URL}/api/institutes/${inst.id}/form-schema`);
      setSchema(res.data.schema || []);
    } catch { /* no custom schema */ }
  };

  const isEmailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPw;
  const schemaFilled    = schema.every(f => customData[f.label]);
  const isValid         = selectedInst && isEmailValid && isPasswordMatch && fullName.trim() && schemaFilled;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true); setError('');
    try {
      await axios.post(`${BASE_URL}/api/auth/register-student`, {
        email, password, full_name: fullName,
        institute_id: selectedInst.id,
        custom_data: customData,
      });
      alert('Registration successful! Please sign in via the mobile app.');
      onBack();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInsts = institutes.filter(i =>
    i.name.toLowerCase().includes(instSearch.toLowerCase()) ||
    (i.type || '').toLowerCase().includes(instSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'13px' }}>

      {/* Full Name */}
      <div style={field}>
        <label style={lbl}>Full Name *</label>
        <input type="text" placeholder="Jane Smith" value={fullName}
          onChange={e => setFullName(e.target.value)} required style={inp()}
          onFocus={focusSage} onBlur={blurBorder} />
      </div>

      {/* Institute Searchable Dropdown */}
      <div style={{ ...field, position:'relative' }}>
        <label style={lbl}>Select Your Institute *</label>
        <input
          type="text"
          placeholder="Search institutes…"
          value={instSearch}
          onChange={e => handleInstSearch(e.target.value)}
          onFocus={() => { setShowInstList(true); if (institutes.length === 0) fetchInstitutes(); }}
          style={inp({ borderColor: selectedInst ? T.sage : T.border })}
        />
        {showInstList && instSearch.length > 0 && (
          <div style={{
            position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:99,
            background:T.white, border:`1.5px solid ${T.border}`, borderRadius:'12px',
            maxHeight:'180px', overflowY:'auto', boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {filteredInsts.length === 0
              ? <div style={{ padding:'12px 16px', fontSize:'13px', color:T.muted }}>No institutes found.</div>
              : filteredInsts.map(inst => (
                <div key={inst.id}
                  onClick={() => handleSelectInst(inst)}
                  style={{ padding:'11px 16px', cursor:'pointer', fontSize:'13px', borderBottom:`1px solid ${T.border}`, transition:'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.card}
                  onMouseLeave={e => e.currentTarget.style.background = T.white}
                >
                  <span style={{ fontWeight:'700', color:T.charcoal }}>{inst.name}</span>
                  <span style={{ marginLeft:'6px', fontSize:'11px', color:T.muted }}>({inst.type})</span>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Email */}
      <div style={field}>
        <label style={lbl}>University Email *</label>
        <input type="email" placeholder="you@university.edu" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={inp({ borderColor: email.length > 0 && !isEmailValid ? T.red : T.border })}
          onFocus={focusSage} onBlur={e => { e.target.style.borderColor = email.length > 0 && !isEmailValid ? T.red : T.border; }} />
      </div>

      {/* Passwords */}
      <div style={{ display:'flex', gap:'10px' }}>
        <div style={{ flex:1 }}>
          <PasswordInput label="Password *" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ flex:1 }}>
          <PasswordInput label="Confirm Password *" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
        </div>
      </div>
      {confirmPw.length > 0 && !isPasswordMatch && (
        <p style={{ margin:'0', fontSize:'12px', color:T.red }}>Passwords don't match.</p>
      )}

      {/* Dynamic Schema Fields */}
      {schema.length > 0 && (
        <div style={{ background:T.card, borderRadius:'14px', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          <p style={{ margin:0, fontSize:'12px', fontWeight:'700', color:T.sage }}>
            📋 {selectedInst?.name} requires additional details
          </p>
          {schema.map((f, i) => (
            <div key={i} style={field}>
              <label style={lbl}>{f.label} *</label>
              {f.type === 'Dropdown' ? (
                <select
                  value={customData[f.label] || ''}
                  onChange={e => setCustomData(p => ({ ...p, [f.label]: e.target.value }))}
                  required style={{ ...inp(), cursor:'pointer' }}
                  onFocus={focusSage} onBlur={blurBorder}
                >
                  <option value="" disabled>Select…</option>
                  {f.options.map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                </select>
              ) : f.type === 'Date/Calendar' ? (
                <input type="date" value={customData[f.label] || ''}
                  onChange={e => setCustomData(p => ({ ...p, [f.label]: e.target.value }))}
                  required style={inp()} onFocus={focusSage} onBlur={blurBorder} />
              ) : (
                <input
                  type={f.type === 'Number' ? 'number' : f.type === 'Phone' ? 'tel' : 'text'}
                  placeholder={`Enter ${f.label}`}
                  value={customData[f.label] || ''}
                  onChange={e => setCustomData(p => ({ ...p, [f.label]: e.target.value }))}
                  required style={inp()} onFocus={focusSage} onBlur={blurBorder}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <ErrBox msg={error} />

      <Btn type="submit" disabled={!isValid || loading} style={{ marginTop:'4px' }}>
        {loading ? 'Creating Profile…' : 'Create Student Profile'}
      </Btn>

      <div style={{ textAlign:'center' }}>
        <Btn variant="ghost" onClick={onBack}>← Back to Sign In</Btn>
      </div>
    </form>
  );
}

// ─── COUNSELOR REGISTRATION FORM ─────────────────────────────────────────────
function CounselorRegForm({ onBack }) {
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [specialization, setSpec]     = useState('');
  const [experience, setExp]          = useState('');
  const [bio, setBio]                 = useState('');
  const [profilePic, setProfilePic]   = useState(null);
  const [degree, setDegree]           = useState(null);
  const [license, setLicense]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const isEmailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPw;
  const isValid         = fullName.trim() && isEmailValid && isPasswordMatch && degree && license;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('email', email);
      fd.append('password', password);
      fd.append('full_name', fullName);
      fd.append('specialization', specialization);
      fd.append('experience', experience);
      fd.append('bio', bio);
      if (profilePic) fd.append('profile_pic', profilePic);
      fd.append('degree', degree);
      fd.append('license', license);
      await axios.post(`${BASE_URL}/api/auth/register-counselor`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Account created! Sign in and apply to institutes from your dashboard.');
      onBack();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
      <div style={{ display:'flex', gap:'10px' }}>
        <div style={{ flex:1, ...field }}>
          <label style={lbl}>Full Legal Name *</label>
          <input type="text" placeholder="Dr. Jane Smith" value={fullName}
            onChange={e => setFullName(e.target.value)} required style={inp()}
            onFocus={focusSage} onBlur={blurBorder} />
        </div>
        <div style={{ flex:1, ...field }}>
          <label style={lbl}>Professional Email *</label>
          <input type="email" placeholder="you@clinic.com" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={inp({ borderColor: email.length > 0 && !isEmailValid ? T.red : T.border })}
            onFocus={focusSage} onBlur={e => { e.target.style.borderColor = email.length > 0 && !isEmailValid ? T.red : T.border; }} />
        </div>
      </div>

      <div style={{ display:'flex', gap:'10px' }}>
        <div style={{ flex:1 }}>
          <PasswordInput label="Password *" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ flex:1 }}>
          <PasswordInput label="Confirm Password *" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
        </div>
      </div>

      <div style={{ display:'flex', gap:'10px' }}>
        <div style={{ flex:1, ...field }}>
          <label style={lbl}>Specialization</label>
          <input type="text" placeholder="e.g. CBT, Anxiety" value={specialization}
            onChange={e => setSpec(e.target.value)} style={inp()}
            onFocus={focusSage} onBlur={blurBorder} />
        </div>
        <div style={{ flex:1, ...field }}>
          <label style={lbl}>Years of Experience</label>
          <input type="number" min="0" placeholder="e.g. 5" value={experience}
            onChange={e => setExp(e.target.value)} style={inp()}
            onFocus={focusSage} onBlur={blurBorder} />
        </div>
      </div>

      <div style={field}>
        <label style={lbl}>Professional Bio</label>
        <textarea rows={3} placeholder="Briefly describe your clinical background…" value={bio}
          onChange={e => setBio(e.target.value)}
          style={{ ...inp(), resize:'vertical', lineHeight:'1.5' }}
          onFocus={focusSage} onBlur={blurBorder} />
      </div>

      <div>
        <div style={{ ...lbl, marginBottom:'8px' }}>Documents</div>
        <div style={{ display:'flex', gap:'10px' }}>
          <FileBtn label="Profile Pic" file={profilePic} setter={setProfilePic} required={false} />
          <FileBtn label="Degree *" file={degree} setter={setDegree} required />
          <FileBtn label="License *" file={license} setter={setLicense} required />
        </div>
      </div>

      <ErrBox msg={error} />

      <Btn type="submit" disabled={!isValid || loading} style={{ marginTop:'4px' }}>
        {loading ? 'Creating Account…' : 'Create Clinical Account'}
      </Btn>

      <div style={{ textAlign:'center' }}>
        <Btn variant="ghost" onClick={onBack}>← Back to Sign In</Btn>
      </div>
    </form>
  );
}

// ─── ADMIN REGISTRATION FORM ──────────────────────────────────────────────────
const INST_TYPES = [
  'Engineering College/University', 'Medical College/University',
  'Law College/University', 'Arts & Science College',
  'Management Institute', 'Others',
];

function AdminRegForm({ onBack }) {
  const [fullName, setFullName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [instName, setInstName]           = useState('');
  const [instType, setInstType]           = useState('');
  const [customType, setCustomType]       = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  const isEmailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPw;
  const isTypeValid     = instType && (instType !== 'Others' || customType.trim());
  const isValid         = fullName.trim() && isEmailValid && isPasswordMatch && instName.trim() && isTypeValid;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true); setError('');
    try {
      await axios.post(`${BASE_URL}/api/auth/register-admin`, {
        email, password,
        institute_name: instName,
        institute_type: instType,
        custom_institute_type: customType,
      });
      alert('Institute & Admin account created! Please sign in.');
      onBack();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
      <div style={field}>
        <label style={lbl}>Your Full Name *</label>
        <input type="text" placeholder="John Doe" value={fullName}
          onChange={e => setFullName(e.target.value)} required style={inp()}
          onFocus={focusSage} onBlur={blurBorder} />
      </div>

      <div style={field}>
        <label style={lbl}>Official University Email *</label>
        <input type="email" placeholder="admin@university.edu" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={inp({ borderColor: email.length > 0 && !isEmailValid ? T.red : T.border })}
          onFocus={focusSage} onBlur={e => { e.target.style.borderColor = email.length > 0 && !isEmailValid ? T.red : T.border; }} />
      </div>

      <div style={field}>
        <label style={lbl}>Institute Name *</label>
        <input type="text" placeholder="e.g. Pune Institute of Technology" value={instName}
          onChange={e => setInstName(e.target.value)} required style={inp()}
          onFocus={focusSage} onBlur={blurBorder} />
      </div>

      <div style={field}>
        <label style={lbl}>Institute Type *</label>
        <select value={instType} onChange={e => setInstType(e.target.value)}
          required style={{ ...inp(), cursor:'pointer' }}
          onFocus={focusSage} onBlur={blurBorder}>
          <option value="" disabled>Select a type…</option>
          {INST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {instType === 'Others' && (
        <div style={field}>
          <label style={lbl}>Specify Type *</label>
          <input type="text" placeholder="e.g. Research Institute" value={customType}
            onChange={e => setCustomType(e.target.value)} style={inp()}
            onFocus={focusSage} onBlur={blurBorder} />
        </div>
      )}

      <div style={{ display:'flex', gap:'10px' }}>
        <div style={{ flex:1 }}>
          <PasswordInput label="Password *" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ flex:1 }}>
          <PasswordInput label="Confirm Password *" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
        </div>
      </div>
      {confirmPw.length > 0 && !isPasswordMatch && (
        <p style={{ margin:0, fontSize:'12px', color:T.red }}>Passwords don't match.</p>
      )}

      <ErrBox msg={error} />

      <Btn type="submit" disabled={!isValid || loading} style={{ marginTop:'4px' }}>
        {loading ? 'Creating…' : 'Establish Institute'}
      </Btn>

      <div style={{ textAlign:'center' }}>
        <Btn variant="ghost" onClick={onBack}>← Back to Sign In</Btn>
      </div>
    </form>
  );
}

// ─── ROLE SELECTION CARDS (for "Create an account") ──────────────────────────
const ROLE_CARDS = [
  { role:'Student',   icon:'🎓', title:"I'm a Student",   desc:'Create your verified student profile and access campus wellness tools.' },
  { role:'Counselor', icon:'🩺', title:"I'm a Counselor", desc:'Register as a clinical professional. Apply to institutes from your dashboard.' },
  { role:'Admin',     icon:'🏛️', title:"I'm an Admin",    desc:'Register your institution and configure the BalanceU platform.' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// view: 'signin' | 'register-select' | 'reg-student' | 'reg-counselor' | 'reg-admin'
export default function Login() {
  const [activeTab, setActiveTab] = useState('Counselor');
  const [view, setView]           = useState('signin');

  const goBack = () => setView('signin');

  const CARD_WIDTH = view === 'signin' ? '460px' : view === 'register-select' ? '500px' : '600px';

  // ── View title ──
  const viewTitle = {
    signin:          { h: 'Welcome back', sub: 'Sign in to your workspace' },
    'register-select':{ h: 'Create an account', sub: 'Select your role to get started' },
    'reg-student':   { h: 'Student Registration', sub: 'Create your verified profile' },
    'reg-counselor': { h: 'Clinical Join', sub: 'Create your professional account' },
    'reg-admin':     { h: 'Register Your Institute', sub: 'Establish your institution on BalanceU' },
  }[view];

  return (
    <div style={{
      minHeight:'100vh', background:T.cream,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px', fontFamily:'"Manrope", "Inter", sans-serif',
    }}>
      <div style={{
        width:'100%', maxWidth: CARD_WIDTH, background:T.white,
        borderRadius:'32px', boxShadow:'0 4px 40px rgba(44,44,44,0.09), 0 1px 4px rgba(44,44,44,0.04)',
        padding:'40px 40px 32px',
        transition:'max-width 0.3s ease',
      }}>

        {/* ── Brand + Title ── */}
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <BrandPill />
          <h1 style={{ margin:'0 0 5px', fontSize:'24px', fontWeight:'800', color:T.charcoal, letterSpacing:'-0.4px' }}>
            {viewTitle.h}
          </h1>
          <p style={{ margin:0, fontSize:'13px', color:T.muted }}>
            {viewTitle.sub}
          </p>
        </div>

        {/* ════════════════════════ SIGN-IN VIEW ════════════════════════ */}
        {view === 'signin' && (
          <>
            {/* Role Tab Switcher */}
            <div style={{
              display:'flex', gap:'3px', background:T.card,
              borderRadius:'12px', padding:'3px', marginBottom:'24px',
            }}>
              {['Student','Counselor','Admin'].map(role => (
                <button key={role}
                  onClick={() => setActiveTab(role)}
                  style={{
                    flex:1, padding:'9px 0', borderRadius:'9px', border:'none',
                    background: activeTab === role ? T.white : 'transparent',
                    color: activeTab === role ? T.sage : T.muted,
                    fontWeight: activeTab === role ? '700' : '500',
                    fontSize:'13px', cursor:'pointer', fontFamily:'inherit',
                    transition:'all 0.15s',
                    boxShadow: activeTab === role ? '0 1px 6px rgba(44,44,44,0.09)' : 'none',
                  }}
                >
                  {role}
                </button>
              ))}
            </div>

            {activeTab === 'Student'
              ? <StudentMobileBlock />
              : <SignInForm activeRole={activeTab} />
            }

            <p style={{ textAlign:'center', marginTop:'18px', marginBottom:0, fontSize:'13px', color:T.muted }}>
              New to BalanceU?{' '}
              <button onClick={() => setView('register-select')}
                style={{ background:'none', border:'none', color:T.sage, fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', padding:0 }}>
                Create an account
              </button>
            </p>
          </>
        )}

        {/* ════════════════════════ REGISTER ROLE PICKER ════════════════════════ */}
        {view === 'register-select' && (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {ROLE_CARDS.map(card => (
                <button key={card.role}
                  onClick={() => setView(`reg-${card.role.toLowerCase()}`)}
                  style={{
                    display:'flex', alignItems:'center', gap:'14px',
                    padding:'16px 18px', borderRadius:'16px',
                    border:`1.5px solid ${T.border}`, background:T.cream,
                    cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    width:'100%', transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.sage; e.currentTarget.style.background = '#EFF4F1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.cream; }}
                >
                  <span style={{ fontSize:'26px', flexShrink:0 }}>{card.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'700', fontSize:'14px', color:T.charcoal, marginBottom:'2px' }}>{card.title}</div>
                    <div style={{ fontSize:'12px', color:T.muted, lineHeight:'1.4' }}>{card.desc}</div>
                  </div>
                  <span style={{ color:T.muted, fontSize:'18px', flexShrink:0 }}>›</span>
                </button>
              ))}
            </div>

            <div style={{ textAlign:'center', marginTop:'14px' }}>
              <Btn variant="ghost" onClick={goBack}>← Back to Sign In</Btn>
            </div>
          </>
        )}

        {/* ════════════════════════ REGISTRATION FORMS ════════════════════════ */}
        {view === 'reg-student'   && <StudentRegForm   onBack={goBack} />}
        {view === 'reg-counselor' && <CounselorRegForm onBack={goBack} />}
        {view === 'reg-admin'     && <AdminRegForm     onBack={goBack} />}

        {/* ── Trust Footer ── */}
        <TrustFooter />
      </div>
    </div>
  );
}
