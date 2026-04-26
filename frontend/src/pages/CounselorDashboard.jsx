import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { AlertCircle, User, LogOut, Building2, Search, ChevronDown, CheckCircle, Clock, XCircle, Inbox, Eye, X } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import ChatWindow from './ChatWindow';
import logger from '../utils/logger';

const API = BASE_URL;

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    active:   { icon: <CheckCircle size={12} />, label: 'Active',   cls: 'bg-primary/10 text-primary' },
    pending:  { icon: <Clock size={12} />,        label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
    rejected: { icon: <XCircle size={12} />,      label: 'Rejected', cls: 'bg-error/10 text-error' },
    accepted: { icon: <CheckCircle size={12} />, label: 'Accepted', cls: 'bg-primary/10 text-primary' },
  }[status] || { icon: null, label: status, cls: 'bg-surface-variant text-on-surface-variant' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Assessment Modal ───────────────────────────────────────────────────────
const AssessmentModal = ({ assessment, onClose, token }) => {
  const [assignForm, setAssignForm] = useState({ title: '', url: '', type: 'Article' });
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!assessment) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setMsg(null);
    try {
      await axios.post(`${API}/api/resources/assign`, {
        ...assignForm,
        student_id: assessment.student_id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: 'success', text: 'Resource assigned!' });
      setAssignForm({ title: '', url: '', type: 'Article' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Assignment failed' });
    } finally {
      setAssigning(false);
    }
  };
  
  // The responses might be in assessment.answers or assessment.responses
  const responses = assessment.answers || assessment.responses || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#FDFBF7] w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-[#E0D9CE]">
        <div className="p-6 border-b border-[#E0D9CE] flex justify-between items-center bg-[#556B5F] text-white">
          <div>
            <h2 className="text-xl font-bold">Detailed Clinical View</h2>
            <p className="text-sm opacity-80">Student: {assessment.studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-4">
             <div className="bg-white p-4 rounded-2xl border border-[#E0D9CE] flex-1">
               <p className="text-xs font-bold text-[#7A7A6E] uppercase mb-1">Total Score</p>
               <p className="text-2xl font-black text-[#556B5F]">{assessment.score}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-[#E0D9CE] flex-1">
               <p className="text-xs font-bold text-[#7A7A6E] uppercase mb-1">Risk Level</p>
               <p className={`text-xl font-black ${
                 assessment.riskLevel?.toLowerCase().includes('high') ? 'text-error' : 'text-[#556B5F]'
               }`}>{assessment.riskLevel}</p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-[#2C2C2C] border-l-4 border-[#556B5F] pl-3">Question Breakdown</h3>
            {responses.length === 0 ? (
               <p className="text-[#7A7A6E] text-center py-4 italic">No detailed responses available for this assessment.</p>
            ) : responses.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E0D9CE] shadow-sm">
                <p className="font-bold text-[#2C2C2C] mb-3">Q{idx + 1}: {item.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#EFF4F1] p-3 rounded-xl border border-[#556B5F]/20">
                    <p className="text-[10px] font-bold text-[#556B5F] uppercase mb-1">Response</p>
                    <p className="font-semibold text-[#2C2C2C]">{item.choiceLabel || item.label || item.choice || `Score: ${item.score}`}</p>
                  </div>
                  <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E0D9CE]">
                    <p className="text-[10px] font-bold text-[#7A7A6E] uppercase mb-1">Reflections</p>
                    <p className="text-[#2C2C2C] italic">{item.text || item.comment || 'No reflection provided.'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Assign Resource Form ── */}
          <div className="bg-[#556B5F]/5 p-6 rounded-[2rem] border border-[#556B5F]/20">
            <h3 className="font-bold text-[#556B5F] mb-4 flex items-center gap-2"> Prescribe Support Resource</h3>
            <form onSubmit={handleAssign} className="space-y-4">
               <div>
                 <label className="block text-[10px] font-bold text-[#7A7A6E] uppercase mb-1">Resource Title</label>
                 <input 
                   required
                   value={assignForm.title}
                   onChange={e => setAssignForm({...assignForm, title: e.target.value})}
                   className="w-full p-3 rounded-xl border border-[#E0D9CE] focus:ring-2 focus:ring-[#556B5F] outline-none text-sm"
                   placeholder="e.g. Guided Breathing for Anxiety"
                 />
               </div>
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-[#7A7A6E] uppercase mb-1">URL</label>
                   <input 
                     required
                     value={assignForm.url}
                     onChange={e => setAssignForm({...assignForm, url: e.target.value})}
                     className="w-full p-3 rounded-xl border border-[#E0D9CE] focus:ring-2 focus:ring-[#556B5F] outline-none text-sm"
                     placeholder="https://..."
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[#7A7A6E] uppercase mb-1">Type</label>
                   <select 
                     value={assignForm.type}
                     onChange={e => setAssignForm({...assignForm, type: e.target.value})}
                     className="p-3 rounded-xl border border-[#E0D9CE] focus:ring-2 focus:ring-[#556B5F] outline-none text-sm bg-white"
                   >
                     <option>Article</option>
                     <option>Video</option>
                     <option>Blog</option>
                   </select>
                 </div>
               </div>
               <button 
                type="submit"
                disabled={assigning}
                className="w-full bg-[#556B5F] text-white py-3 rounded-xl font-bold hover:bg-[#44554b] transition-all text-sm disabled:opacity-50"
               >
                 {assigning ? 'Assigning...' : 'Assign to Student'}
               </button>
               {msg && <p className={`text-center text-xs font-bold ${msg.type === 'success' ? 'text-primary' : 'text-error'}`}>{msg.text}</p>}
            </form>
          </div>
        </div>
        
        <div className="p-6 border-t border-[#E0D9CE] flex justify-end">
          <button onClick={onClose} className="bg-[#556B5F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#44554b] transition-colors shadow-lg">
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CounselorDashboard() {
  const { user, token, logout } = useAuth();

  // ─── State ───
  const [crisisAlerts, setCrisisAlerts]   = useState([]);
  const [socket, setSocket]               = useState(null);
  const [myInstitutes, setMyInstitutes]   = useState([]);
  const [activeInstId, setActiveInstId]   = useState(() => localStorage.getItem('active_institute_id') || '');
  const [activeSection, setActiveSection] = useState('students');
  const [requests, setRequests]           = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [respondingId, setRespondingId]   = useState(null);
  const [activeChat, setActiveChat]       = useState(null);
  const [students, setStudents]           = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // ─── Apply Panel State ───
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [applySearch, setApplySearch]     = useState('');
  const [applyTarget, setApplyTarget]     = useState(null);
  const [applyLoading, setApplyLoading]   = useState(false);
  const [applyMsg, setApplyMsg]           = useState('');

  // ─── Fetchers ───
  const fetchMyInstitutes = useCallback(async () => {
    if (!token) return;
    logger.start('CounselorDashboard', 'Fetch My Institutes');
    try {
      const res = await axios.get(`${API}/api/counselor/my-institutes`, { headers: { Authorization: `Bearer ${token}` } });
      setMyInstitutes(res.data.institutes || []);
      const active = res.data.institutes?.find(i => i.status === 'active');
      if (!localStorage.getItem('active_institute_id') && active) {
        setActiveInstId(active.institute.id);
        localStorage.setItem('active_institute_id', active.institute.id);
      }
      logger.success('CounselorDashboard', 'Fetch My Institutes');
    } catch (err) { 
      logger.error('CounselorDashboard', 'Fetch My Institutes', err);
    }
  }, [token]);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    logger.start('CounselorDashboard', 'Fetch Counseling Requests');
    setRequestsLoading(true);
    try {
      const res = await axios.get(`${API}/api/requests/my-requests`, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(res.data.requests || []);
      logger.success('CounselorDashboard', 'Fetch Counseling Requests');
    } catch (err) { 
      logger.error('CounselorDashboard', 'Fetch Counseling Requests', err);
    }
    finally { setRequestsLoading(false); }
  }, [token]);

  const fetchStudents = useCallback(async (instId, search = '') => {
    if (!instId || !token) return;
    setStudentsLoading(true);
    try {
      const res = await axios.get(`${API}/api/counselor/students`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Active-Institute': instId },
        params: search ? { search } : {},
      });
      setStudents(res.data.students || []);
    } catch (err) { setStudents([]); }
    finally { setStudentsLoading(false); }
  }, [token]);

  const respondToRequest = async (id, action) => {
    logger.start('CounselorDashboard', `Respond to Request: ${id} (${action})`);
    setRespondingId(id);
    try {
      const res = await axios.patch(`${API}/api/requests/${id}/respond`, { action }, { headers: { Authorization: `Bearer ${token}` } });
      const apptId = res.data?.appointment_id;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, appointment_id: apptId || r.appointment_id } : r));
      logger.success('CounselorDashboard', `Respond to Request: ${id}`);
    } catch (err) { 
      logger.error('CounselorDashboard', `Respond to Request: ${id}`, err);
      alert(err.response?.data?.error || 'Action failed'); 
    }
    finally { setRespondingId(null); }
  };

  // ─── Effects ───
  useEffect(() => {
    fetchMyInstitutes();
    axios.get(`${API}/api/institutes/list`).then(res => setAllInstitutes(res.data.institutes || [])).catch(() => {});
  }, [fetchMyInstitutes]);

  useEffect(() => { if (activeSection === 'requests') fetchRequests(); }, [activeSection, fetchRequests]);
  useEffect(() => { if (activeInstId) fetchStudents(activeInstId, studentSearch); }, [activeInstId, fetchStudents, studentSearch]);

  const handleApply = async () => {
    if (!applyTarget) return;
    setApplyLoading(true);
    try {
      await axios.post(`${API}/api/counselor/apply`, { institute_id: applyTarget.id }, { headers: { Authorization: `Bearer ${token}` } });
      setApplyMsg(`✅ Applied to ${applyTarget.name}`);
      setApplyTarget(null);
      fetchMyInstitutes();
    } catch (err) { setApplyMsg(`❌ ${err.response?.data?.error || 'Failed'}`); }
    finally { setApplyLoading(false); }
  };

  const openAssessment = async (req) => {
    // If responses are already in req.responses, use them. 
    // Otherwise, you might need an API call here. 
    // For now, mapping from req based on the user's description.
    setSelectedAssessment({
      student_id: req.student_id || req.student?.id,
      studentName: req.student?.name || 'Student',
      score: req.score,
      riskLevel: req.risk_level,
      answers: req.responses || req.quiz_result?.answers || []
    });
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen p-6 lg:p-12 text-[#2C2C2C]">
      <header className="flex flex-wrap justify-between items-start gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-[#2C2C2C]">Good Morning, Counselor</h1>
          <p className="text-[#7A7A6E] text-base mt-2">Manage your student support requests and ongoing consultations.</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 bg-[#556B5F] text-white px-6 py-3 rounded-full font-bold hover:bg-[#44554b] transition-all shadow-lg text-sm">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex gap-4 p-1.5 bg-[#E0D9CE]/30 rounded-full w-fit">
            {[ ['students', 'Students'], ['requests', 'Support Requests'] ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeSection === key ? 'bg-[#556B5F] text-white shadow-md' : 'text-[#7A7A6E] hover:text-[#2C2C2C]'
                }`}
              >
                {label}
                {key === 'requests' && requests.filter(r => r.status === 'pending').length > 0 && (
                   <span className="ml-2 bg-error text-white text-[10px] px-2 py-0.5 rounded-full ring-2 ring-white">
                     {requests.filter(r => r.status === 'pending').length}
                   </span>
                )}
              </button>
            ))}
          </div>

          {activeSection === 'students' ? (
            <div className="bg-white rounded-[2.5rem] border border-[#E0D9CE] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold">Your Students</h3>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A7A6E]" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="pl-12 pr-6 py-3 bg-[#FDFBF7] border border-[#E0D9CE] rounded-full text-sm focus:ring-2 focus:ring-[#556B5F] outline-none w-64 transition-all"
                  />
                </div>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-12 text-[#7A7A6E]">No students found in your active records.</div>
              ) : (
                <div className="divide-y divide-[#E0D9CE]">
                  {students.map(s => (
                    <div key={s.id} className="py-4 flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#EFF4F1] flex items-center justify-center font-bold text-[#556B5F] text-lg">
                          {(s.profile_details?.full_name || s.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#2C2C2C]">{s.profile_details?.full_name || 'Student'}</p>
                          <p className="text-xs text-[#7A7A6E]">{s.email}</p>
                        </div>
                      </div>
                      <button className="p-2 text-[#7A7A6E] hover:text-[#556B5F] rounded-full hover:bg-[#EFF4F1] transition-all opacity-0 group-hover:opacity-100">
                        <Eye size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-[#E0D9CE] p-8 shadow-sm">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Inbox size={22} className="text-[#556B5F]" /> Incoming Requests</h3>
               {requests.length === 0 ? (
                 <div className="text-center py-12 text-[#7A7A6E]">No active support requests at this time.</div>
               ) : (
                 <div className="space-y-4">
                    {requests.map(req => (
                      <div key={req.id} className="bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#E0D9CE] hover:border-[#556B5F] transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#556B5F] text-white flex items-center justify-center font-bold">
                              {(req.student.name || 'S')[0]}
                            </div>
                            <div>
                               <p className="font-bold text-lg">{req.student.name}</p>
                               <div className="flex gap-2 mt-1">
                                 <StatusBadge status={req.status} />
                                 {req.score != null && <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#E0D9CE] font-bold">📊 Score: {req.score}</span>}
                               </div>
                            </div>
                          </div>
                          <button onClick={() => openAssessment(req)} className="flex items-center gap-2 text-xs font-bold text-[#556B5F] hover:underline">
                            <Eye size={14} /> View Detailed Assessment
                          </button>
                        </div>

                        {req.status === 'pending' ? (
                          <div className="flex gap-3 mt-6">
                            <button onClick={() => respondToRequest(req.id, 'accepted')} disabled={respondingId === req.id} className="flex-1 bg-[#556B5F] text-white py-3 rounded-full font-bold hover:bg-[#44554b] transition-all text-sm">
                              Accept Request
                            </button>
                            <button onClick={() => respondToRequest(req.id, 'rejected')} disabled={respondingId === req.id} className="flex-1 bg-white border border-error text-error py-3 rounded-full font-bold hover:bg-error/5 transition-all text-sm">
                              Decline
                            </button>
                          </div>
                        ) : req.status === 'accepted' ? (
                          <button onClick={() => setActiveChat({ appointmentId: req.appointment_id, peerName: req.student.name })} className="w-full bg-[#556B5F]/10 text-[#556B5F] py-3 rounded-full font-black text-sm hover:bg-[#556B5F] hover:text-white transition-all mt-4 border border-[#556B5F]/20">
                            💬 Start Live Consultation
                          </button>
                        ) : null}
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#556B5F] p-8 rounded-[2.5rem] text-white shadow-xl">
            <h3 className="text-xl font-bold mb-2">Institute Status</h3>
            <p className="text-sm opacity-80 mb-6 font-medium">Your global standing across institutional portals.</p>
            <div className="space-y-3">
               {myInstitutes.map(inst => (
                 <div key={inst.application_id} className="bg-white/10 p-4 rounded-3xl flex justify-between items-center border border-white/10 hover:bg-white/20 transition-all cursor-default">
                    <span className="font-bold text-sm">{inst.institute?.name}</span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      inst.status === 'active' ? 'bg-white text-[#556B5F]' : 'bg-black/20 text-white'
                    }`}>{inst.status}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-[#E0D9CE] shadow-sm">
             <h3 className="text-xl font-bold mb-4">Apply to Institute</h3>
             <div className="space-y-4">
                <input
                  placeholder="Search by name..."
                  value={applySearch}
                  onChange={e => setApplySearch(e.target.value)}
                  className="w-full p-3 bg-[#FDFBF7] border border-[#E0D9CE] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#556B5F]"
                />
                <button onClick={handleApply} disabled={!applyTarget || applyLoading} className="w-full bg-[#556B5F] text-white py-3 rounded-full font-bold text-sm shadow-md disabled:bg-[#E0D9CE]">
                  Submit Application
                </button>
                {applyMsg && <p className="text-xs text-center font-medium mt-2">{applyMsg}</p>}
             </div>
          </div>
        </div>
      </div>

      <AssessmentModal assessment={selectedAssessment} onClose={() => setSelectedAssessment(null)} token={token} />
      
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
