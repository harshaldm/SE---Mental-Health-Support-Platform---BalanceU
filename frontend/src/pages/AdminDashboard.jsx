import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { Users, Shield, ClipboardList, LogOut, CheckCircle, XCircle, Plus, Trash2, ChevronRight, LayoutGrid } from 'lucide-react';

// ─── Sanctuary palette ──────────────────────────────────────────────────────────
const S = {
  cream:   '#FDFBF7',
  sage:    '#556B5F',
  sageLight: '#EFF4F1',
  charcoal: '#2C2C2C',
  muted:   '#7A7A6E',
  border:  '#E0D9CE',
  white:   '#FFFFFF',
  error:   '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#D97706',
  success: '#059669',
};

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { key: 'overview',     label: 'Overview',      Icon: LayoutGrid },
  { key: 'applications', label: 'Counselors',    Icon: Users },
  { key: 'schema',       label: 'Registration',  Icon: ClipboardList },
];

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [activeNav, setActiveNav]           = useState('overview');
  const [fields, setFields]   = useState([]);
  const [label, setLabel]     = useState('');
  const [type, setType]       = useState('Text');
  const [options, setOptions] = useState('');
  const [applications, setApplications]     = useState([]);
  const [appsLoading, setAppsLoading]       = useState(false);
  const [actioningId, setActioningId]       = useState(null);
  const [stats, setStats] = useState({ students: 0, counselors: 0, pending: 0 });

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    setAppsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/pending-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const apps = res.data.applications || [];
      setApplications(apps);
      setStats(s => ({ ...s, pending: apps.length }));
    } catch (e) { console.error(e); }
    finally { setAppsLoading(false); }
  }, [token]);

  const fetchSchema = useCallback(async () => {
    if (!token || !user?.institute_id) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/institutes/${user.institute_id}/form-schema`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.schema) setFields(res.data.schema);
    } catch (e) { console.error(e); }
  }, [token, user]);

  useEffect(() => {
    if (user?.institute_id) { fetchApplications(); fetchSchema(); }
  }, [fetchApplications, fetchSchema, user]);

  const handleApplicationAction = async (applicationId, action) => {
    setActioningId(applicationId);
    try {
      await axios.put(`${BASE_URL}/api/admin/approve-counselor`, { application_id: applicationId, action }, { headers: { Authorization: `Bearer ${token}` } });
      setApplications(apps => apps.filter(a => a.application_id !== applicationId));
      setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
    } catch (error) { alert('Action failed'); }
    finally { setActioningId(null); }
  };

  const saveSchema = async () => {
    try {
      await axios.patch(`${BASE_URL}/api/institutes/schema`, { institute_id: user.institute_id, schema: fields }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Registration schema published!');
    } catch (err) { alert('Save failed'); }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: S.cream, color: S.charcoal }}>

      {/* ── Sidebar ── */}
      <aside className="h-full flex flex-col p-8 border-r overflow-y-auto shrink-0" style={{ width: 280, backgroundColor: S.white, borderColor: S.border }}>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#556B5F] flex items-center justify-center text-white font-black text-lg">B</div>
            <h2 className="font-black text-xl tracking-tight">Balance<span className="text-[#556B5F]">U</span></h2>
          </div>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{user?.institute?.name || 'ADMIN PORTAL'}</p>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV.map(({ key, label, Icon }) => {
            const active = activeNav === key;
            return (
              <button key={key} onClick={() => setActiveNav(key)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] font-bold text-sm transition-all group ${
                active ? 'bg-[#556B5F] text-white shadow-lg shadow-[#556B5F]/20' : 'text-[#7A7A6E] hover:bg-[#EFF4F1] hover:text-[#556B5F]'
              }`}>
                <Icon size={18} />
                <span className="flex-1 text-left">{label}</span>
                {key === 'applications' && stats.pending > 0 && (
                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white text-[#556B5F]' : 'bg-error text-white'}`}>
                     {stats.pending}
                   </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t" style={{ borderColor: S.border }}>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-[#EFF4F1] border border-[#556B5F]/20 flex items-center justify-center font-bold text-[#556B5F]">
              {(user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
               <p className="text-xs font-black truncate">{user?.email}</p>
               <p className="text-[10px] font-bold text-success uppercase">Active Session</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3 rounded-[1.25rem] text-error font-black text-xs hover:bg-error/5 transition-all">
            <LogOut size={16} /> SIGN OUT
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 overflow-y-auto p-10 lg:p-14">

        {activeNav === 'overview' && (
          <div className="max-w-5xl">
            <header className="mb-12">
               <h1 className="text-4xl font-black mb-2">Welcome Back, Admin</h1>
               <p className="text-[#7A7A6E] text-base font-medium">Here's what's happening across your institute today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Pending Apps', val: stats.pending, icon: <Users className="text-warning" />, desc: 'Awaiting review' },
                { label: 'Form Fields', val: fields.length, icon: <ClipboardList className="text-sage" />, desc: 'Custom schema' },
                { label: 'Total Students', val: '—', icon: <Shield className="text-[#7A7A6E]" />, desc: 'Registered' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all group" style={{ borderColor: S.border }}>
                   <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ borderColor: S.border }}>
                      {s.icon}
                   </div>
                   <p className="text-4xl font-black mb-1">{s.val}</p>
                   <p className="text-sm font-bold opacity-60 uppercase tracking-wider">{s.label}</p>
                   <p className="text-[10px] text-[#7A7A6E] font-medium mt-4">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#556B5F] p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2 px-1">Expand Your Support Team</h3>
                  <p className="opacity-80 font-medium px-1 max-w-sm">There are currently {stats.pending} counselors awaiting approval to join your institute.</p>
                  <button onClick={() => setActiveNav('applications')} className="mt-8 bg-white text-[#556B5F] px-8 py-3 rounded-full font-black text-sm shadow-xl hover:scale-105 transition-transform">
                    View Applications
                  </button>
               </div>
               <div className="w-32 h-32 bg-white/10 rounded-full blur-3xl absolute -right-10 -bottom-10" />
               <div className="w-64 h-64 bg-white/5 rounded-full blur-3xl absolute -left-20 -top-20" />
            </div>
          </div>
        )}

        {activeNav === 'applications' && (
           <div className="max-w-5xl">
              <h1 className="text-3xl font-black mb-8">Counselor Applications</h1>
              {applications.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed" style={{ borderColor: S.border }}>
                   <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={40} />
                   </div>
                   <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
                   <p className="text-[#7A7A6E]">No pending counselor registration requests found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {applications.map(app => (
                     <div key={app.application_id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:border-[#556B5F] transition-all" style={{ borderColor: S.border }}>
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-14 h-14 rounded-2xl bg-[#EFF4F1] flex items-center justify-center text-xl font-black text-[#556B5F]">
                             {(app.counselor?.full_name || 'C')[0]}
                           </div>
                           <div>
                              <p className="font-black text-lg">{app.counselor?.full_name || 'New Counselor'}</p>
                              <p className="text-xs font-bold text-[#7A7A6E]">{app.counselor?.email}</p>
                           </div>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => handleApplicationAction(app.application_id, 'active')} disabled={actioningId === app.application_id} className="flex-1 bg-[#556B5F] text-white py-3.5 rounded-full font-black text-sm shadow-lg hover:bg-[#44554b] transition-all">
                             Approve
                           </button>
                           <button onClick={() => handleApplicationAction(app.application_id, 'rejected')} disabled={actioningId === app.application_id} className="flex-1 bg-white border-2 border-error text-error py-3.5 rounded-full font-black text-sm hover:bg-error/5 transition-all">
                             Reject
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        )}

        {activeNav === 'schema' && (
          <div className="max-w-6xl">
             <h1 className="text-3xl font-black mb-2">Registration Form Builder</h1>
             <p className="text-[#7A7A6E] mb-10 font-medium font-sm">Customize the fields students see when they register for your institute.</p>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="bg-white p-10 rounded-[3rem] border shadow-sm" style={{ borderColor: S.border }}>
                   <h3 className="text-xl font-black mb-8 border-b pb-4">Add Custom Field</h3>
                   <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-[#7A7A6E] tracking-widest block mb-2">Field Label</label>
                        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. University ID Number" className="w-full bg-[#FDFBF7] border p-4 rounded-2xl text-sm outline-none focus:ring-2 ring-[#556B5F]" style={{ borderColor: S.border }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-[#7A7A6E] tracking-widest block mb-2">Input Type</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#FDFBF7] border p-4 rounded-2xl text-sm outline-none" style={{ borderColor: S.border }}>
                           {['Text','Number','Phone','Date','Dropdown'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { if(!label) return; setFields([...fields, { label, type, required: true }]); setLabel(''); }} className="w-full bg-[#556B5F] text-white py-4 rounded-full font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-transform">
                        Add to Form
                      </button>
                   </div>

                   {fields.length > 0 && (
                     <div className="mt-12 space-y-3">
                        <h4 className="font-black text-xs uppercase opacity-30 tracking-[0.3em] mb-4">Active Fields</h4>
                        {fields.map((f, i) => (
                          <div key={i} className="bg-[#FDFBF7] p-4 rounded-2xl border flex justify-between items-center group" style={{ borderColor: S.border }}>
                             <span className="font-bold text-sm">{f.label} <span className="opacity-40 italic ml-1">({f.type})</span></span>
                             <button onClick={() => setFields(fields.filter((_, idx)=>idx!==i))} className="p-2 text-error opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                          </div>
                        ))}
                        <button onClick={saveSchema} className="w-full bg-white border-2 border-[#556B5F] text-[#556B5F] py-4 rounded-full font-black mt-8 hover:bg-[#556B5F] hover:text-white transition-all shadow-md">
                          Publish Registration Schema
                        </button>
                     </div>
                   )}
                </div>

                <div className="bg-[#EFF4F1] p-10 rounded-[3rem] border border-[#556B5F]/20 relative">
                   <div className="absolute top-8 right-8 bg-[#556B5F] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Live Preview</div>
                   <h3 className="text-xl font-black mb-8 border-b border-[#556B5F]/10 pb-4 text-[#556B5F]">Student Experience</h3>
                   
                   <div className="space-y-6">
                      <div className="opacity-40 pointer-events-none space-y-6">
                         <div><label className="text-[10px] font-black uppercase text-[#556B5F] tracking-widest block mb-2">FullName</label><div className="bg-white h-12 rounded-xl border border-[#556B5F]/10" /></div>
                         <div><label className="text-[10px] font-black uppercase text-[#556B5F] tracking-widest block mb-2">University Email</label><div className="bg-white h-12 rounded-xl border border-[#556B5F]/10" /></div>
                      </div>
                      
                      {fields.map((f, i) => (
                        <div key={i}>
                           <label className="text-[10px] font-black uppercase text-[#556B5F] tracking-widest block mb-2">{f.label}</label>
                           <div className="bg-white h-12 rounded-2xl border-2 border-[#556B5F]/20 flex items-center px-4 italic text-xs text-[#7A7A6E]">
                              Placeholder for {f.type} input...
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
