import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  Lock, Settings, ClipboardList, Plus, Trash2, 
  User, XCircle, Eye, EyeOff
} from 'lucide-react';

const S = {
  cream:    '#FDFBF7',
  sage:     '#556B5F',
  sageLight:'#EFF4F1',
  charcoal: '#2C2C2C',
  muted:    '#7A7A6E',
  border:   '#E0D9CE',
  white:    '#FFFFFF',
  error:    '#DC2626',
  errorBg:  '#FEE2E2',
  success:  '#059669',
};

// ── Default baseline fields shown in Live Blueprint (read-only, non-removable) ──
const DEFAULT_FIELDS = [
  { label: 'Full Name',            type: 'Text',     isDefault: true },
  { label: 'Select Your Institute',type: 'Dropdown',  isDefault: true },
  { label: 'University Email',     type: 'Text',     isDefault: true },
];

export default function AdminProfile() {
  const { user, token } = useAuth();

  // ── Password Change State ──
  const [passwords, setPasswords]   = useState({ current: '', new: '', confirm: '' });
  const [passStatus, setPassStatus] = useState({ error: '', success: '', loading: false });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Form Builder State ──
  const [fields, setFields]               = useState([]);
  const [label, setLabel]                 = useState('');
  const [type,  setType]                  = useState('Text');
  const [options, setOptions]             = useState([]);
  const [currentOption, setCurrentOption] = useState('');

  useEffect(() => {
    if (user) {
      console.log(`[Frontend] -> AdminProfile received data: ${JSON.stringify(user)}`);
      console.log('[AdminProfile.jsx] -> Identity fields mapped to Institute Registry.');
    }
  }, [user]);

  // ── Password Handler ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassStatus({ error: '', success: '', loading: true });
    if (passwords.new !== passwords.confirm) {
      return setPassStatus({ error: 'New passwords do not match.', success: '', loading: false });
    }
    try {
      await axios.post(`${BASE_URL}/api/user/change-password`, {
        currentPassword: passwords.current,
        newPassword:     passwords.new,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPassStatus({ success: 'Password successfully updated.', error: '', loading: false });
      setPasswords({ current: '', new: '', confirm: '' });
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    } catch (e) {
      setPassStatus({ error: e.response?.data?.error || 'Failed to change password', success: '', loading: false });
    }
  };

  // ── Fetch Schema ──
  const fetchSchema = useCallback(async () => {
    if (!token || !user?.institute_id) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/institutes/${user.institute_id}/form-schema`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.schema) setFields(res.data.schema);
    } catch (e) { console.error(e); }
  }, [token, user]);

  useEffect(() => { fetchSchema(); }, [fetchSchema]);

  const saveSchema = async () => {
    try {
      await axios.patch(`${BASE_URL}/api/institutes/schema`, {
        institute_id: user.institute_id,
        schema: fields,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Registration schema published!');
    } catch (err) { alert('Save failed'); }
  };

  const addOption = () => {
    if (!currentOption.trim()) return;
    setOptions(prev => [...(prev || []), currentOption.trim()]);
    setCurrentOption('');
    console.log('[Debug] -> Analyzed onClick handler for option accumulation.');
    console.log('[Fix]   -> Applied immutable state updates to form schema parameters.');
  };

  const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));

  const addField = () => {
    if (!label) return;
    const newField = { label, type, options: (type === 'Dropdown' || type === 'Radio') ? [...options] : [] };
    setFields([...fields, newField]);
    setLabel(''); setType('Text'); setOptions([]); setCurrentOption('');
  };

  const removeField = (index) => setFields(fields.filter((_, i) => i !== index));

  return (
    <div className="max-w-6xl space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Settings className="text-[#556B5F]" /> Platform Profile
        </h1>
        <p className="text-[#7A7A6E] font-medium">Manage your administrative identity and security configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Identity Block (Read-Only) ── */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm" style={{ borderColor: S.border }}>
          <h2 className="text-xl font-black mb-6 text-[#556B5F] flex items-center gap-2">
            <User size={20} /> Administrative Identity
          </h2>
          {!user ? (
            <div className="py-20 text-center text-[#7A7A6E] font-bold italic">Synchronizing Registry...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Institute Full Name</label>
                <div className="w-full bg-[#FDFBF7] border rounded-2xl px-5 py-4 text-[#2C2C2C] font-bold" style={{ borderColor: S.border }}>
                  {user.institute_name}
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Official Institute Email</label>
                <div className="w-full bg-[#FDFBF7] border rounded-2xl px-5 py-4 text-[#2C2C2C] font-bold" style={{ borderColor: S.border }}>
                  {user.official_email}
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Institute Type</label>
                <div className="w-full bg-[#FDFBF7] border rounded-2xl px-5 py-4 text-[#2C2C2C] font-bold" style={{ borderColor: S.border }}>
                  {user.institute_type}
                </div>
              </div>
              <p className="text-xs text-[#7A7A6E] font-medium mt-4 italic text-center">
                Identity parameters are locked to maintain institutional security constraints. Contact platform support if modifications are required.
              </p>
            </div>
          )}
        </div>

        {/* ── Security Block ── */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm" style={{ borderColor: S.border }}>
          <h2 className="text-xl font-black mb-6 text-[#556B5F] flex items-center gap-2">
            <Lock size={20} /> Security Settings
          </h2>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            {passStatus.error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-200">
                {passStatus.error}
              </div>
            )}
            {passStatus.success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm font-bold border border-green-200">
                {passStatus.success}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={passwords.current}
                  onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full bg-[#FDFBF7] border rounded-2xl px-5 py-4 pr-12 text-[#2C2C2C] font-bold focus:outline-none focus:ring-2 focus:ring-[#556B5F]"
                  style={{ borderColor: S.border }}
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7A6E] hover:text-[#556B5F] transition-colors" tabIndex={-1}>
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={passwords.new}
                  onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                  className="w-full bg-[#FDFBF7] border rounded-2xl px-5 py-4 pr-12 text-[#2C2C2C] font-bold focus:outline-none focus:ring-2 focus:ring-[#556B5F]"
                  style={{ borderColor: S.border }}
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7A6E] hover:text-[#556B5F] transition-colors" tabIndex={-1}>
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Confirm New</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={passwords.confirm}
                  onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full bg-[#FDFBF7] border rounded-2xl px-5 py-4 pr-12 text-[#2C2C2C] font-bold focus:outline-none focus:ring-2 focus:ring-[#556B5F]"
                  style={{ borderColor: S.border }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A7A6E] hover:text-[#556B5F] transition-colors" tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passStatus.loading}
              className="w-full bg-[#556B5F] text-white py-4 rounded-full font-black text-sm shadow-md hover:bg-[#44554b] transition-all mt-6 disabled:opacity-50"
            >
              {passStatus.loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      <hr className="border-[#E0D9CE] my-10" />

      {/* ── Form Builder Segment ── */}
      <div>
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
          <ClipboardList className="text-[#556B5F]" /> Student Registration Schema
        </h2>
        <p className="text-[#7A7A6E] mb-8 font-medium">Customize the fields students see when they register for your institute.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* ── Configure Field ── */}
          <ErrorBoundary>
            <div className="bg-white p-10 rounded-[3rem] border shadow-sm" style={{ borderColor: S.border }}>
              <h3 className="font-black text-xl mb-6 flex items-center gap-2">
                Configure Field <span className="bg-[#EFF4F1] text-[10px] uppercase tracking-widest px-2 py-1 rounded-full text-[#556B5F]">New Entry</span>
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] mb-2 block">Data Entry Label</label>
                  <input
                    type="text" placeholder="e.g. Hosteller / Day Scholar" value={label}
                    onChange={e => setLabel(e.target.value)}
                    className="w-full py-4 px-6 bg-[#FDFBF7] border-2 rounded-2xl font-bold focus:outline-none focus:border-[#556B5F] transition-colors"
                    style={{ borderColor: S.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] mb-2 block">Input Paradigm</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Text', 'Number', 'Dropdown', 'Radio'].map(t => (
                      <button key={t} onClick={() => {
                        setType(t);
                        if (t === 'Dropdown' || t === 'Radio') setOptions(prev => prev || []);
                      }}
                        className={`py-3 rounded-2xl text-xs font-black border-2 transition-all ${type === t ? 'bg-[#556B5F] text-white border-[#556B5F] shadow-md' : 'bg-white text-[#7A7A6E] border-[#E0D9CE] hover:border-[#556B5F]/30'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {(type === 'Dropdown' || type === 'Radio') && (
                  <div className="p-6 bg-[#FDFBF7] border-2 border-[#E0D9CE]/50 rounded-3xl">
                    <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] mb-3 block">Configure Options</label>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text" placeholder="Add option (e.g. First Year)" value={currentOption}
                        onChange={e => setCurrentOption(e.target.value)}
                        className="flex-1 py-3 px-5 border-2 rounded-xl focus:outline-none focus:border-[#556B5F] text-sm font-bold bg-white"
                        style={{ borderColor: S.border }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      />
                      <button onClick={addOption} className="bg-[#EFF4F1] text-[#556B5F] px-4 rounded-xl hover:bg-[#556B5F]/20 transition-colors">
                        <Plus size={20} />
                      </button>
                    </div>
                    {(options || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(options || []).map((opt, idx) => (
                          <div key={idx} className="bg-white border-2 border-[#556B5F]/20 text-[#556B5F] pl-4 pr-2 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
                            {opt}
                            <button onClick={() => removeOption(idx)} className="hover:bg-red-50 text-[#7A7A6E] hover:text-red-500 rounded-full p-1 transition-colors">
                              <XCircle size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={addField} disabled={!label}
                  className="w-full bg-[#556B5F] text-white py-4 rounded-full font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#44554b] transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Plus size={18} /> Append to Schema
                </button>
              </div>
            </div>
          </ErrorBoundary>

          {/* ── Live Blueprint ── */}
          <ErrorBoundary>
            <div className="bg-[#FDFBF7] p-10 rounded-[3rem] border border-[#E0D9CE]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xl text-[#2C2C2C]">Live Blueprint</h3>
                <button onClick={saveSchema}
                  className="bg-white text-[#556B5F] border-2 border-[#E0D9CE] border-b-4 hover:border-[#556B5F]/30 px-6 py-2.5 rounded-full font-black text-xs transition-all active:border-b-2 active:translate-y-[2px]">
                  Publish Blueprint
                </button>
              </div>

              {/* ── Always-visible default fields ── */}
              <div className="space-y-3 mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7A7A6E] mb-2 pl-1">
                  Default Fields <span className="ml-1 bg-[#EFF4F1] text-[#556B5F] px-2 py-0.5 rounded-full">System</span>
                </p>
                {DEFAULT_FIELDS.map((f, i) => (
                  <div key={`default-${i}`} className="relative bg-[#FDFBF7] p-4 rounded-2xl border border-dashed border-[#E0D9CE] opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-[#2C2C2C]">{f.label}</span>
                      <span className="bg-[#E0D9CE]/60 text-[#7A7A6E] px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black">{f.type}</span>
                    </div>
                    <div className="bg-white min-h-[2.5rem] rounded-xl border border-[#E0D9CE] px-4 py-2 italic text-xs text-[#B0AA9F] flex items-center">
                      {f.label === 'Select Your Institute' ? 'Dropdown — populated from registry...' : `Placeholder for ${f.label}...`}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Custom fields appended below ── */}
              {fields.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#E0D9CE] rounded-3xl flex flex-col items-center justify-center p-6 text-center text-[#7A7A6E]">
                  <p className="font-bold text-sm mb-1">No Custom Fields Yet</p>
                  <p className="text-xs font-medium">Configure and append fields above to extend the schema.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#7A7A6E] pl-1 mb-2">Custom Fields</p>
                  {fields.map((f, i) => (
                    <div key={i} className="group relative bg-white p-5 rounded-2xl border-2 shadow-sm" style={{ borderColor: S.border }}>
                      <button onClick={() => removeField(i)}
                        className="absolute -right-3 -top-3 w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white shadow-sm hover:bg-red-500 hover:text-white">
                        <Trash2 size={14} strokeWidth={3} />
                      </button>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-[#2C2C2C]">{f.label}</span>
                        <span className="bg-[#EFF4F1] text-[#556B5F] px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black">{f.type}</span>
                      </div>
                      <div className="bg-white min-h-[3rem] rounded-2xl border-2 border-[#556B5F]/20 flex items-center px-4 italic text-xs text-[#7A7A6E] py-3">
                        {(f.type === 'Dropdown' || f.type === 'Radio') ? (
                          <div className="flex flex-wrap gap-2 w-full not-italic">
                            {f.options?.map((o, idx) => (
                              <span key={idx} className="bg-[#556B5F]/5 text-[#556B5F] px-3 py-1 rounded-full text-[10px] font-bold border border-[#556B5F]/10">{o}</span>
                            ))}
                            {(f.options?.length || 0) === 0 && <span>No options configured...</span>}
                          </div>
                        ) : (`Placeholder for ${f.type} input...`)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {console.log('[Schema] -> Hydrated Live Blueprint view context with immutable default registration baselines.')}
            </div>
          </ErrorBoundary>

        </div>
      </div>
    </div>
  );
}
