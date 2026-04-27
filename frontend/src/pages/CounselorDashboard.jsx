import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { LayoutGrid, Users, ClipboardList, User as UserIcon, LogOut } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import ChatWindow from './ChatWindow';

import CounselorStudents from './CounselorStudents';
import SupportRequests from './SupportRequests';
import CounselorProfile from './CounselorProfile';
import CounselorOverview from './CounselorOverview';

const API = BASE_URL;

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

const NAV = [
  { key: 'overview', label: 'Overview', Icon: LayoutGrid },
  { key: 'students', label: 'Students', Icon: Users },
  { key: 'requests', label: 'Support Requests', Icon: ClipboardList },
];

export default function CounselorDashboard() {
  const { user, token, activeInstId, setActiveInstId, activeInstName, setActiveInstName, logout } = useAuth();

  // ─── State ───
  const [activeNav, setActiveNav]         = useState('overview');
  const [requests, setRequests]           = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [respondingId, setRespondingId]   = useState(null);
  const [activeChat, setActiveChat]       = useState(null);
  const [students, setStudents]           = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // ─── Fetchers ───
  const fetchMyInstitutes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/counselor/my-institutes`, { headers: { Authorization: `Bearer ${token}` } });
      const active = res.data.institutes?.find(i => i.status === 'active');
      if (active) {
        if (!localStorage.getItem('active_institute_id')) {
          setActiveInstId(active.institute.id);
          setActiveInstName(active.institute.name);
          localStorage.setItem('active_institute_id', active.institute.id);
          localStorage.setItem('active_institute_name', active.institute.name);
        }
      }
    } catch (err) {}
  }, [token, setActiveInstId, setActiveInstName]);

  const fetchRequests = useCallback(async () => {
    if (!token || !activeInstId) return;
    setRequestsLoading(true);
    try {
      const res = await axios.get(`${API}/api/requests/my-requests`, { 
        headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': activeInstId } 
      });
      setRequests(res.data.requests || []);
    } catch (err) {}
    finally { setRequestsLoading(false); }
  }, [token, activeInstId]);

  const fetchStudents = useCallback(async (instId, search = '') => {
    if (!instId || !token) return;
    try {
      const res = await axios.get(`${API}/api/counselor/students`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': instId },
        params: search ? { search } : {},
      });
      setStudents(res.data.students || []);
    } catch (err) { setStudents([]); }
  }, [token]);

  const respondToRequest = async (id, action) => {
    setRespondingId(id);
    try {
      const res = await axios.patch(`${API}/api/requests/${id}/respond`, { action }, { headers: { Authorization: `Bearer ${token}` } });
      const apptId = res.data?.appointment_id;

      if (action === 'accepted') {
        setRequests(prev => prev.filter(r => r.id !== id));
        fetchStudents(activeInstId, studentSearch); // Refresh students list to show new caseload member
        console.log(`[SupportRequests.jsx] -> Analysis logic synced with Admin-parity data. Student assigned to Caseload.`);
      } else {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, appointment_id: apptId || r.appointment_id } : r));
      }
    } catch (err) { 
      alert(err.response?.data?.error || 'Action failed'); 
    }
    finally { setRespondingId(null); }
  };

  const openAssessment = async (req) => {
    const studentId = req.student_id || req.student?.id;
    // Set basic data first so modal opens with existing info
    setSelectedAssessment({
      student_id: studentId,
      studentName: req.student?.name || 'Student',
      score: req.score,
      riskLevel: req.risk_level,
      loading: true
    });

    try {
      const res = await axios.get(`${API}/api/counselor/student-clinical/${studentId}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': activeInstId }
      });
      const report = res.data.latestReport;
      if (report) {
         setSelectedAssessment({
           student_id: studentId,
           studentName: req.student?.name || 'Student',
           score: report.total_score,
           riskLevel: report.risk_level,
           ai_analysis: report.ai_analysis,
           answers: report.question_responses,
           loading: false
         });
      }
    } catch (err) {
      console.error("[CounselorDashboard.jsx] -> Analysis sync failed:", err);
      // Fallback to local data if fetch fails
      setSelectedAssessment(prev => ({ ...prev, loading: false }));
    }
  };

  // ─── Effects ───
  useEffect(() => { fetchMyInstitutes(); }, [fetchMyInstitutes]);

  useEffect(() => { 
    if (activeNav === 'requests') fetchRequests(); 
    if (activeNav === 'students' && activeInstId) fetchStudents(activeInstId, studentSearch);
  }, [activeNav, fetchRequests, fetchStudents, activeInstId, studentSearch]);

  const instName = activeInstName || 'Select Institute';
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  useEffect(() => {
    if (activeInstName) {
      console.log(`[CounselorDashboard.jsx] -> Sidebar branding updated: Active Institute set to ${activeInstName}.`);
    }
    console.log(`[CounselorSidebar.jsx] -> Branding text wrap enabled. Truncation removed to match Admin dashboard aesthetics.`);
  }, [activeInstName]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: S.cream, color: S.charcoal }}>

      {/* ── Sidebar ── */}
      <aside className="h-full flex flex-col p-8 border-r overflow-y-auto shrink-0" style={{ width: 280, backgroundColor: S.white, borderColor: S.border }}>
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#556B5F] flex items-center justify-center text-white font-black text-lg">B</div>
            <h2 className="font-black text-xl tracking-tight">Balance<span className="text-[#556B5F]">U</span></h2>
          </div>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] leading-relaxed break-words">{instName}</p>
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
                {key === 'requests' && pendingCount > 0 && (
                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white text-[#556B5F]' : 'bg-error text-white'}`}>
                     {pendingCount}
                   </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t" style={{ borderColor: S.border }}>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-[#EFF4F1] border border-[#556B5F]/20 flex items-center justify-center font-bold text-[#556B5F]">
              {(user?.full_name || 'C')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
               <p className="text-xs font-black truncate">{user?.full_name || user?.email}</p>
               <p className="text-[10px] font-bold text-success uppercase">Active Session</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveNav('profile')}
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
          <CounselorOverview 
            user={user}
            stats={{
              studentCount: students.length,
              pendingRequests: pendingCount,
              avgRisk: students.length > 0 ? (students.some(s => s.risk_level === 'Severe') ? 'Severe' : 'Moderate') : 'N/A'
            }}
          />
        )}

        {activeNav === 'students' && (
          <CounselorStudents 
            students={students}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            token={token}
            activeInstId={activeInstId}
            setActiveChat={setActiveChat}
          />
        )}

        {activeNav === 'requests' && (
          <SupportRequests 
            requests={requests}
            openAssessment={openAssessment}
            respondToRequest={respondToRequest}
            respondingId={respondingId}
            setActiveChat={setActiveChat}
            selectedAssessment={selectedAssessment}
            setSelectedAssessment={setSelectedAssessment}
            token={token}
          />
        )}

        {activeNav === 'profile' && (
          <CounselorProfile setActiveNav={setActiveNav} />
        )}
      </main>

      {activeChat && (
        <ChatWindow
          appointmentId={activeChat.appointmentId}
          peerName={activeChat.peerName}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
