import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { AlertCircle, User, LogOut, Building2, Search, ChevronDown, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000';

const StatusBadge = ({ status }) => {
  const cfg = {
    active:   { icon: <CheckCircle size={12} />, label: 'Active',   cls: 'bg-primary/10 text-primary' },
    pending:  { icon: <Clock size={12} />,        label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
    rejected: { icon: <XCircle size={12} />,      label: 'Rejected', cls: 'bg-error/10 text-error' },
  }[status] || { icon: null, label: status, cls: 'bg-surface-variant text-on-surface-variant' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

export default function CounselorDashboard() {
  const { user, token, logout } = useAuth();

  // ─── Socket / Crisis Alerts ───
  const [crisisAlerts, setCrisisAlerts]   = useState([]);
  const [socket, setSocket]               = useState(null);

  // ─── Multi-tenant Institute State ───
  const [myInstitutes, setMyInstitutes]   = useState([]);   // all applications
  const [activeInstId, setActiveInstId]   = useState(
    () => localStorage.getItem('active_institute_id') || ''
  );

  // ─── Apply-to-Institute Panel ───
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [applySearch, setApplySearch]     = useState('');
  const [applyTarget, setApplyTarget]     = useState(null);
  const [applyLoading, setApplyLoading]   = useState(false);
  const [applyMsg, setApplyMsg]           = useState('');

  // ─── Student List ───
  const [students, setStudents]           = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ─── Fetch my institutes (applications list) ───
  const fetchMyInstitutes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/counselor/my-institutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyInstitutes(res.data.institutes || []);
      // Auto-select first active institute if nothing saved
      const active = res.data.institutes?.find(i => i.status === 'active');
      const saved  = localStorage.getItem('active_institute_id');
      if (!saved && active) {
        setActiveInstId(active.institute.id);
        localStorage.setItem('active_institute_id', active.institute.id);
      }
    } catch (err) {
      console.error('Failed to fetch institutes:', err.message);
    }
  }, [token]);

  // ─── Fetch all institutes for apply panel ───
  const fetchAllInstitutes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/institutes/list`);
      setAllInstitutes(res.data.institutes || []);
    } catch (err) {
      console.error('Failed to fetch all institutes:', err.message);
    }
  }, []);

  // ─── Fetch students for active institute ───
  const fetchStudents = useCallback(async (instId, search = '') => {
    if (!instId || !token) return;
    setStudentsLoading(true);
    try {
      const res = await axios.get(`${API}/api/counselor/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Active-Institute': instId,
        },
        params: search ? { search } : {},
      });
      setStudents(res.data.students || []);
    } catch (err) {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [token]);

  // ─── Socket setup ───
  useEffect(() => {
    const newSocket = io(API, { auth: { token } });
    newSocket.on('emergency_alert', (data) => {
      setCrisisAlerts(prev => [data, ...prev]);
      if (Notification.permission === 'granted') {
        new Notification('CRISIS ALERT RED', {
          body: `Student ${data.student_email}: "${data.message_text}"`,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    });
    newSocket.on('medication_missed', (data) => console.log('Medication Missed:', data));
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  // ─── On mount ───
  useEffect(() => {
    fetchMyInstitutes();
    fetchAllInstitutes();
  }, [fetchMyInstitutes, fetchAllInstitutes]);

  // ─── Re-fetch students when active institute changes ───
  useEffect(() => {
    if (activeInstId) fetchStudents(activeInstId);
  }, [activeInstId, fetchStudents]);

  // ─── Master Switcher handler ───
  const handleInstituteSwitch = (instId) => {
    setActiveInstId(instId);
    localStorage.setItem('active_institute_id', instId);
  };

  // ─── Apply to institute ───
  const handleApply = async () => {
    if (!applyTarget) return;
    setApplyLoading(true);
    setApplyMsg('');
    try {
      await axios.post(`${API}/api/counselor/apply`,
        { institute_id: applyTarget.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplyMsg(`✅ Application submitted to ${applyTarget.name}. Awaiting admin approval.`);
      setApplyTarget(null);
      fetchMyInstitutes(); // refresh the list
    } catch (err) {
      setApplyMsg(`❌ ${err.response?.data?.error || 'Failed to apply'}`);
    } finally {
      setApplyLoading(false);
    }
  };

  // Derived helpers
  const activeInstData = myInstitutes.find(i => i.institute?.id === activeInstId);
  const activeInstitutes = myInstitutes.filter(i => i.status === 'active');
  const filteredAllInstitutes = allInstitutes.filter(inst =>
    inst.name.toLowerCase().includes(applySearch.toLowerCase()) ||
    inst.type.toLowerCase().includes(applySearch.toLowerCase())
  );

  return (
    <div className="bg-surface min-h-screen p-6 lg:p-12">
      {/* ─── Header ─── */}
      <header className="flex flex-wrap justify-between items-start gap-4 mb-10">
        <div>
          <h1 className="text-display font-bold text-on-surface text-3xl lg:text-4xl">
            Good Morning, Counselor
          </h1>
          <p className="text-on-surface-variant text-base mt-1">
            Your multi-institute workspace for student support.
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-surface-container-high px-5 py-2.5 rounded-full font-bold text-on-surface hover:bg-surface-variant transition-colors text-sm"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* ─── MASTER SWITCHER ─── */}
      <section className="mb-8 bg-surface-container-low rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Building2 size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-on-surface">Active Institute</h2>
        </div>

        {activeInstitutes.length === 0 ? (
          <p className="text-on-surface-variant text-sm">
            No active institutes yet. Apply below to get started.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={activeInstId}
                onChange={e => handleInstituteSwitch(e.target.value)}
                className="appearance-none bg-surface border border-surface-variant px-4 pr-10 py-2.5 rounded-full text-sm font-bold text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="" disabled>Select an institute</option>
                {activeInstitutes.map(app => (
                  <option key={app.institute.id} value={app.institute.id}>
                    {app.institute.name} ({app.institute.type})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
            {activeInstData && (
              <StatusBadge status={activeInstData.status} />
            )}
          </div>
        )}

        {/* Applications status list */}
        {myInstitutes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {myInstitutes.map(app => (
              <div key={app.application_id} className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full text-xs text-on-surface-variant border border-surface-variant">
                <span className="font-semibold">{app.institute?.name}</span>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── CRISIS ALERTS ─── */}
      {crisisAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-error mb-4 flex items-center gap-2">
            <AlertCircle /> High Priority Alerts
          </h2>
          <div className="flex flex-col gap-4">
            {crisisAlerts.map((alert, idx) => (
              <div key={idx} className="bg-error-container/20 border border-error-container backdrop-blur-md p-6 rounded-[2rem] shadow-ambient flex justify-between items-start">
                <div>
                  <div className="font-bold text-error text-xl mb-1 flex items-center gap-2">
                    <User size={20} /> {alert.student_email || `Student ID: ${alert.student_id}`}
                  </div>
                  <p className="text-on-surface text-lg font-medium italic">"{alert.message_text}"</p>
                  <p className="text-on-surface-variant text-sm mt-4">Detected at {new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
                <button className="bg-error text-on-error px-6 py-3 rounded-full font-bold shadow-ambient">
                  Respond Immediately
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ─── Student List ─── */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-[2.5rem] p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-on-surface">Students</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => {
                  setStudentSearch(e.target.value);
                  fetchStudents(activeInstId, e.target.value);
                }}
                className="pl-8 pr-4 py-2 rounded-full bg-surface border border-surface-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {!activeInstId ? (
            <p className="text-on-surface-variant text-center py-8">Select an active institute above to view students.</p>
          ) : studentsLoading ? (
            <p className="text-on-surface-variant text-center py-8">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="text-on-surface-variant text-center py-8">No students found at this institute.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {students.map(student => (
                <div key={student.id} className="flex justify-between items-center bg-surface rounded-2xl px-5 py-4">
                  <div>
                    <p className="font-bold text-on-surface text-sm">{student.profile_details?.full_name || student.email}</p>
                    <p className="text-on-surface-variant text-xs">{student.email}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {new Date(student.registered_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Right Column ─── */}
        <div className="flex flex-col gap-6">
          {/* Apply to Institute Panel */}
          <div className="bg-surface-container rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold text-on-surface mb-2">Apply to Institute</h3>
            <p className="text-on-surface-variant text-sm mb-5">
              Search for institutes and submit your application. Admins will review and approve.
            </p>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search institutes..."
                value={applySearch}
                onChange={e => { setApplySearch(e.target.value); setApplyTarget(null); }}
                className="w-full pl-8 pr-4 py-2.5 rounded-full bg-surface border border-surface-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Institute list */}
            {applySearch && (
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-4 pr-1">
                {filteredAllInstitutes.length === 0 ? (
                  <p className="text-on-surface-variant text-xs text-center py-3">No institutes found.</p>
                ) : filteredAllInstitutes.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => setApplyTarget(inst)}
                    className={`text-left px-4 py-2.5 rounded-2xl text-sm transition-colors ${
                      applyTarget?.id === inst.id
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    <span className="font-semibold">{inst.name}</span>
                    <span className="text-xs opacity-70 ml-1">({inst.type})</span>
                  </button>
                ))}
              </div>
            )}

            {applyTarget && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 mb-4 text-sm">
                <span className="font-bold text-primary">{applyTarget.name}</span>
                <span className="text-on-surface-variant ml-1">selected</span>
              </div>
            )}

            {applyMsg && (
              <p className={`text-sm mb-3 ${applyMsg.startsWith('✅') ? 'text-primary' : 'text-error'}`}>
                {applyMsg}
              </p>
            )}

            <button
              onClick={handleApply}
              disabled={!applyTarget || applyLoading}
              className="w-full bg-primary text-on-primary rounded-full py-3 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {applyLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-container rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold text-on-surface mb-5">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button className="bg-primary text-on-primary rounded-full py-3.5 font-bold text-sm">
                Review Assessments
              </button>
              <button className="bg-surface-container-highest text-on-surface rounded-full py-3.5 font-bold text-sm">
                Add Wellness Resource
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
