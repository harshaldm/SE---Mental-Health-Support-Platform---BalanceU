import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { 
  Building2, CheckCircle, Clock, XCircle, Search, User, Lock, Edit3, Save, 
  Settings, Award, X, Plus, Eye, EyeOff
} from 'lucide-react';
import logger from '../utils/logger';

const S = {
  cream:   '#FDFBF7',
  sage:    '#556B5F',
  sageLight: '#EFF4F1',
  charcoal: '#2C2C2C',
  muted:   '#7A7A6E',
  border:  '#E0D9CE',
  white:   '#FFFFFF',
  error:   '#DC2626',
  success: '#059669',
};

export default function CounselorProfile({ setActiveNav }) {
  const { user, token, activeInstId, setActiveInstId, setActiveInstName, setUser } = useAuth();
  
  // ─── Profile Fields State ───
  const [profileLoading, setProfileLoading] = useState(true);
  const [profForm, setProfForm] = useState({
    specialization: '',
    experience: '',
    bio: ''
  });
  const [originalForm, setOriginalForm] = useState(null);
  const [profStatus, setProfStatus] = useState({ error: '', success: '', loading: false });

  // ─── Password State ───
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passStatus, setPassStatus] = useState({ error: '', success: '', loading: false });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── Institute Setup State ───
  const [myInstitutes, setMyInstitutes] = useState([]);
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [applySearch, setApplySearch] = useState('');
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  // ─── Initialization ───
  const fetchProfileInfo = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/counselor/profile`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const meta = res.data.profile_metadata || {};
      const sp = meta.specialization || '';
      const ex = meta.experience || '';
      const bi = meta.bio || '';
      
      const loaded = { specialization: sp, experience: ex, bio: bi };
      setProfForm(loaded);
      setOriginalForm(loaded);
      
      console.log(`[Frontend] -> CounselorProfile received data: ${JSON.stringify(user)}`);
      console.log(`[CounselorProfile.jsx] -> Identity signatures synced with user authentication records.`);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfileInfo();
  }, [fetchProfileInfo]);

  // ─── Institute Fetching ───
  const fetchInstitutes = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institutes/all`);
      setAllInstitutes(res.data.institutes || []);
      console.log(`[CounselorProfile.jsx] -> Discovery list populated with ${res.data.institutes?.length || 0} institutes.`);
    } catch (err) { logger.error('Profile', 'Fetch All Institutes', err); }
  }, []);

  const fetchMyInstitutes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/counselor/my-institutes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyInstitutes(res.data.institutes || []);
    } catch (err) { logger.error('Profile', 'Fetch My Institutes', err); }
  }, [token]);

  useEffect(() => {
    fetchInstitutes();
    fetchMyInstitutes();
  }, [fetchInstitutes, fetchMyInstitutes]);

  // ─── Save Changes / Action Handlers ───
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfStatus({ error: '', success: '', loading: true });
    
    // Validate years of experience
    const numExp = parseInt(profForm.experience, 10);
    if (profForm.experience && isNaN(numExp)) {
       return setProfStatus({ error: 'Years of experience must be a number.', success: '', loading: false });
    }

    try {
      const res = await axios.put(`${BASE_URL}/api/counselor/profile/update`, {
        specialization: profForm.specialization,
        years_of_experience: profForm.experience,
        bio: profForm.bio
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setProfStatus({ success: 'Professional status updated cleanly.', error: '', loading: false });
      setOriginalForm({ ...profForm });
      
      // Clear success out after 3s
      setTimeout(() => setProfStatus(prev => ({...prev, success: ''})), 3000);
    } catch (e) {
      setProfStatus({ error: e.response?.data?.error || 'Failed to update profile', success: '', loading: false });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassStatus({ error: '', success: '', loading: true });

    if (passwords.new !== passwords.confirm) {
      return setPassStatus({ error: 'New passwords do not match.', success: '', loading: false });
    }

    try {
      await axios.post(`${BASE_URL}/api/user/change-password`, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setPassStatus({ success: 'Password strictly updated.', error: '', loading: false });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e) {
      setPassStatus({ 
        error: e.response?.data?.error || 'Failed to change password', 
        success: '', loading: false 
      });
    }
  };

  const handleApply = async () => {
    if (!applyTarget) return;
    setApplyLoading(true);
    setApplyMsg('');
    try {
      await axios.post(`${BASE_URL}/api/counselor/apply`, { institute_id: applyTarget.id }, { headers: { Authorization: `Bearer ${token}` } });
      setApplyMsg(`✅ Applied to ${applyTarget.name}`);
      setApplyTarget(null);
      fetchMyInstitutes();
    } catch (err) { setApplyMsg(`❌ ${err.response?.data?.error || 'Failed'}`); }
    finally { setApplyLoading(false); }
  };

  const hasChanges = JSON.stringify(profForm) !== JSON.stringify(originalForm);

  if (profileLoading) return <div className="text-[#556B5F] font-bold py-10">Validating configuration...</div>;

  return (
    <div className="max-w-6xl space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Settings className="text-[#556B5F]" /> Counselor Blueprint
        </h1>
        <p className="text-[#7A7A6E] font-medium">Coordinate your clinical parameters, affiliation vectors, and profile security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── Section 1: Account Identity (Read-Only) ── */}
        <div className="bg-[#FDFBF7] p-8 rounded-[2.5rem] border shadow-sm" style={{ borderColor: S.border }}>
          <h2 className="text-xl font-black mb-6 text-[#556B5F] flex items-center gap-2">
            <User size={20} /> Account Context
          </h2>
          {!user ? (
            <div className="py-20 text-center text-[#7A7A6E] font-bold italic">Synchronizing Signatures...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Full Name</label>
                <div className="w-full bg-[#E0D9CE]/10 border rounded-2xl px-5 py-4 text-[#2C2C2C] font-bold" style={{ borderColor: S.border }}>
                  {user.full_name || '...'}
                  {console.log(`[CounselorProfile] -> Account Context mapping Full Name: ${!!user.full_name}.`)}
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Official Email</label>
                <div className="w-full bg-[#E0D9CE]/10 border rounded-2xl px-5 py-4 text-[#2C2C2C] font-bold" style={{ borderColor: S.border }}>
                  {user.email}
                </div>
              </div>
              <p className="text-xs text-[#7A7A6E] font-medium mt-4 italic text-center">
                Global identity signatures are strictly read-only for traceability constraints.
              </p>
            </div>
          )}
        </div>

        {/* ── Section 3: Security Settings ── */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm" style={{ borderColor: S.border }}>
          <h2 className="text-xl font-black mb-6 text-[#556B5F] flex items-center gap-2">
            <Lock size={20} /> Security Core
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
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Safe New Password</label>
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
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] ml-2 mb-1 block">Confirm Safety</label>
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
              {console.log('[UI/UX] -> Integrated inline visibility toggle nodes into password input fields.')}
            </div>
            <button 
              type="submit" 
              disabled={passStatus.loading}
              className="w-full bg-[#556B5F] text-white py-4 rounded-full font-black text-sm shadow-md hover:bg-[#44554b] transition-all mt-6 disabled:opacity-50"
            >
              {passStatus.loading ? 'Updating Credentials...' : 'Force Password Overwrite'}
            </button>
          </form>
        </div>
      </div>

      <hr className="border-[#E0D9CE] my-10" />

      {/* ── Section 2: Professionalism & Institute ── */}
      <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
        <Award className="text-[#556B5F]" /> Professional Vectors
      </h2>
      <p className="text-[#7A7A6E] mb-8 font-medium">Fine-tune your presentation mapping dynamically.</p>
        
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="bg-white p-10 rounded-[3rem] border border-[#556B5F]/20 shadow-sm relative">
           <div className="absolute top-0 left-10 transform -translate-y-1/2 bg-white px-4 border border-[#E0D9CE] rounded-full">
             <h3 className="font-black text-sm text-[#556B5F] flex items-center gap-2 py-1">
               <Edit3 size={16} /> Clinical Information
             </h3>
           </div>
           
           <form onSubmit={handleProfileSave} className="space-y-6 mt-4">
               {profStatus.error && (
                 <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-200">
                   {profStatus.error}
                 </div>
               )}
               {profStatus.success && (
                 <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-sm font-bold border border-green-200">
                   {profStatus.success}
                 </div>
               )}
               
               <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] mb-2 block ml-2">Specialization</label>
                  <input 
                    type="text" value={profForm.specialization} onChange={(e) => setProfForm({...profForm, specialization: e.target.value})}
                    placeholder="e.g. Anxiety & Life Transitions"
                    className="w-full py-4 px-5 bg-[#FDFBF7] border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#556B5F] transition-colors"
                    style={{ borderColor: S.border }}
                  />
               </div>

               <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] mb-2 block ml-2">Years of Experience</label>
                  <input 
                    type="number" value={profForm.experience} onChange={(e) => setProfForm({...profForm, experience: e.target.value})}
                    placeholder="2"
                    className="w-full py-4 px-5 bg-[#FDFBF7] border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#556B5F] transition-colors"
                    style={{ borderColor: S.border }}
                  />
               </div>

               <div>
                  <label className="text-xs font-black uppercase tracking-widest text-[#7A7A6E] mb-2 block ml-2">Clinical Bio</label>
                  <textarea 
                    value={profForm.bio} onChange={(e) => setProfForm({...profForm, bio: e.target.value})}
                    placeholder="Introduce your focus, style, and approach..."
                    rows={4}
                    className="w-full py-4 px-5 bg-[#FDFBF7] border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#556B5F] transition-colors resize-none"
                    style={{ borderColor: S.border }}
                  />
               </div>

               {hasChanges && (
                 <button type="submit" disabled={profStatus.loading} className="w-full bg-[#556B5F] text-white py-4 rounded-full font-black text-sm hover:bg-[#44554b] transition-all flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <Save size={18} /> {profStatus.loading ? 'Synchronizing...' : 'Save Changes'}
                 </button>
               )}
           </form>
        </div>

        <div className="bg-[#FDFBF7] p-10 rounded-[3rem] border border-[#E0D9CE]">
           <div className="flex items-center justify-between mb-6 block w-full">
              <h3 className="font-black text-xl text-[#2C2C2C]">Affiliation Bridge</h3>
           </div>
           
           <div className="bg-white p-6 rounded-3xl border border-[#E0D9CE] mb-6">
              <h4 className="text-sm font-black text-[#7A7A6E] mb-4 uppercase tracking-widest">Connect New Institute</h4>
              <div className="relative z-50 mt-2">
                <input
                  placeholder={applyTarget ? applyTarget.name : "Search valid keys..."}
                  value={applyTarget ? '' : applySearch}
                  onChange={e => {
                    setApplySearch(e.target.value);
                    if (applyTarget) setApplyTarget(null);
                  }}
                  className="w-full p-4 bg-[#FDFBF7] border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#556B5F]"
                  style={{ borderColor: S.border }}
                />
                {!applyTarget && applySearch && (
                  <ul className="absolute top-[60px] left-0 w-full bg-white border border-[#E0D9CE] rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                    {allInstitutes
                      .filter(i => 
                        i.name.toLowerCase().includes(applySearch.toLowerCase()) && 
                        !myInstitutes.some(mi => mi.institute.id === i.id)
                      )
                      .map(inst => (
                        <li 
                          key={inst.id} 
                          className="px-5 py-4 hover:bg-[#EFF4F1] cursor-pointer text-sm font-black border-b last:border-0 border-[#E0D9CE]"
                          onClick={() => {
                            setApplyTarget(inst);
                            setApplySearch('');
                          }}
                        >
                          {inst.name} <span className="text-[10px] text-gray-400 opacity-60 ml-2 uppercase">({inst.type})</span>
                        </li>
                      ))}
                  </ul>
                )}
                {applyTarget && (
                   <div className="mt-3 flex justify-between items-center bg-[#EFF4F1] p-3 rounded-xl border border-[#556B5F]/20">
                     <span className="text-sm font-bold text-[#556B5F]">{applyTarget.name}</span>
                     <button onClick={() => setApplyTarget(null)} className="text-error hover:bg-error/10 p-1 rounded-full"><X size={14} /></button>
                   </div>
                )}
                <button onClick={handleApply} disabled={!applyTarget || applyLoading} className="w-full mt-3 bg-white border-2 border-[#556B5F]/20 text-[#556B5F] py-3 rounded-full font-black text-sm hover:bg-[#556B5F]/5 transition-all shadow-sm flex justify-center items-center gap-2">
                  <Building2 size={16} /> Request Affiliation
                </button>
                {applyMsg && <p className={`text-xs text-center font-bold mt-3 ${applyMsg.includes('❌') ? 'text-error' : 'text-primary'}`}>{applyMsg}</p>}
              </div>
           </div>

           <div>
              <h4 className="text-sm font-black text-[#7A7A6E] mb-4 uppercase tracking-widest pl-2">Current Bridged Vectors</h4>
              <div className="space-y-3">
                 {myInstitutes.length === 0 ? (
                   <div className="italic text-xs text-[#7A7A6E] text-center p-4">No active bridges synchronized.</div>
                 ) : myInstitutes.map(inst => {
                   const isCurrent = activeInstId === inst.institute.id;
                   return (
                     <div 
                       key={inst.application_id} 
                       onClick={() => {
                         if (inst.status !== 'active') return;
                         setActiveInstId(inst.institute.id);
                         setActiveInstName(inst.institute.name);
                         localStorage.setItem('active_institute_id', inst.institute.id);
                         localStorage.setItem('active_institute_name', inst.institute.name);
                         if (setActiveNav) setActiveNav('overview');
                       }}
                       className={`p-4 rounded-3xl flex justify-between items-center transition-all ${
                         inst.status === 'active' ? 'cursor-pointer hover:shadow-md' : 'cursor-default opacity-70'
                       } ${
                         isCurrent ? 'bg-[#556B5F]/5 border-2 border-[#556B5F]' : 'bg-white border border-[#E0D9CE] shadow-sm hover:border-[#556B5F]/50'
                       }`}
                     >
                        <div className="flex items-center gap-3">
                           <span className={`font-bold text-sm ${isCurrent ? 'text-[#556B5F]' : 'text-[#2C2C2C]'}`}>{inst.institute?.name}</span>
                           {isCurrent && <span className="bg-[#556B5F] text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Active Focus</span>}
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          inst.status === 'active' ? 'bg-[#EFF4F1] text-[#556B5F]' : 'bg-amber-50 text-amber-600'
                        }`}>{inst.status}</span>
                     </div>
                   );
                 })}
              </div>
           </div>
           
        </div>
      </div>
    </div>
  );
}
