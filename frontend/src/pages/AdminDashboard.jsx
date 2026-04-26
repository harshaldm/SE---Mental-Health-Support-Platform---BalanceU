import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { 
  Users, Shield, ClipboardList, LogOut, CheckCircle, XCircle, Plus, Trash2, 
  ChevronRight, LayoutGrid, X, Heart, Briefcase
} from 'lucide-react';
import AdminStudents from './AdminStudents';
import AdminCounselors from './AdminCounselors';
import AdminProfile from './AdminProfile';
import { User as UserIcon } from 'lucide-react';

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
  { key: 'students',     label: 'Students',      Icon: Users },
  { key: 'applications', label: 'Counselors',    Icon: Briefcase },
];

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [activeNav, setActiveNav]           = useState('overview');

  const [applications, setApplications]     = useState([]);
  const [appsLoading, setAppsLoading]       = useState(false);
  const [actioningId, setActioningId]       = useState(null);
  const [stats, setStats] = useState({ students: null, counselors: null, pending: 0, averageMood: null, currentDate: '' });

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

  const fetchStats = useCallback(async () => {
    if (!token || !user?.institute_id) return;
    try {
      console.log(`[AdminDashboard.jsx : fetchData] -> Fetching counts for ${user.institute?.name || 'Institute'}.`);
      const res = await axios.get(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.stats) {
        setStats(s => ({
          ...s,
          students: res.data.stats.studentCount,
          counselors: res.data.stats.counselorCount,
          averageMood: res.data.stats.averageMood,
          currentDate: res.data.stats.currentDate
        }));
      }
    } catch (e) { console.error(e); }
  }, [token, user]);

  useEffect(() => {
    if (user?.institute_id) { 
      fetchApplications(); 
      fetchStats(); 

      // Poll every 60 seconds
      const pollInterval = setInterval(() => {
        fetchStats();
      }, 60000);

      return () => clearInterval(pollInterval);
    }
  }, [fetchApplications, fetchStats, user]);

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


  // DEBUG & HEADER LOGIC
  const displayName = user?.institute_name || localStorage.getItem('institute_name') || user?.full_name || "Admin";
  console.log("DEBUG: Current User Object ->", user);
  console.log("[AdminDashboard.jsx] -> Header state:", user ? 'Data Found' : 'Waiting for Auth');
  console.log("[AdminDashboard.jsx] -> UI Sync: Icon mapping updated for Counselors (Briefcase) and Students (Users).");
  console.log("[AdminDashboard.jsx] -> Icon color corrected to Sage Green (#556B5F) for visual consistency.");

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: S.cream, color: S.charcoal }}>

      {/* ── Sidebar ── */}
      <aside className="h-full flex flex-col p-8 border-r overflow-y-auto shrink-0" style={{ width: 280, backgroundColor: S.white, borderColor: S.border }}>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#556B5F] flex items-center justify-center text-white font-black text-lg">B</div>
            <h2 className="font-black text-xl tracking-tight">Balance<span className="text-[#556B5F]">U</span></h2>
          </div>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">{displayName}</p>
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
          <button 
            onClick={() => {
              console.log(`[AdminDashboard.jsx] -> Rendering Profile. Sidebar updated.`);
              setActiveNav('profile');
            }}
            className={`w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-[1.25rem] font-black text-xs transition-all ${
              activeNav === 'profile' ? 'bg-[#556B5F] text-white shadow-lg shadow-[#556B5F]/20' : 'text-[#7A7A6E] hover:bg-[#EFF4F1] hover:text-[#556B5F]'
            }`}
          >
            <UserIcon size={16} /> MY PROFILE
          </button>
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
               {user ? <h1 className="text-4xl font-black mb-2">Welcome Back, {displayName}</h1> : <h1 className="text-4xl font-black mb-2">Loading...</h1>}
               <p className="text-[#7A7A6E] text-base font-medium">Here's what's happening across your institute today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Total Counselors', val: stats.counselors !== null ? stats.counselors : '...', icon: <Briefcase className="text-[#556B5F]" />, desc: 'Clinical Hires' },
                { label: 'Average Mood', val: stats.averageMood !== null ? `${stats.averageMood} / 5` : '...', icon: <Heart className="text-[#556B5F]" />, desc: `Today, ${stats.currentDate || '...'}` },
                { label: 'Registered Students', val: stats.students !== null ? stats.students : '...', icon: <Users className="text-[#7A7A6E]" />, desc: 'Enrolled' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all group" style={{ borderColor: S.border }}>
                   <div className="w-12 h-12 rounded-2xl bg-[#EFF4F1] border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ borderColor: S.border }}>
                      {s.icon}
                   </div>
                   <p className="text-4xl font-black mb-1">
                     {s.val === '...' ? (
                       <span className="inline-block w-8 h-8 rounded-full border-4 border-[#EFF4F1] border-t-[#556B5F] animate-spin" />
                     ) : (
                       s.val
                     )}
                   </p>
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



        {activeNav === 'students' && (
          <AdminStudents />
        )}

        {activeNav === 'applications' && (
          <AdminCounselors token={token} user={user} />
        )}

        {activeNav === 'profile' && (
          <AdminProfile />
        )}
      </main>
    </div>
  );
}
